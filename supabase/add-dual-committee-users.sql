-- Add Implementation and Oversight committee access to specific users
-- Run this after migration 012_multiple_committees.sql

UPDATE profiles
SET committees = ARRAY['implementation', 'oversight']::TEXT[]
WHERE email IN ('jhoward@rpgcc.co.uk', 'sjohnson@rpgcc.co.uk', 'kdunn@rpgcc.co.uk')
  AND (committees IS NULL OR NOT (committees @> ARRAY['implementation']::TEXT[] AND committees @> ARRAY['oversight']::TEXT[]));

-- Verify the update
SELECT email, committee, committees 
FROM profiles 
WHERE email IN ('jhoward@rpgcc.co.uk', 'sjohnson@rpgcc.co.uk', 'kdunn@rpgcc.co.uk');
