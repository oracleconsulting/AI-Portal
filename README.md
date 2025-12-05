# AI Portal

A secure collaboration platform for AI committees at RPGCC. This portal enables the Implementation Committee and Oversight Committee to manage AI initiatives, track opportunities, and ensure proper governance.

## Features

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

Run the schema in your Supabase SQL Editor:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `supabase/schema.sql`
4. Run the SQL

This creates:
- `profiles` - User profiles with committee assignments
- `identification_forms` - Implementation committee forms
- `meeting_transcripts` - Oversight meeting records
- `oversight_suggestions` - Suggestions and ideas
- Row Level Security policies for each committee

### 4. Create Users

In Supabase Authentication:

1. Go to Authentication → Users
2. Click "Add user"
3. Enter email and password
4. After creation, update their profile in the database:

```sql
-- Assign to Implementation Committee
UPDATE profiles 
SET committee = 'implementation', full_name = 'John Smith'
WHERE email = 'john@example.com';

-- Assign to Oversight Committee  
UPDATE profiles 
SET committee = 'oversight', full_name = 'Jane Doe'
WHERE email = 'jane@example.com';

-- Make someone a chair
UPDATE profiles 
SET role = 'chair'
WHERE email = 'chair@example.com';
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

