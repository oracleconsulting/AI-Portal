-- /supabase/migrations/004_ai_tool_registry.sql
-- Registry of approved, evaluated, and banned AI tools

-- Tool category enum
CREATE TYPE tool_category AS ENUM (
  'llm_general',
  'llm_coding',
  'audit_specific',
  'tax_specific', 
  'data_extraction',
  'document_processing',
  'automation',
  'analytics',
  'transcription',
  'image_generation',
  'other'
);

-- Tool status enum  
CREATE TYPE tool_status AS ENUM (
  'proposed',
  'evaluating',
  'pilot',
  'approved',
  'approved_restricted',
  'deprecated',
  'banned'
);

-- Main AI tools registry table
CREATE TABLE ai_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  vendor TEXT NOT NULL,
  version TEXT,
  category tool_category NOT NULL,
  status tool_status DEFAULT 'proposed',
  
  -- Description and use cases
  description TEXT,
  approved_use_cases JSONB DEFAULT '[]',
  prohibited_use_cases JSONB DEFAULT '[]',
  
  -- Data handling
  data_classification_permitted TEXT DEFAULT 'internal' CHECK (data_classification_permitted IN ('public', 'internal', 'confidential', 'restricted')),
  data_residency TEXT,
  processes_pii BOOLEAN DEFAULT FALSE,
  processes_client_data BOOLEAN DEFAULT FALSE,
  
  -- Costs
  pricing_model TEXT,
  annual_cost DECIMAL(12,2),
  cost_per_unit DECIMAL(10,4),
  cost_notes TEXT,
  
  -- Security assessment
  security_assessment_date DATE,
  security_score INTEGER CHECK (security_score >= 1 AND security_score <= 5),
  security_notes TEXT,
  has_soc2 BOOLEAN DEFAULT FALSE,
  has_iso27001 BOOLEAN DEFAULT FALSE,
  gdpr_compliant BOOLEAN DEFAULT FALSE,
  
  -- Risk assessment
  risk_score INTEGER CHECK (risk_score >= 1 AND risk_score <= 5),
  risk_notes TEXT,
  
  -- Approval tracking
  proposed_by UUID REFERENCES auth.users(id),
  proposed_at TIMESTAMPTZ DEFAULT NOW(),
  evaluated_by UUID REFERENCES auth.users(id),
  evaluated_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  
  -- Linked proposal (if came from identification form)
  linked_form_id UUID REFERENCES identification_forms(id),
  
  -- Documentation
  vendor_url TEXT,
  documentation_url TEXT,
  internal_guidance_url TEXT,
  
  -- Review schedule
  next_review_date DATE,
  review_frequency_months INTEGER DEFAULT 12,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tool access permissions (which teams/roles can use which tools)
CREATE TABLE ai_tool_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID REFERENCES ai_tools(id) ON DELETE CASCADE,
  
  -- Permission scope (at least one must be set)
  team team_type,
  role TEXT,
  
  -- Access level
  access_level TEXT CHECK (access_level IN ('view', 'use', 'admin')) DEFAULT 'use',
  
  -- Conditions
  requires_training BOOLEAN DEFAULT FALSE,
  training_completed_by JSONB DEFAULT '[]',
  
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  notes TEXT
);

-- Tool usage tracking (for ROI measurement)
CREATE TABLE ai_tool_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID REFERENCES ai_tools(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  team team_type,
  
  usage_date DATE DEFAULT CURRENT_DATE,
  usage_type TEXT,
  usage_count INTEGER DEFAULT 1,
  tokens_used INTEGER,
  cost_incurred DECIMAL(10,4),
  
  -- Outcome tracking
  time_saved_minutes INTEGER,
  task_type TEXT,
  client_code TEXT,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ai_tools_status ON ai_tools(status);
CREATE INDEX idx_ai_tools_category ON ai_tools(category);
CREATE INDEX idx_ai_tool_usage_date ON ai_tool_usage(usage_date);
CREATE INDEX idx_ai_tool_usage_tool ON ai_tool_usage(tool_id);

-- RLS Policies
ALTER TABLE ai_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tool_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tool_usage ENABLE ROW LEVEL SECURITY;

-- Everyone can view approved tools
CREATE POLICY "All users can view approved tools" ON ai_tools
  FOR SELECT USING (status IN ('approved', 'approved_restricted', 'deprecated'));

-- Admins can manage all tools
CREATE POLICY "Admins can manage all tools" ON ai_tools
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Oversight committee can view all tools
CREATE POLICY "Oversight can view all tools" ON ai_tools
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND committee = 'oversight')
  );

-- Proposers can view their own proposals
CREATE POLICY "Users can view own proposals" ON ai_tools
  FOR SELECT USING (proposed_by = auth.uid());

-- Users can view their own usage
CREATE POLICY "Users view own usage" ON ai_tool_usage
  FOR SELECT USING (user_id = auth.uid());

-- Users can log their own usage
CREATE POLICY "Users log own usage" ON ai_tool_usage
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Admins and oversight can view all usage
CREATE POLICY "Admins view all usage" ON ai_tool_usage
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR committee = 'oversight'))
  );

-- Permissions policies
CREATE POLICY "Users can view permissions" ON ai_tool_permissions
  FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage permissions" ON ai_tool_permissions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Updated_at trigger
CREATE TRIGGER update_ai_tools_updated_at
  BEFORE UPDATE ON ai_tools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit trigger
CREATE TRIGGER audit_ai_tools
  AFTER INSERT OR UPDATE OR DELETE ON ai_tools
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

