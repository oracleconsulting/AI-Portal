-- /supabase/migrations/011_auto_approval_rules.sql
-- Auto-approval rules for streamlining oversight workflow

CREATE TABLE IF NOT EXISTS auto_approval_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  
  -- Conditions (all must be met)
  max_cost DECIMAL(10,2), -- Max cost for auto-approval
  max_risk_score INTEGER, -- Max risk score (1-5)
  allowed_data_classifications TEXT[], -- Allowed classifications
  allowed_teams team_type[], -- If set, only these teams
  allowed_categories TEXT[], -- Tool categories
  
  -- Requires all conditions OR any condition
  require_all_conditions BOOLEAN DEFAULT true,
  
  -- Action
  auto_approve BOOLEAN DEFAULT true, -- false = auto-reject
  approval_conditions TEXT, -- Conditions to attach to approval
  
  -- Audit
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Log auto-approval actions
CREATE TABLE IF NOT EXISTS auto_approval_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES auto_approval_rules(id),
  form_id UUID REFERENCES identification_forms(id),
  action TEXT NOT NULL, -- 'approved', 'rejected', 'escalated'
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_auto_approval_rules_active ON auto_approval_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_auto_approval_log_form ON auto_approval_log(form_id);
CREATE INDEX IF NOT EXISTS idx_auto_approval_log_rule ON auto_approval_log(rule_id);

-- RLS
ALTER TABLE auto_approval_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_approval_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin can manage rules" ON auto_approval_rules;
DROP POLICY IF EXISTS "Oversight can view rules" ON auto_approval_rules;
DROP POLICY IF EXISTS "Admin and oversight can view log" ON auto_approval_log;

CREATE POLICY "Admin can manage rules"
ON auto_approval_rules FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Oversight can view rules"
ON auto_approval_rules FOR SELECT
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND committee = 'oversight'));

CREATE POLICY "Admin and oversight can view log"
ON auto_approval_log FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() 
  AND (role = 'admin' OR committee = 'oversight')
));

-- Triggers
CREATE TRIGGER update_auto_approval_rules_updated_at
  BEFORE UPDATE ON auto_approval_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER audit_auto_approval_rules
  AFTER INSERT OR UPDATE OR DELETE ON auto_approval_rules
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

