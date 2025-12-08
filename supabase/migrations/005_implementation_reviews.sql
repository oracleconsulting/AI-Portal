-- /supabase/migrations/005_implementation_reviews.sql
-- Track actual outcomes vs projected for ROI validation

CREATE TYPE review_recommendation AS ENUM (
  'continue',
  'expand',
  'modify',
  'pause',
  'discontinue'
);

CREATE TABLE implementation_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES identification_forms(id) ON DELETE CASCADE,
  tool_id UUID REFERENCES ai_tools(id),
  
  -- Review timing
  review_type TEXT CHECK (review_type IN ('30_day', '90_day', '180_day', '365_day', 'ad_hoc')),
  review_date DATE NOT NULL,
  review_due_date DATE,
  
  -- Actual outcomes
  actual_time_saved JSONB, -- Same structure as time_savings in identification_forms
  actual_weekly_hours DECIMAL(10,2),
  actual_annual_value DECIMAL(12,2),
  actual_cost DECIMAL(12,2),
  actual_roi DECIMAL(10,2),
  
  -- Comparison to projections
  projected_weekly_hours DECIMAL(10,2),
  projected_annual_value DECIMAL(12,2),
  projected_cost DECIMAL(12,2),
  variance_percentage DECIMAL(10,2),
  
  -- Qualitative assessment
  user_satisfaction_score INTEGER CHECK (user_satisfaction_score >= 1 AND user_satisfaction_score <= 5),
  adoption_rate_percentage INTEGER CHECK (adoption_rate_percentage >= 0 AND adoption_rate_percentage <= 100),
  quality_impact TEXT CHECK (quality_impact IN ('improved', 'unchanged', 'declined')),
  
  -- Issues and learnings
  challenges_encountered TEXT,
  unexpected_benefits TEXT,
  lessons_learned TEXT,
  
  -- Recommendation
  recommendation review_recommendation NOT NULL,
  recommendation_notes TEXT,
  action_items JSONB DEFAULT '[]',
  
  -- Follow-up
  next_review_date DATE,
  requires_oversight_review BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_implementation_reviews_form ON implementation_reviews(form_id);
CREATE INDEX idx_implementation_reviews_date ON implementation_reviews(review_date DESC);
CREATE INDEX idx_implementation_reviews_due ON implementation_reviews(review_due_date);

-- View combining forms with their reviews
CREATE OR REPLACE VIEW implementation_with_reviews AS
SELECT 
  f.id AS form_id,
  f.problem_identified,
  f.solution,
  f.cost_of_solution AS projected_cost,
  f.status,
  f.created_at AS submitted_at,
  t.name AS tool_name,
  t.status AS tool_status,
  
  -- Latest review info
  r.id AS latest_review_id,
  r.review_date AS latest_review_date,
  r.actual_annual_value,
  r.actual_roi,
  r.variance_percentage,
  r.recommendation,
  r.user_satisfaction_score,
  
  -- Calculate projected annual value
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
  ) AS projected_annual_value,
  
  -- Review counts
  (SELECT COUNT(*) FROM implementation_reviews WHERE form_id = f.id) AS total_reviews,
  
  -- Is review overdue?
  CASE 
    WHEN f.status = 'completed' AND (
      SELECT MAX(review_date) FROM implementation_reviews WHERE form_id = f.id
    ) < CURRENT_DATE - INTERVAL '90 days' THEN TRUE
    WHEN f.status = 'in_progress' AND (
      SELECT MAX(review_date) FROM implementation_reviews WHERE form_id = f.id
    ) IS NULL AND f.updated_at < CURRENT_DATE - INTERVAL '30 days' THEN TRUE
    ELSE FALSE
  END AS review_overdue

FROM identification_forms f
LEFT JOIN ai_tools t ON t.linked_form_id = f.id
LEFT JOIN LATERAL (
  SELECT * FROM implementation_reviews 
  WHERE form_id = f.id 
  ORDER BY review_date DESC 
  LIMIT 1
) r ON TRUE
WHERE f.status IN ('in_progress', 'completed');

-- RLS
ALTER TABLE implementation_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Implementation committee can view reviews" ON implementation_reviews
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND committee IN ('implementation', 'oversight'))
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Implementation members can create reviews" ON implementation_reviews
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND committee = 'implementation')
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage reviews" ON implementation_reviews
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Updated_at trigger
CREATE TRIGGER update_implementation_reviews_updated_at
  BEFORE UPDATE ON implementation_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit trigger
CREATE TRIGGER audit_implementation_reviews
  AFTER INSERT OR UPDATE OR DELETE ON implementation_reviews
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

