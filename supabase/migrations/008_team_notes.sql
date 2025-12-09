-- /supabase/migrations/008_team_notes.sql
-- Team notes system for secure team-specific notes and meeting records

-- Team notes table
CREATE TABLE IF NOT EXISTS team_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team team_type NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  note_type TEXT NOT NULL DEFAULT 'general' CHECK (note_type IN ('general', 'meeting', 'decision', 'action_item')),
  
  -- Meeting-specific fields
  meeting_date DATE,
  attendees TEXT[],
  
  -- Action item fields
  assigned_to UUID REFERENCES auth.users(id),
  due_date DATE,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Tags for filtering
  tags TEXT[],
  
  -- Visibility
  is_private BOOLEAN DEFAULT false, -- Private to team
  
  -- Metadata
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_by_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns if they don't exist (for existing tables)
DO $$
BEGIN
  -- Add note_type if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'team_notes' AND column_name = 'note_type') THEN
    ALTER TABLE team_notes ADD COLUMN note_type TEXT NOT NULL DEFAULT 'general';
    ALTER TABLE team_notes ADD CONSTRAINT team_notes_note_type_check 
      CHECK (note_type IN ('general', 'meeting', 'decision', 'action_item'));
  END IF;
  
  -- Add other columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'team_notes' AND column_name = 'meeting_date') THEN
    ALTER TABLE team_notes ADD COLUMN meeting_date DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'team_notes' AND column_name = 'attendees') THEN
    ALTER TABLE team_notes ADD COLUMN attendees TEXT[];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'team_notes' AND column_name = 'assigned_to') THEN
    ALTER TABLE team_notes ADD COLUMN assigned_to UUID REFERENCES auth.users(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'team_notes' AND column_name = 'due_date') THEN
    ALTER TABLE team_notes ADD COLUMN due_date DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'team_notes' AND column_name = 'is_completed') THEN
    ALTER TABLE team_notes ADD COLUMN is_completed BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'team_notes' AND column_name = 'completed_at') THEN
    ALTER TABLE team_notes ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'team_notes' AND column_name = 'tags') THEN
    ALTER TABLE team_notes ADD COLUMN tags TEXT[];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'team_notes' AND column_name = 'is_private') THEN
    ALTER TABLE team_notes ADD COLUMN is_private BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'team_notes' AND column_name = 'created_by_name') THEN
    ALTER TABLE team_notes ADD COLUMN created_by_name TEXT;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_team_notes_team ON team_notes(team);
CREATE INDEX IF NOT EXISTS idx_team_notes_type ON team_notes(note_type);
CREATE INDEX IF NOT EXISTS idx_team_notes_created ON team_notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_team_notes_assigned ON team_notes(assigned_to) WHERE assigned_to IS NOT NULL;

-- RLS - Only team members can see team notes
ALTER TABLE team_notes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view notes for their team" ON team_notes;
DROP POLICY IF EXISTS "Users can create notes for their team" ON team_notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON team_notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON team_notes;
DROP POLICY IF EXISTS "Admins can view all notes" ON team_notes;

CREATE POLICY "Users can view notes for their team"
ON team_notes FOR SELECT
USING (
  team = (SELECT team FROM profiles WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users can create notes for their team"
ON team_notes FOR INSERT
WITH CHECK (
  team = (SELECT team FROM profiles WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users can update their own notes"
ON team_notes FOR UPDATE
USING (
  created_by = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users can delete their own notes"
ON team_notes FOR DELETE
USING (
  created_by = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_team_notes_updated_at ON team_notes;
CREATE TRIGGER update_team_notes_updated_at
  BEFORE UPDATE ON team_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Audit trigger (only if log_audit_event function exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'log_audit_event') THEN
    DROP TRIGGER IF EXISTS audit_team_notes ON team_notes;
    CREATE TRIGGER audit_team_notes
      AFTER INSERT OR UPDATE OR DELETE ON team_notes
      FOR EACH ROW EXECUTE FUNCTION log_audit_event();
  END IF;
END $$;

