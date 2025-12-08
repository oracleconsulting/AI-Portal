-- /supabase/migrations/002_audit_log.sql
-- Comprehensive audit trail for compliance and governance

-- Create audit action enum
CREATE TYPE audit_action AS ENUM (
  'create',
  'update', 
  'delete',
  'status_change',
  'approval',
  'rejection',
  'submission',
  'review',
  'comment'
);

-- Create audit log table
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action audit_action NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changed_by_name TEXT,
  changed_by_email TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  old_values JSONB,
  new_values JSONB,
  change_summary TEXT, -- Human-readable description
  ip_address INET,
  user_agent TEXT,
  session_id UUID
);

-- Index for efficient querying
CREATE INDEX idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_changed_at ON audit_log(changed_at DESC);
CREATE INDEX idx_audit_log_changed_by ON audit_log(changed_by);

-- RLS: Only admins and chairs can view audit logs
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all audit logs" ON audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'chair')
    )
  );

-- Function to automatically log changes
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
  v_user_name TEXT;
  v_user_email TEXT;
  v_change_summary TEXT;
BEGIN
  -- Get user details
  SELECT full_name, email INTO v_user_name, v_user_email
  FROM profiles WHERE id = auth.uid();
  
  -- Build change summary
  IF TG_OP = 'INSERT' THEN
    v_change_summary := 'Created new ' || TG_TABLE_NAME || ' record';
  ELSIF TG_OP = 'UPDATE' THEN
    v_change_summary := 'Updated ' || TG_TABLE_NAME || ' record';
  ELSIF TG_OP = 'DELETE' THEN
    v_change_summary := 'Deleted ' || TG_TABLE_NAME || ' record';
  END IF;

  INSERT INTO audit_log (
    table_name,
    record_id,
    action,
    changed_by,
    changed_by_name,
    changed_by_email,
    old_values,
    new_values,
    change_summary
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE TG_OP
      WHEN 'INSERT' THEN 'create'::audit_action
      WHEN 'UPDATE' THEN 'update'::audit_action
      WHEN 'DELETE' THEN 'delete'::audit_action
    END,
    auth.uid(),
    v_user_name,
    v_user_email,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    v_change_summary
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to existing tables
CREATE TRIGGER audit_identification_forms
  AFTER INSERT OR UPDATE OR DELETE ON identification_forms
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_oversight_suggestions
  AFTER INSERT OR UPDATE OR DELETE ON oversight_suggestions
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_meeting_transcripts
  AFTER INSERT OR UPDATE OR DELETE ON meeting_transcripts
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_profiles
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

