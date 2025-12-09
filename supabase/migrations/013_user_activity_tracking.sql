-- Migration: User Activity Tracking
-- Tracks user logins and activity for analytics

-- Create user_activity table
CREATE TABLE IF NOT EXISTS user_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('login', 'logout', 'page_view', 'action')),
  activity_details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON user_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_type ON user_activity(user_id, activity_type);

-- Create view for login statistics
CREATE OR REPLACE VIEW login_statistics AS
SELECT 
  p.id as user_id,
  p.email,
  p.full_name,
  p.committee,
  p.team,
  COUNT(ua.id) as total_logins,
  MAX(ua.created_at) as last_login,
  MIN(ua.created_at) as first_login,
  COUNT(DISTINCT DATE(ua.created_at)) as unique_login_days,
  COUNT(CASE WHEN ua.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as logins_last_7_days,
  COUNT(CASE WHEN ua.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as logins_last_30_days
FROM profiles p
LEFT JOIN user_activity ua ON p.id = ua.user_id AND ua.activity_type = 'login'
GROUP BY p.id, p.email, p.full_name, p.committee, p.team;

-- Enable RLS
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own activity
CREATE POLICY "Users can view own activity" ON user_activity
  FOR SELECT USING (auth.uid() = user_id);

-- Admins and chairs can view all activity
CREATE POLICY "Admins can view all activity" ON user_activity
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (role = 'admin' OR role = 'chair')
    )
  );

-- System can insert activity (via service role or triggers)
CREATE POLICY "System can insert activity" ON user_activity
  FOR INSERT WITH CHECK (true);

-- Grant access to view
GRANT SELECT ON login_statistics TO authenticated;

-- Create function to log login activity
CREATE OR REPLACE FUNCTION log_user_login(
  p_user_id UUID,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO user_activity (
    user_id,
    activity_type,
    ip_address,
    user_agent,
    session_id,
    activity_details
  )
  VALUES (
    p_user_id,
    'login',
    p_ip_address,
    p_user_agent,
    p_session_id,
    jsonb_build_object(
      'timestamp', NOW(),
      'source', 'web_portal'
    )
  )
  RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION log_user_login(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_user_login(UUID, TEXT, TEXT, TEXT) TO anon;

COMMENT ON TABLE user_activity IS 'Tracks user activity including logins, page views, and actions for analytics';
COMMENT ON VIEW login_statistics IS 'Aggregated login statistics per user';
COMMENT ON FUNCTION log_user_login IS 'Logs a user login event with optional metadata';

