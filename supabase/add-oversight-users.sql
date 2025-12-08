-- Add Oversight Committee Users with Temporary Passwords
-- Run this in Supabase SQL Editor to create users for prandall and kfoster

DO $$
DECLARE
  paul_user_id UUID;
  kevin_user_id UUID;
BEGIN
  -- Check if Paul Randall exists, if not create
  SELECT id INTO paul_user_id FROM auth.users WHERE email = 'prandall@rpgcc.co.uk';
  
  IF paul_user_id IS NULL THEN
    paul_user_id := gen_random_uuid();
    
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
      paul_user_id,
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
    );
    
    RAISE NOTICE 'Created user for Paul Randall: %', paul_user_id;
  ELSE
    RAISE NOTICE 'Paul Randall already exists: %', paul_user_id;
  END IF;

  -- Check if Kevin Foster exists, if not create
  SELECT id INTO kevin_user_id FROM auth.users WHERE email = 'kfoster@rpgcc.co.uk';
  
  IF kevin_user_id IS NULL THEN
    kevin_user_id := gen_random_uuid();
    
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
      kevin_user_id,
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
    );
    
    RAISE NOTICE 'Created user for Kevin Foster: %', kevin_user_id;
  ELSE
    RAISE NOTICE 'Kevin Foster already exists: %', kevin_user_id;
  END IF;

  -- Create/update profiles for these users
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

  RAISE NOTICE 'Profiles created/updated successfully';
END $$;

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
