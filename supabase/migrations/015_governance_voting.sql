-- Migration 015: Governance Voting System
-- Implements tiered approval workflows with fast-track and full oversight pathways

-- Create enums
DO $$ BEGIN
  CREATE TYPE vote_decision AS ENUM ('approve', 'reject', 'abstain', 'defer');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE approval_pathway AS ENUM ('fast_track', 'full_oversight', 'auto_approved', 'partner_escalation');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Voting records table
CREATE TABLE IF NOT EXISTS governance_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES identification_forms(id) ON DELETE CASCADE NOT NULL,
  voter_id UUID REFERENCES auth.users(id) NOT NULL,
  voter_name TEXT NOT NULL,
  decision vote_decision NOT NULL,
  pathway approval_pathway NOT NULL,
  
  -- Vote details
  vote_reason TEXT,
  conditions TEXT, -- Conditions attached to approval
  concerns TEXT,   -- Logged concerns even if approving
  
  -- Criteria check at time of vote
  criteria_snapshot JSONB, -- Snapshot of criteria evaluation
  all_criteria_met BOOLEAN,
  
  -- Metadata
  voted_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  
  UNIQUE(form_id, voter_id) -- One vote per person per form
);

-- Voting sessions (groups votes for a single proposal)
CREATE TABLE IF NOT EXISTS voting_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES identification_forms(id) ON DELETE CASCADE NOT NULL,
  
  -- Session type
  pathway approval_pathway NOT NULL,
  
  -- Timing
  initiated_at TIMESTAMPTZ DEFAULT NOW(),
  initiated_by UUID REFERENCES auth.users(id),
  deadline TIMESTAMPTZ, -- For full oversight: 5 business days
  closed_at TIMESTAMPTZ,
  
  -- Outcome
  outcome TEXT, -- 'approved', 'rejected', 'escalated', 'expired'
  outcome_reason TEXT,
  final_conditions TEXT,
  
  -- Vote counts (denormalized for quick access)
  votes_approve INTEGER DEFAULT 0,
  votes_reject INTEGER DEFAULT 0,
  votes_abstain INTEGER DEFAULT 0,
  votes_defer INTEGER DEFAULT 0,
  
  -- Fast-track specific
  fast_track_eligible BOOLEAN DEFAULT FALSE,
  fast_track_voters UUID[], -- Who can vote in fast-track
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(form_id) -- One active session per form
);

-- Approval criteria configuration
CREATE TABLE IF NOT EXISTS approval_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  
  -- Thresholds (nullable = not applicable)
  max_cost DECIMAL(12,2),
  max_risk_score INTEGER CHECK (max_risk_score BETWEEN 1 AND 5),
  allowed_data_classifications TEXT[], -- e.g., ['public', 'internal']
  
  -- Conditions
  require_approved_tool BOOLEAN DEFAULT TRUE,
  require_policy_acknowledgment BOOLEAN DEFAULT TRUE,
  require_training_complete BOOLEAN DEFAULT FALSE,
  
  -- Team restrictions (null = all teams)
  allowed_teams TEXT[],
  
  -- Which pathway this enables
  enables_pathway approval_pathway NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_to DATE,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dual-committee member designation
CREATE TABLE IF NOT EXISTS fast_track_voters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  designated_at TIMESTAMPTZ DEFAULT NOW(),
  designated_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT TRUE
);

-- Insert initial fast-track voters (James, Katy, Steve)
INSERT INTO fast_track_voters (user_id, designated_by)
SELECT p.id, p.id 
FROM profiles p
WHERE p.email IN ('jhoward@rpgcc.co.uk', 'kdunn@rpgcc.co.uk', 'sjohnson@rpgcc.co.uk')
ON CONFLICT (user_id) DO NOTHING;

-- Function to check if user is fast-track voter
CREATE OR REPLACE FUNCTION is_fast_track_voter(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM fast_track_voters 
    WHERE user_id = user_uuid AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to evaluate criteria for a form
CREATE OR REPLACE FUNCTION evaluate_approval_criteria(form_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  form_record RECORD;
  criteria_results JSONB := '[]'::JSONB;
  all_met BOOLEAN := TRUE;
  fast_track_eligible BOOLEAN := TRUE;
  criteria RECORD;
BEGIN
  -- Get the form
  SELECT * INTO form_record FROM identification_forms WHERE id = form_uuid;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Form not found');
  END IF;
  
  -- Evaluate each active criterion
  FOR criteria IN 
    SELECT * FROM approval_criteria 
    WHERE is_active = TRUE 
    AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
    ORDER BY enables_pathway
  LOOP
    DECLARE
      criterion_met BOOLEAN := TRUE;
      failure_reasons TEXT[] := '{}';
    BEGIN
      -- Check cost threshold
      IF criteria.max_cost IS NOT NULL AND form_record.cost_of_solution > criteria.max_cost THEN
        criterion_met := FALSE;
        failure_reasons := array_append(failure_reasons, 
          format('Cost £%s exceeds threshold £%s', form_record.cost_of_solution, criteria.max_cost));
      END IF;
      
      -- Check risk score
      IF criteria.max_risk_score IS NOT NULL AND COALESCE(form_record.risk_score, 0) > criteria.max_risk_score THEN
        criterion_met := FALSE;
        failure_reasons := array_append(failure_reasons, 
          format('Risk score %s exceeds threshold %s', COALESCE(form_record.risk_score, 0), criteria.max_risk_score));
      END IF;
      
      -- Check data classification
      IF criteria.allowed_data_classifications IS NOT NULL 
         AND form_record.data_classification IS NOT NULL
         AND NOT (form_record.data_classification = ANY(criteria.allowed_data_classifications)) THEN
        criterion_met := FALSE;
        failure_reasons := array_append(failure_reasons, 
          format('Data classification "%s" not in allowed list', form_record.data_classification));
      END IF;
      
      -- Check team restrictions
      IF criteria.allowed_teams IS NOT NULL 
         AND form_record.team IS NOT NULL
         AND NOT (form_record.team::TEXT = ANY(criteria.allowed_teams)) THEN
        criterion_met := FALSE;
        failure_reasons := array_append(failure_reasons, 
          format('Team "%s" not in allowed list', form_record.team));
      END IF;
      
      -- Build result
      criteria_results := criteria_results || jsonb_build_object(
        'criterion_id', criteria.id,
        'criterion_name', criteria.name,
        'pathway', criteria.enables_pathway,
        'met', criterion_met,
        'failure_reasons', failure_reasons
      );
      
      IF NOT criterion_met THEN
        all_met := FALSE;
        IF criteria.enables_pathway = 'fast_track' THEN
          fast_track_eligible := FALSE;
        END IF;
      END IF;
    END;
  END LOOP;
  
  RETURN jsonb_build_object(
    'form_id', form_uuid,
    'evaluated_at', NOW(),
    'all_criteria_met', all_met,
    'fast_track_eligible', fast_track_eligible,
    'criteria_results', criteria_results
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update vote counts in a session
CREATE OR REPLACE FUNCTION update_vote_counts(session_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE voting_sessions
  SET 
    votes_approve = (SELECT COUNT(*) FROM governance_votes WHERE form_id = voting_sessions.form_id AND decision = 'approve'),
    votes_reject = (SELECT COUNT(*) FROM governance_votes WHERE form_id = voting_sessions.form_id AND decision = 'reject'),
    votes_abstain = (SELECT COUNT(*) FROM governance_votes WHERE form_id = voting_sessions.form_id AND decision = 'abstain'),
    votes_defer = (SELECT COUNT(*) FROM governance_votes WHERE form_id = voting_sessions.form_id AND decision = 'defer'),
    updated_at = NOW()
  WHERE id = session_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_governance_votes_form ON governance_votes(form_id);
CREATE INDEX IF NOT EXISTS idx_governance_votes_voter ON governance_votes(voter_id);
CREATE INDEX IF NOT EXISTS idx_voting_sessions_form ON voting_sessions(form_id);
CREATE INDEX IF NOT EXISTS idx_voting_sessions_pathway ON voting_sessions(pathway);
CREATE INDEX IF NOT EXISTS idx_voting_sessions_closed ON voting_sessions(closed_at) WHERE closed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_approval_criteria_active ON approval_criteria(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_fast_track_voters_active ON fast_track_voters(is_active) WHERE is_active = TRUE;

-- Enable RLS
ALTER TABLE governance_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE voting_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE fast_track_voters ENABLE ROW LEVEL SECURITY;

-- RLS Policies for governance_votes
-- Oversight and Admin can view all votes
CREATE POLICY "Oversight can view votes" ON governance_votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (email = 'jhoward@rpgcc.co.uk' OR 'oversight' = ANY(committees))
    )
  );

-- Users can insert their own votes
CREATE POLICY "Users can vote" ON governance_votes
  FOR INSERT WITH CHECK (voter_id = auth.uid());

-- Users can update their own votes (before session closes)
CREATE POLICY "Users can update own votes" ON governance_votes
  FOR UPDATE USING (voter_id = auth.uid())
  WITH CHECK (voter_id = auth.uid());

-- RLS Policies for voting_sessions
-- Oversight and Admin can view all sessions
CREATE POLICY "Oversight can view sessions" ON voting_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (email = 'jhoward@rpgcc.co.uk' OR 'oversight' = ANY(committees))
    )
  );

-- Admin can manage sessions
CREATE POLICY "Admin manages sessions" ON voting_sessions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND email = 'jhoward@rpgcc.co.uk')
  );

-- RLS Policies for approval_criteria
-- Admin can manage criteria
CREATE POLICY "Admin manages criteria" ON approval_criteria
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND email = 'jhoward@rpgcc.co.uk')
  );

-- All authenticated can read active criteria
CREATE POLICY "Read active criteria" ON approval_criteria
  FOR SELECT USING (is_active = TRUE);

-- RLS Policies for fast_track_voters
-- Admin can manage fast-track voters
CREATE POLICY "Admin manages fast track voters" ON fast_track_voters
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND email = 'jhoward@rpgcc.co.uk')
  );

-- All authenticated can read active fast-track voters
CREATE POLICY "Read fast track voters" ON fast_track_voters
  FOR SELECT USING (is_active = TRUE);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_voting_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_voting_sessions_updated_at
  BEFORE UPDATE ON voting_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_voting_updated_at();

CREATE TRIGGER update_approval_criteria_updated_at
  BEFORE UPDATE ON approval_criteria
  FOR EACH ROW
  EXECUTE FUNCTION update_voting_updated_at();

-- Seed initial approval criteria for fast-track
INSERT INTO approval_criteria (name, description, max_cost, max_risk_score, allowed_data_classifications, enables_pathway, created_by)
SELECT 
  'Fast-Track: Low Cost, Low Risk',
  'Proposals under £5,000 with risk score ≤ 3 and public/internal data only',
  5000.00,
  3,
  ARRAY['public', 'internal'],
  'fast_track',
  p.id
FROM profiles p
WHERE p.email = 'jhoward@rpgcc.co.uk'
ON CONFLICT DO NOTHING;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_fast_track_voter(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION evaluate_approval_criteria(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_vote_counts(UUID) TO authenticated;

