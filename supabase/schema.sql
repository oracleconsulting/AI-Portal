-- AI Portal Database Schema
-- Run this in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE committee_type AS ENUM ('implementation', 'oversight');
CREATE TYPE identification_status AS ENUM ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'in_progress', 'completed');
CREATE TYPE priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE suggestion_category AS ENUM ('cost', 'security', 'risk', 'general');
CREATE TYPE suggestion_status AS ENUM ('pending', 'reviewed', 'approved', 'rejected');
CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high');

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    committee committee_type NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('member', 'chair', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Implementation Committee: Identification Forms
CREATE TABLE identification_forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    problem_identified TEXT NOT NULL,
    solution TEXT,
    cost_of_solution DECIMAL(12, 2),
    time_saving_hours DECIMAL(8, 2),
    time_saving_description TEXT,
    priority priority DEFAULT 'medium',
    status identification_status DEFAULT 'draft',
    submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    submitted_by_name TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Oversight Committee: Meeting Transcripts
CREATE TABLE meeting_transcripts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    meeting_date DATE NOT NULL,
    transcript TEXT NOT NULL,
    summary TEXT,
    action_items JSONB, -- Array of action items with id, description, assignee, due_date, completed
    committee committee_type NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Oversight Committee: Suggestions/Ideas
CREATE TABLE oversight_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category suggestion_category NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    estimated_cost DECIMAL(12, 2),
    risk_level risk_level,
    status suggestion_status DEFAULT 'pending',
    submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_identification_forms_status ON identification_forms(status);
CREATE INDEX idx_identification_forms_priority ON identification_forms(priority);
CREATE INDEX idx_identification_forms_submitted_by ON identification_forms(submitted_by);
CREATE INDEX idx_identification_forms_created_at ON identification_forms(created_at DESC);

CREATE INDEX idx_meeting_transcripts_committee ON meeting_transcripts(committee);
CREATE INDEX idx_meeting_transcripts_meeting_date ON meeting_transcripts(meeting_date DESC);

CREATE INDEX idx_oversight_suggestions_category ON oversight_suggestions(category);
CREATE INDEX idx_oversight_suggestions_status ON oversight_suggestions(status);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE identification_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE oversight_suggestions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Identification Forms policies
-- Implementation committee members can view all forms
CREATE POLICY "Implementation members can view forms" ON identification_forms
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND (committee = 'implementation' OR role = 'admin')
        )
    );

-- Oversight committee can also view forms for review
CREATE POLICY "Oversight can view forms" ON identification_forms
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND committee = 'oversight'
        )
    );

-- Implementation members can insert forms
CREATE POLICY "Implementation members can insert forms" ON identification_forms
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND (committee = 'implementation' OR role = 'admin')
        )
    );

-- Users can update their own forms
CREATE POLICY "Users can update own forms" ON identification_forms
    FOR UPDATE USING (submitted_by = auth.uid());

-- Chairs and admins can update any form
CREATE POLICY "Chairs can update forms" ON identification_forms
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND (role = 'chair' OR role = 'admin')
        )
    );

-- Meeting Transcripts policies
-- Committee members can view their committee's transcripts
CREATE POLICY "Committee members can view transcripts" ON meeting_transcripts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND (profiles.committee = meeting_transcripts.committee OR role = 'admin')
        )
    );

-- Committee members can insert transcripts for their committee
CREATE POLICY "Committee members can insert transcripts" ON meeting_transcripts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND (profiles.committee = meeting_transcripts.committee OR role = 'admin')
        )
    );

-- Creators can update their transcripts
CREATE POLICY "Creators can update transcripts" ON meeting_transcripts
    FOR UPDATE USING (created_by = auth.uid());

-- Oversight Suggestions policies
-- Oversight committee can view all suggestions
CREATE POLICY "Oversight can view suggestions" ON oversight_suggestions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND (committee = 'oversight' OR role = 'admin')
        )
    );

-- Oversight committee can insert suggestions
CREATE POLICY "Oversight can insert suggestions" ON oversight_suggestions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND (committee = 'oversight' OR role = 'admin')
        )
    );

-- Users can update their own suggestions
CREATE POLICY "Users can update own suggestions" ON oversight_suggestions
    FOR UPDATE USING (submitted_by = auth.uid());

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_identification_forms_updated_at
    BEFORE UPDATE ON identification_forms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meeting_transcripts_updated_at
    BEFORE UPDATE ON meeting_transcripts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_oversight_suggestions_updated_at
    BEFORE UPDATE ON oversight_suggestions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, committee, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE((NEW.raw_user_meta_data->>'committee')::committee_type, 'implementation'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'member')
    );
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Create trigger to auto-create profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

