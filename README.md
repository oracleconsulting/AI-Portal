# AI Portal

A secure collaboration platform for AI committees at RPGCC. This portal enables the Implementation Committee and Oversight Committee to manage AI initiatives, track opportunities, and ensure proper governance.

## Features

### Invite System
- **Email Invitations**: Send branded invites via Resend to committee members
- **Committee-specific Invites**: Separate invite flows for Implementation and Oversight
- **Self-service Signup**: Recipients click link, set password, auto-assigned to correct committee
- **Invite Management**: Admin page to track pending, accepted, and expired invites

### Implementation Committee Portal
- **Identification Forms**: Submit and track AI opportunities
  - Document problems/bottlenecks identified
  - Propose solutions (or flag items needing solutions)
  - Estimate costs and time savings
  - Calculate ROI automatically
  - Prioritise by urgency (low/medium/high/critical)
- **Analytics Dashboard**: View aggregate metrics
  - Total investment proposed
  - Time savings achieved
  - ROI analysis and rankings
- **Status Tracking**: Follow forms through the approval process

### Oversight Committee Portal
- **Suggestions & Ideas**: Submit cost, security, and risk suggestions
- **Meeting Transcripts**: 
  - Record meeting notes
  - Add action items with assignees and due dates
  - Generate summaries
  - Track action item completion
- **Implementation Review**: View and assess proposals from the Implementation Committee

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **Deployment**: Railway

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase project

### 1. Clone and Install

```bash
cd ai-portal
npm install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://baovfbsblkbibbbypnbf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_from_supabase
```

Find your anon key in the Supabase dashboard: Settings → API → anon public key

### 3. Set Up Database

Run the schemas in your Supabase SQL Editor:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run `supabase/schema.sql` (main schema)
4. Run `supabase/migrations/001_invites.sql` (invite system)

This creates:
- `profiles` - User profiles with committee assignments
- `identification_forms` - Implementation committee forms
- `meeting_transcripts` - Oversight meeting records
- `oversight_suggestions` - Suggestions and ideas
- `invites` - Pending invitations
- Row Level Security policies for each committee

### 4. Invite Users

The recommended way to add users is via the invite system:

1. Create an initial admin user manually in Supabase Auth
2. Update their profile to be an admin:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'admin@rpgcc.com';
   ```
3. Log in and go to `/admin/invites`
4. Send invites to committee members - they'll receive branded emails
5. Recipients click the link, set their password, and are auto-assigned to their committee

**Manual User Creation (Alternative):**

```sql
-- Assign to Implementation Committee
UPDATE profiles 
SET committee = 'implementation', full_name = 'John Smith'
WHERE email = 'john@rpgcc.com';

-- Assign to Oversight Committee  
UPDATE profiles 
SET committee = 'oversight', full_name = 'Jane Doe'
WHERE email = 'jane@rpgcc.com';
```

### 5. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3030

## Committee Access

- **Implementation Committee**: Access at `/implementation`
  - View dashboard with stats
  - Create identification forms
  - View all forms and filter/sort
  - See analytics

- **Oversight Committee**: Access at `/oversight`
  - View dashboard with proposals
  - Create and manage meeting transcripts
  - Submit suggestions (cost/security/risk)
  - Review implementation proposals

## Deployment on Railway

### 1. Connect Repository

1. Go to [Railway](https://railway.app)
2. Create new project → Deploy from GitHub
3. Select this repository

### 2. Configure Environment

Add these environment variables in Railway:

```
NEXT_PUBLIC_SUPABASE_URL=https://baovfbsblkbibbbypnbf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=AI Portal <noreply@yourdomain.com>
NEXT_PUBLIC_APP_URL=https://your-app.railway.app
```

### 3. Deploy

Railway will automatically build and deploy on push to main.

### 4. Configure Domain

1. Go to Settings → Domains
2. Add your custom domain or use the Railway-provided URL

## Project Structure

```
ai-portal/
├── app/
│   ├── layout.tsx          # Root layout with fonts
│   ├── page.tsx            # Landing page
│   ├── login/              # Authentication
│   ├── dashboard/          # Redirect based on committee
│   ├── implementation/     # Implementation committee portal
│   │   ├── page.tsx        # Dashboard
│   │   ├── new/            # New form
│   │   ├── forms/          # All forms
│   │   └── analytics/      # Analytics
│   └── oversight/          # Oversight committee portal
│       ├── page.tsx        # Dashboard
│       ├── transcripts/    # Meeting transcripts
│       └── suggestions/    # Suggestions
├── components/
│   └── Sidebar.tsx         # Navigation sidebar
├── lib/
│   ├── supabase/           # Supabase client config
│   └── utils.ts            # Utility functions
├── types/
│   └── database.ts         # TypeScript types
└── supabase/
    ├── schema.sql          # Database schema
    └── seed-users.sql      # Sample data
```

## Security

- Row Level Security (RLS) ensures committee members only see their committee's data
- Oversight committee can view Implementation proposals for review
- Chairs and admins have elevated permissions
- All authentication handled by Supabase

## Supabase Project Details

- **Project URL**: https://baovfbsblkbibbbypnbf.supabase.co
- **Project Name**: AI Portal
- **Region**: See Supabase dashboard

## License

Internal use only - RPGCC

