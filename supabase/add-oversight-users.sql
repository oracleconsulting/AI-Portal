-- Add Oversight Committee Users with Temporary Passwords
-- Run this in Supabase SQL Editor to create users for prandall and kfoster

-- Add Paul Randall
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'prandall@rpgcc.co.uk',
  crypt('RPGCC2024!', gen_salt('bf')),
  NOW(),
  NOW(),
  NULL,
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Paul Randall","committee":"oversight","role":"member"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
)
ON CONFLICT (email) DO NOTHING
RETURNING id;

-- Add Kevin Foster
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'kfoster@rpgcc.co.uk',
  crypt('RPGCC2024!', gen_salt('bf')),
  NOW(),
  NOW(),
  NULL,
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Kevin Foster","committee":"oversight","role":"member"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
)
ON CONFLICT (email) DO NOTHING
RETURNING id;

-- Create profiles for these users (trigger should handle this, but ensure it exists)
INSERT INTO profiles (id, email, full_name, committee, role, must_change_password)
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'full_name',
  (u.raw_user_meta_data->>'committee')::committee_type,
  (u.raw_user_meta_data->>'role')::text,
  TRUE
FROM auth.users u
WHERE u.email IN ('prandall@rpgcc.co.uk', 'kfoster@rpgcc.co.uk')
ON CONFLICT (id) DO UPDATE
SET 
  full_name = EXCLUDED.full_name,
  committee = EXCLUDED.committee,
  role = EXCLUDED.role,
  must_change_password = TRUE;

-- Verify users were created
SELECT 
  u.email,
  u.raw_user_meta_data->>'full_name' as name,
  p.committee,
  p.role,
  p.must_change_password,
  u.email_confirmed_at IS NOT NULL as email_confirmed
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email IN ('prandall@rpgcc.co.uk', 'kfoster@rpgcc.co.uk');

