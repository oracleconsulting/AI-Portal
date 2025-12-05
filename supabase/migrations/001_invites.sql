-- Invites Table for Committee Member Invitations
-- Run this after the main schema.sql

-- Create invites table
CREATE TABLE IF NOT EXISTS invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    committee committee_type NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('member', 'chair', 'admin')),
    token TEXT UNIQUE NOT NULL,
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for token lookups
CREATE INDEX idx_invites_token ON invites(token);
CREATE INDEX idx_invites_email ON invites(email);

-- Enable RLS
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Only admins and chairs can view invites
CREATE POLICY "Admins can view all invites" ON invites
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND (role = 'admin' OR role = 'chair')
        )
    );

-- Only admins and chairs can create invites
CREATE POLICY "Admins can create invites" ON invites
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND (role = 'admin' OR role = 'chair')
        )
    );

-- Allow public to read invites by token (for signup flow)
CREATE POLICY "Public can read invites by token" ON invites
    FOR SELECT USING (true);

-- Function to generate invite token
CREATE OR REPLACE FUNCTION generate_invite_token()
RETURNS TEXT AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

