-- /supabase/migrations/006_staff_rates.sql
-- Move hardcoded rates to configurable table with audit trail

CREATE TABLE staff_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_level TEXT NOT NULL UNIQUE,
  hourly_rate DECIMAL(10,2) NOT NULL,
  display_name TEXT,
  display_order INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_to DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Insert current rates
INSERT INTO staff_rates (staff_level, display_name, hourly_rate, display_order) VALUES
('admin', 'Admin', 80, 1),
('junior', 'Junior', 100, 2),
('senior', 'Senior', 120, 3),
('assistant_manager', 'Assistant Manager', 150, 4),
('manager', 'Manager', 175, 5),
('director', 'Director', 250, 6),
('partner', 'Partner', 400, 7);

-- Historical rates table for accurate retrospective calculations
CREATE TABLE staff_rates_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_level TEXT NOT NULL,
  hourly_rate DECIMAL(10,2) NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to maintain history
CREATE OR REPLACE FUNCTION maintain_rate_history()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.hourly_rate != NEW.hourly_rate THEN
    -- Close out old rate
    INSERT INTO staff_rates_history (staff_level, hourly_rate, effective_from, effective_to)
    VALUES (OLD.staff_level, OLD.hourly_rate, OLD.effective_from, CURRENT_DATE - 1);
    
    -- Set new effective date
    NEW.effective_from := CURRENT_DATE;
  END IF;
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_rate_history
  BEFORE UPDATE ON staff_rates
  FOR EACH ROW EXECUTE FUNCTION maintain_rate_history();

-- Function to get rate for a specific date (for historical calculations)
CREATE OR REPLACE FUNCTION get_staff_rate(p_staff_level TEXT, p_date DATE DEFAULT CURRENT_DATE)
RETURNS DECIMAL AS $$
DECLARE
  v_rate DECIMAL;
BEGIN
  -- Try current rates first
  SELECT hourly_rate INTO v_rate
  FROM staff_rates
  WHERE staff_level = p_staff_level
    AND effective_from <= p_date
    AND (effective_to IS NULL OR effective_to >= p_date)
    AND is_active = TRUE;
    
  IF v_rate IS NOT NULL THEN
    RETURN v_rate;
  END IF;
  
  -- Fall back to history
  SELECT hourly_rate INTO v_rate
  FROM staff_rates_history
  WHERE staff_level = p_staff_level
    AND effective_from <= p_date
    AND (effective_to IS NULL OR effective_to >= p_date)
  ORDER BY effective_from DESC
  LIMIT 1;
  
  RETURN COALESCE(v_rate, 100); -- Default fallback
END;
$$ LANGUAGE plpgsql;

-- RLS
ALTER TABLE staff_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_rates_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All users can view rates" ON staff_rates
  FOR SELECT USING (TRUE);

CREATE POLICY "Only admins can modify rates" ON staff_rates
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "All users can view rate history" ON staff_rates_history
  FOR SELECT USING (TRUE);

-- Audit
CREATE TRIGGER audit_staff_rates
  AFTER INSERT OR UPDATE OR DELETE ON staff_rates
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

