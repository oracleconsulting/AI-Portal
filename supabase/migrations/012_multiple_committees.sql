-- Migration: Support multiple committees per user
-- Allows users to be members of both Implementation and Oversight committees

-- Add committees array column (allows multiple committee membership)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS committees TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Migrate existing committee data to committees array
UPDATE profiles 
SET committees = ARRAY[committee::TEXT]
WHERE committees IS NULL OR array_length(committees, 1) IS NULL;

-- Set default committees based on existing committee value
UPDATE profiles 
SET committees = ARRAY[committee::TEXT]
WHERE array_length(committees, 1) IS NULL;

-- Add index for committee queries
CREATE INDEX IF NOT EXISTS idx_profiles_committees ON profiles USING GIN(committees);

-- Add function to check if user is in a committee
CREATE OR REPLACE FUNCTION is_user_in_committee(user_id UUID, committee_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE id = user_id 
    AND (committees @> ARRAY[committee_name]::TEXT[] OR committee::TEXT = committee_name)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_user_in_committee(UUID, TEXT) TO authenticated;

-- Update RLS policies to check committees array
-- Note: Existing policies should still work, but we add a helper for committee checks

COMMENT ON COLUMN profiles.committees IS 'Array of committees the user belongs to. Allows membership in both Implementation and Oversight committees.';
COMMENT ON COLUMN profiles.committee IS 'Primary committee (kept for backward compatibility). Use committees array for multiple committee support.';

