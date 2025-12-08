-- /supabase/migrations/007_policy_documents.sql
-- Store and version-control AI policies and guidelines

CREATE TYPE policy_status AS ENUM (
  'draft',
  'pending_approval',
  'approved',
  'superseded',
  'archived'
);

CREATE TYPE policy_category AS ENUM (
  'acceptable_use',
  'security',
  'data_handling',
  'procurement',
  'training',
  'governance',
  'compliance',
  'other'
);

CREATE TABLE policy_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identification
  policy_code TEXT UNIQUE,
  title TEXT NOT NULL,
  category policy_category NOT NULL,
  
  -- Content
  summary TEXT,
  content TEXT NOT NULL,
  
  -- Versioning
  version TEXT NOT NULL DEFAULT '1.0',
  previous_version_id UUID REFERENCES policy_documents(id),
  
  -- Status and approval
  status policy_status DEFAULT 'draft',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  effective_from DATE,
  effective_to DATE,
  review_date DATE,
  
  -- Scope
  applies_to_committees TEXT[] DEFAULT ARRAY['implementation', 'oversight'],
  applies_to_teams team_type[],
  
  -- Metadata
  owner UUID REFERENCES auth.users(id),
  author UUID REFERENCES auth.users(id),
  tags TEXT[],
  
  -- Attachments
  attachment_urls JSONB DEFAULT '[]',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Policy acknowledgments (track who has read/accepted policies)
CREATE TABLE policy_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID REFERENCES policy_documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledgment_type TEXT CHECK (acknowledgment_type IN ('read', 'accepted', 'trained')),
  ip_address INET,
  
  UNIQUE(policy_id, user_id)
);

-- RLS
ALTER TABLE policy_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_acknowledgments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All users can view approved policies" ON policy_documents
  FOR SELECT USING (status = 'approved' OR author = auth.uid() OR owner = auth.uid());

CREATE POLICY "Admins and oversight can manage policies" ON policy_documents
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR committee = 'oversight'))
  );

CREATE POLICY "Users can view own acknowledgments" ON policy_acknowledgments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own acknowledgments" ON policy_acknowledgments
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all acknowledgments" ON policy_acknowledgments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Indexes
CREATE INDEX idx_policy_status ON policy_documents(status);
CREATE INDEX idx_policy_category ON policy_documents(category);
CREATE INDEX idx_policy_acknowledgments_policy ON policy_acknowledgments(policy_id);
CREATE INDEX idx_policy_acknowledgments_user ON policy_acknowledgments(user_id);

-- Updated_at trigger
CREATE TRIGGER update_policy_documents_updated_at
  BEFORE UPDATE ON policy_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit
CREATE TRIGGER audit_policy_documents
  AFTER INSERT OR UPDATE OR DELETE ON policy_documents
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

