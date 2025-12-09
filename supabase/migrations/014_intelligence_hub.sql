-- Migration 014: Intelligence Hub - Competitive Intelligence and Industry News Tracking

-- Intelligence feed items
CREATE TABLE IF NOT EXISTS public.intelligence_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('industry', 'regulatory', 'technology', 'competitor')),
  title TEXT NOT NULL,
  summary TEXT,
  url TEXT NOT NULL,
  published_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- AI-enhanced fields
  ai_summary TEXT,
  ai_relevance_score INTEGER CHECK (ai_relevance_score >= 1 AND ai_relevance_score <= 10),
  ai_tags TEXT[],
  ai_competitors_mentioned TEXT[],
  ai_action_required BOOLEAN DEFAULT FALSE,
  
  -- User interaction
  is_read BOOLEAN DEFAULT FALSE,
  is_starred BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique URLs
  CONSTRAINT unique_intelligence_url UNIQUE (url)
);

-- Competitor profiles for tracking
CREATE TABLE IF NOT EXISTS public.competitor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  ranking INTEGER, -- UK Top 100 ranking
  website TEXT,
  linkedin_url TEXT,
  
  -- Known AI initiatives
  ai_platform_name TEXT, -- e.g., "Personas" for BDO
  ai_strategy_summary TEXT,
  known_ai_tools TEXT[],
  known_investments TEXT,
  
  -- Tracking
  last_announcement_date DATE,
  threat_level TEXT CHECK (threat_level IN ('low', 'medium', 'high')),
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Intelligence alerts (user-defined)
CREATE TABLE IF NOT EXISTS public.intelligence_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  keywords TEXT[] NOT NULL,
  competitors TEXT[],
  categories TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  notification_email BOOLEAN DEFAULT TRUE,
  notification_portal BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_intelligence_items_category ON public.intelligence_items(category);
CREATE INDEX IF NOT EXISTS idx_intelligence_items_published ON public.intelligence_items(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_intelligence_items_relevance ON public.intelligence_items(ai_relevance_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_intelligence_items_read ON public.intelligence_items(is_read);
CREATE INDEX IF NOT EXISTS idx_intelligence_items_starred ON public.intelligence_items(is_starred);
CREATE INDEX IF NOT EXISTS idx_intelligence_items_action_required ON public.intelligence_items(ai_action_required);
CREATE INDEX IF NOT EXISTS idx_intelligence_items_fetched ON public.intelligence_items(fetched_at DESC);

CREATE INDEX IF NOT EXISTS idx_competitor_profiles_threat ON public.competitor_profiles(threat_level);
CREATE INDEX IF NOT EXISTS idx_competitor_profiles_ranking ON public.competitor_profiles(ranking);

CREATE INDEX IF NOT EXISTS idx_intelligence_alerts_user ON public.intelligence_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_alerts_active ON public.intelligence_alerts(is_active);

-- Enable Row Level Security
ALTER TABLE public.intelligence_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intelligence_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for intelligence_items
-- All authenticated users can view intelligence items
CREATE POLICY "Authenticated users can view intelligence items" ON public.intelligence_items
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only admins can insert/update intelligence items (via API)
CREATE POLICY "Admins can manage intelligence items" ON public.intelligence_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email = 'jhoward@rpgcc.co.uk'
    )
  );

-- Users can update their own interaction fields (is_read, is_starred, notes)
CREATE POLICY "Users can update own interactions" ON public.intelligence_items
  FOR UPDATE USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies for competitor_profiles
-- All authenticated users can view competitor profiles
CREATE POLICY "Authenticated users can view competitor profiles" ON public.competitor_profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only admins can manage competitor profiles
CREATE POLICY "Admins can manage competitor profiles" ON public.competitor_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email = 'jhoward@rpgcc.co.uk'
    )
  );

-- RLS Policies for intelligence_alerts
-- Users can view and manage their own alerts
CREATE POLICY "Users can manage own alerts" ON public.intelligence_alerts
  FOR ALL USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_intelligence_items_updated_at
  BEFORE UPDATE ON public.intelligence_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competitor_profiles_updated_at
  BEFORE UPDATE ON public.competitor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_intelligence_alerts_updated_at
  BEFORE UPDATE ON public.intelligence_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed initial competitor profiles
INSERT INTO public.competitor_profiles (name, ranking, ai_platform_name, ai_strategy_summary, threat_level, known_ai_tools)
VALUES
  ('RSM UK', 7, 'AI Lab + IntellixCore Partnership', 'Most ambitious mid-tier strategy. AI Orchestration Platform, Tax Insight Platform, $1B US investment alignment.', 'high', ARRAY['IntellixCore', 'AI Lab']),
  ('BDO UK', 5, 'Personas', 'Microsoft Partner of the Year 2024. GPT-4 based proprietary platform for all 7,500 UK staff.', 'high', ARRAY['Personas', 'Chat BDO']),
  ('Grant Thornton UK', 6, 'GTAssist', 'Azure OpenAI based chatbot for 5,000+ staff. Dayshape for resource management.', 'medium', ARRAY['GTAssist', 'Dayshape']),
  ('Mazars UK', 8, 'AI Consulting Focus', 'Focus on AI consulting services for clients rather than aggressive internal deployment.', 'low', ARRAY[]::TEXT[]),
  ('Moore Kingston Smith', 15, NULL, 'Limited public AI announcements.', 'low', ARRAY[]::TEXT[]),
  ('Crowe UK', 10, NULL, 'Limited public AI announcements.', 'low', ARRAY[]::TEXT[])
ON CONFLICT (name) DO NOTHING;

