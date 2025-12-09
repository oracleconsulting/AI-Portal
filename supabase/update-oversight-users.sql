-- Update Paul Randall and Kevin Foster profiles
-- Sets full names, ensures oversight-only access, and sets must_change_password flag

-- Update Paul Randall
UPDATE profiles
SET 
  full_name = 'Paul Randall',
  committee = 'oversight',
  committees = ARRAY['oversight']::TEXT[],
  role = 'member',
  must_change_password = TRUE
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'prandall@rpgcc.co.uk'
);

-- Update Kevin Foster
UPDATE profiles
SET 
  full_name = 'Kevin Foster',
  committee = 'oversight',
  committees = ARRAY['oversight']::TEXT[],
  role = 'member',
  must_change_password = TRUE
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'kfoster@rpgcc.co.uk'
);

-- Also update auth.users metadata to ensure full_name is set
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{full_name}',
  '"Paul Randall"'
)
WHERE email = 'prandall@rpgcc.co.uk';

UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{full_name}',
  '"Kevin Foster"'
)
WHERE email = 'kfoster@rpgcc.co.uk';

-- Verify the updates
SELECT 
  u.email,
  p.full_name,
  p.committee,
  p.committees,
  p.role,
  p.must_change_password,
  u.raw_user_meta_data->>'full_name' as auth_metadata_name
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email IN ('prandall@rpgcc.co.uk', 'kfoster@rpgcc.co.uk');

