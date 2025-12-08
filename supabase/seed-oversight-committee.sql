-- Seed Oversight Committee Invites
-- Run this in Supabase SQL Editor to create invites for the Oversight Committee

-- First, get the admin user ID (you - jhoward@rpgcc.co.uk)
DO $$
DECLARE
  admin_id UUID;
BEGIN
  SELECT id INTO admin_id FROM auth.users WHERE email = 'jhoward@rpgcc.co.uk' LIMIT 1;
  
  -- Insert oversight committee invites
  INSERT INTO invites (email, committee, role, token, expires_at, created_by)
  VALUES
    -- James Howard - Chair (you'll already have access, but including for completeness)
    ('jhoward@rpgcc.co.uk', 'oversight', 'chair', encode(gen_random_bytes(32), 'hex'), NOW() + INTERVAL '30 days', admin_id),
    
    -- Steve Johnson
    ('sjohnson@rpgcc.co.uk', 'oversight', 'member', encode(gen_random_bytes(32), 'hex'), NOW() + INTERVAL '30 days', admin_id),
    
    -- Paul Randall
    ('prandall@rpgcc.co.uk', 'oversight', 'member', encode(gen_random_bytes(32), 'hex'), NOW() + INTERVAL '30 days', admin_id),
    
    -- Kevin Foster
    ('kfoster@rpgcc.co.uk', 'oversight', 'member', encode(gen_random_bytes(32), 'hex'), NOW() + INTERVAL '30 days', admin_id),
    
    -- Katie Dunn
    ('kdunn@rpgcc.co.uk', 'oversight', 'member', encode(gen_random_bytes(32), 'hex'), NOW() + INTERVAL '30 days', admin_id)
  ON CONFLICT DO NOTHING;
  
  RAISE NOTICE 'Oversight Committee invites created successfully!';
END $$;

-- Verify the invites were created
SELECT 
  email, 
  committee, 
  role, 
  CASE WHEN accepted_at IS NOT NULL THEN 'Accepted' 
       WHEN email_sent_at IS NOT NULL THEN 'Sent' 
       ELSE 'Pending' END as status,
  created_at
FROM invites 
WHERE committee = 'oversight'
ORDER BY created_at DESC;

