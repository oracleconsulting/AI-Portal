-- /supabase/migrations/010_tool_usage.sql
-- Tool usage tracking for ROI measurement

-- Check if table already exists (from migration 004)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_tool_usage') THEN
    CREATE TABLE ai_tool_usage (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tool_id UUID NOT NULL REFERENCES ai_tools(id) ON DELETE CASCADE,
      user_id UUID REFERENCES auth.users(id),
      
      -- Usage metrics
      usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
      usage_type TEXT NOT NULL DEFAULT 'query' CHECK (usage_type IN ('query', 'generation', 'analysis', 'other')),
      
      -- Quantitative metrics
      tokens_input INTEGER,
      tokens_output INTEGER,
      cost_estimate DECIMAL(10,4),
      duration_ms INTEGER,
      
      -- Qualitative
      task_category TEXT, -- e.g., 'document_review', 'research', 'drafting'
      success BOOLEAN DEFAULT true,
      
      -- Context
      team team_type,
      client_id TEXT, -- Anonymized client reference
      
      -- Metadata
      metadata JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Indexes for analytics
    CREATE INDEX idx_tool_usage_tool ON ai_tool_usage(tool_id);
    CREATE INDEX idx_tool_usage_date ON ai_tool_usage(usage_date);
    CREATE INDEX idx_tool_usage_user ON ai_tool_usage(user_id);
    CREATE INDEX idx_tool_usage_team ON ai_tool_usage(team);

    -- Daily aggregation view
    CREATE VIEW tool_usage_daily AS
    SELECT 
      tool_id,
      usage_date,
      team,
      COUNT(*) as total_uses,
      SUM(tokens_input) as total_tokens_input,
      SUM(tokens_output) as total_tokens_output,
      SUM(cost_estimate) as total_cost,
      AVG(duration_ms) as avg_duration_ms,
      COUNT(DISTINCT user_id) as unique_users,
      COUNT(CASE WHEN success THEN 1 END) as successful_uses
    FROM ai_tool_usage
    GROUP BY tool_id, usage_date, team;

    -- RLS
    ALTER TABLE ai_tool_usage ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Admin and oversight can view all usage"
    ON ai_tool_usage FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND (role = 'admin' OR committee = 'oversight')
      )
    );

    CREATE POLICY "Users can log their own usage"
    ON ai_tool_usage FOR INSERT
    WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

    CREATE POLICY "Users can view their own usage"
    ON ai_tool_usage FOR SELECT
    USING (user_id = auth.uid());
  END IF;
END $$;

