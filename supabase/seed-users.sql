-- Seed Users for AI Portal
-- Run this AFTER creating users in Supabase Auth dashboard
-- Replace the UUIDs with the actual user IDs from Supabase

-- Example: Update profiles for your committee members
-- After users sign up, you can update their committee assignment:

-- To assign a user to the Implementation Committee:
-- UPDATE profiles 
-- SET committee = 'implementation', role = 'member'
-- WHERE email = 'user@example.com';

-- To assign a user to the Oversight Committee:
-- UPDATE profiles 
-- SET committee = 'oversight', role = 'member'
-- WHERE email = 'user@example.com';

-- To make someone a committee chair:
-- UPDATE profiles 
-- SET role = 'chair'
-- WHERE email = 'chair@example.com';

-- To make someone an admin (access to both committees):
-- UPDATE profiles 
-- SET role = 'admin'
-- WHERE email = 'admin@example.com';

-- Sample data for testing (optional)
-- Uncomment and modify as needed

/*
-- Sample Identification Forms
INSERT INTO identification_forms (problem_identified, solution, cost_of_solution, time_saving_hours, time_saving_description, priority, status, submitted_by_name) VALUES
('Manual data entry for client onboarding takes 2+ hours per client', 'AI-powered document extraction and auto-population', 5000, 8, 'Reduces 2 hours per client to 15 minutes, approximately 4 clients per day', 'high', 'submitted', 'James Howard'),
('Weekly reports require manual compilation from 5 different systems', 'Automated reporting dashboard with AI summarisation', 12000, 10, 'Saves 2 hours per report, 5 reports per week', 'critical', 'approved', 'Sarah Thompson'),
('Client email classification is slow and error-prone', NULL, NULL, 5, 'Staff spend an hour daily sorting and prioritising emails', 'medium', 'draft', 'Mike Chen');

-- Sample Meeting Transcripts
INSERT INTO meeting_transcripts (title, meeting_date, transcript, summary, action_items, committee, created_by) VALUES
('Q4 2024 AI Security Review', '2024-12-01', 'Meeting started at 10:00 AM...', 'Reviewed security protocols for AI implementations. Approved new data handling guidelines.', 
 '[{"id": "1", "description": "Update security documentation", "assignee": "James", "due_date": "2024-12-15", "completed": false}, {"id": "2", "description": "Review vendor contracts", "assignee": "Sarah", "due_date": "2024-12-20", "completed": false}]'::jsonb,
 'oversight', NULL);

-- Sample Oversight Suggestions
INSERT INTO oversight_suggestions (category, title, description, estimated_cost, risk_level, status) VALUES
('security', 'Implement AI usage audit logging', 'Create comprehensive logging for all AI tool usage across the firm', 8000, 'low', 'pending'),
('cost', 'Consolidate AI tool subscriptions', 'Multiple teams using different AI tools - opportunity to negotiate enterprise deal', NULL, 'low', 'reviewed'),
('risk', 'Review data retention policies for AI training', 'Need to ensure AI tools are not retaining client data inappropriately', 2500, 'high', 'pending');
*/

