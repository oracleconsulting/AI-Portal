-- /supabase/migrations/009_ai_transcript_fields.sql
-- Add AI processing fields to meeting_transcripts

ALTER TABLE meeting_transcripts
ADD COLUMN IF NOT EXISTS ai_summary TEXT,
ADD COLUMN IF NOT EXISTS ai_action_items JSONB,
ADD COLUMN IF NOT EXISTS ai_processed_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_meeting_transcripts_ai_processed ON meeting_transcripts(ai_processed_at);

