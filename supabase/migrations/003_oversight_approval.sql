-- /supabase/migrations/003_oversight_approval.sql
-- Adds formal oversight review workflow to identification forms

-- Create oversight status enum
CREATE TYPE oversight_status AS ENUM (
  'not_required',
  'pending_review',
  'under_review', 
  'approved',
  'rejected',
  'deferred',
  'requires_changes'
);

-- Add oversight fields to identification_forms
ALTER TABLE identification_forms
ADD COLUMN IF NOT EXISTS oversight_status oversight_status DEFAULT 'not_required',
ADD COLUMN IF NOT EXISTS oversight_reviewed_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS oversight_reviewed_by_name TEXT,
ADD COLUMN IF NOT EXISTS oversight_reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS oversight_notes TEXT,
ADD COLUMN IF NOT EXISTS oversight_conditions TEXT,
ADD COLUMN IF NOT EXISTS risk_category TEXT,
ADD COLUMN IF NOT EXISTS risk_score INTEGER CHECK (risk_score >= 1 AND risk_score <= 5),
ADD COLUMN IF NOT EXISTS data_classification TEXT CHECK (data_classification IN ('public', 'internal', 'confidential', 'restricted')),
ADD COLUMN IF NOT EXISTS security_review_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS security_reviewed_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS security_reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS escalated_to_partner BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS partner_approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS partner_approved_at TIMESTAMPTZ;

-- Create oversight review queue view
CREATE OR REPLACE VIEW oversight_review_queue AS
SELECT 
  f.id,
  f.problem_identified,
  f.solution,
  f.cost_of_solution,
  f.time_savings,
  f.priority,
  f.status,
  f.oversight_status,
  f.submitted_by,
  f.submitted_by_name,
  f.created_at,
  f.updated_at,
  f.risk_category,
  f.risk_score,
  f.data_classification,
  p.team,
  -- Calculate annual value for prioritization
  (
    SELECT COALESCE(SUM(
      (ts->>'hours_per_week')::numeric * 
      CASE (ts->>'staff_level')
        WHEN 'admin' THEN 80
        WHEN 'junior' THEN 100
        WHEN 'senior' THEN 120
        WHEN 'assistant_manager' THEN 150
        WHEN 'manager' THEN 175
        WHEN 'director' THEN 250
        WHEN 'partner' THEN 400
        ELSE 100
      END * 52
    ), 0)
    FROM jsonb_array_elements(f.time_savings) AS ts
  ) AS annual_value,
  -- Days pending review
  EXTRACT(DAY FROM NOW() - f.updated_at)::integer AS days_pending
FROM identification_forms f
LEFT JOIN profiles p ON f.submitted_by = p.id
WHERE f.cost_of_solution >= 5000
  AND f.oversight_status IN ('pending_review', 'under_review', 'requires_changes')
ORDER BY 
  CASE f.priority 
    WHEN 'critical' THEN 1 
    WHEN 'high' THEN 2 
    WHEN 'medium' THEN 3 
    WHEN 'low' THEN 4 
  END,
  f.created_at ASC;

-- Function to auto-set oversight status when form is submitted
CREATE OR REPLACE FUNCTION set_oversight_status()
RETURNS TRIGGER AS $$
BEGIN
  -- When form is submitted and cost exceeds threshold
  IF NEW.status = 'submitted' AND NEW.cost_of_solution >= 5000 THEN
    NEW.oversight_status := 'pending_review';
  END IF;
  
  -- High risk items always require oversight regardless of cost
  IF NEW.risk_score >= 4 OR NEW.data_classification = 'restricted' THEN
    NEW.oversight_status := 'pending_review';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_oversight_status ON identification_forms;
CREATE TRIGGER trigger_set_oversight_status
  BEFORE INSERT OR UPDATE ON identification_forms
  FOR EACH ROW EXECUTE FUNCTION set_oversight_status();

-- Escalation thresholds table (configurable)
CREATE TABLE IF NOT EXISTS approval_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  threshold_name TEXT NOT NULL,
  min_amount DECIMAL(12,2),
  max_amount DECIMAL(12,2),
  required_approver_role TEXT NOT NULL,
  requires_security_review BOOLEAN DEFAULT FALSE,
  requires_partner_approval BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default thresholds
INSERT INTO approval_thresholds (threshold_name, min_amount, max_amount, required_approver_role, requires_security_review, requires_partner_approval) VALUES
('Standard', 0, 4999.99, 'chair', FALSE, FALSE),
('Elevated', 5000, 14999.99, 'chair', FALSE, FALSE),
('High Value', 15000, 49999.99, 'admin', TRUE, FALSE),
('Major Investment', 50000, NULL, 'admin', TRUE, TRUE)
ON CONFLICT DO NOTHING;

-- RLS for approval_thresholds
ALTER TABLE approval_thresholds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All users can view thresholds" ON approval_thresholds
  FOR SELECT USING (TRUE);

CREATE POLICY "Only admins can modify thresholds" ON approval_thresholds
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

