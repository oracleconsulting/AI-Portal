# RPGCC AI Portal - Complete System Overview

## Executive Summary

The RPGCC AI Portal is a secure, role-based web application designed to help RPGCC manage their AI implementation initiative across two committees: the **Implementation Committee** (identifying AI opportunities) and the **Oversight Committee** (governance, security, and funding).

**Current Version:** 3.0 (Phase 6 Complete - Advanced Features)  
**Last Updated:** January 2025  
**Status:** ✅ Production Live at ai.torsor.co.uk  
**Repository:** https://github.com/oracleconsulting/AI-Portal

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           RPGCC AI PORTAL ECOSYSTEM                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         ai.torsor.co.uk                                  │   │
│  │                    (Next.js 14 App Router)                               │   │
│  │                                                                          │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐  │   │
│  │  │  IMPLEMENTATION │  │    OVERSIGHT    │  │        ADMIN            │  │   │
│  │  │   COMMITTEE     │  │    COMMITTEE    │  │                         │  │   │
│  │  │                 │  │                 │  │  • User Management      │  │   │
│  │  │  • ID Forms     │  │  • Review Queue │  │  • Invite System        │  │   │
│  │  │  • Team Notes   │  │  • AI Tools     │  │  • Audit Log            │  │   │
│  │  │  • Reviews      │  │  • Policies     │  │  • Staff Rates          │  │   │
│  │  │  • Analytics    │  │  • Auto-Approval│  │  • Board Reports        │  │   │
│  │  │  • ROI Predict  │  │  • Transcripts  │  │                         │  │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────────┘  │   │
│  │                                                                          │   │
│  │  Teams: BSG | Audit | Tax | Corporate Finance | Bookkeeping | Admin      │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                     │                                           │
│                                     ▼                                           │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                           SUPABASE BACKEND                                │  │
│  │                                                                           │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │  PostgreSQL  │  │     Auth     │  │     RLS      │  │   Triggers   │  │  │
│  │  │   Database   │  │   (Users)    │  │  (Security)  │  │  (Auto-ops)  │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  │  │
│  │                                                                           │  │
│  │  URL: https://baovfbsblkbibbbypnbf.supabase.co                           │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                     │                                           │
│                                     ▼                                           │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                         EXTERNAL SERVICES                                 │  │
│  │                                                                           │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │   Railway    │  │    Resend    │  │  Anthropic   │  │  Cloudflare  │  │  │
│  │  │  (Hosting)   │  │   (Email)    │  │   (Claude)   │  │    (DNS)     │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 14.2.10 | React framework with App Router, SSR, and API routes |
| **React** | 18.3.1 | UI library |
| **TypeScript** | 5.5.4 | Type-safe JavaScript |
| **Tailwind CSS** | 3.4.10 | Utility-first CSS framework |
| **Lucide React** | 0.441.0 | Icon library |

### Backend & Database

| Technology | Purpose |
|------------|---------|
| **Supabase** | Managed PostgreSQL database with real-time capabilities |
| **PostgreSQL** | Relational database (via Supabase) |
| **Row Level Security (RLS)** | Database-level access control |
| **Supabase Auth** | Email/password authentication |

### External Services

| Service | Purpose |
|---------|---------|
| **Railway** | Container-based hosting and deployment |
| **Resend** | Transactional email service (invites, notifications) |
| **Anthropic Claude** | AI-powered features (summarization, ROI prediction) |
| **Cloudflare** | DNS management for torsor.co.uk domain |
| **GitHub** | Version control and repository hosting |

### Development Tools

| Tool | Purpose |
|------|---------|
| **ESLint** | Code linting |
| **TypeScript** | Static type checking |
| **Nixpacks** | Railway build configuration |

---

## Code Structure

### Directory Layout

```
ai-portal/
├── app/                          # Next.js App Router pages
│   ├── admin/                    # Admin-only pages
│   │   ├── audit-log/           # Audit log viewer
│   │   ├── invites/             # Invite management
│   │   └── settings/            # System settings
│   ├── api/                      # API routes
│   │   ├── ai/                  # AI-powered endpoints
│   │   │   ├── predict-roi/     # ROI prediction
│   │   │   └── summarize-transcript/ # Transcript summarization
│   │   ├── cron/                # Scheduled tasks
│   │   │   └── notifications/   # Automated notifications
│   │   ├── export/              # Data export endpoints
│   │   ├── invite/              # Invite management
│   │   ├── policies/            # Policy management
│   │   └── tools/               # Tool usage tracking
│   ├── implementation/           # Implementation Committee pages
│   │   ├── analytics/           # Analytics dashboards
│   │   ├── forms/               # Identification forms
│   │   ├── reviews/             # Implementation reviews
│   │   └── team-notes/          # Team-specific notes
│   ├── oversight/                # Oversight Committee pages
│   │   ├── auto-approval/       # Auto-approval rules
│   │   ├── policies/            # Policy management
│   │   ├── reviews/             # Review queue
│   │   ├── tools/               # AI tool registry
│   │   └── transcripts/         # Meeting transcripts
│   ├── reports/                  # Reporting pages
│   │   └── board-pack/          # Board reporting pack
│   ├── auth/                     # Auth callbacks
│   ├── change-password/          # Password change flow
│   ├── dashboard/                # Main dashboard
│   ├── invite/                   # Invite acceptance
│   ├── login/                    # Login page
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
├── components/                    # Reusable React components
│   ├── ExportButton.tsx          # CSV export component
│   ├── RPGCCLogo.tsx             # Logo component
│   ├── Sidebar.tsx               # Navigation sidebar
│   ├── StatusBadge.tsx           # Status badge component
│   └── TranscriptSummarizer.tsx  # AI transcript summarizer
├── lib/                           # Utility libraries
│   ├── services/                 # Business logic services
│   │   ├── auto-approval.ts      # Auto-approval logic
│   │   └── notifications.ts      # Email notification service
│   ├── supabase/                 # Supabase client configuration
│   │   ├── client.ts             # Browser client
│   │   ├── middleware.ts         # Middleware client
│   │   └── server.ts             # Server-side client
│   └── utils/                    # Utility functions
│       ├── export.ts             # CSV export utilities
│       ├── roi.ts                # ROI calculation functions
│       └── utils.ts              # General utilities
├── supabase/                      # Database files
│   ├── migrations/               # Database migrations
│   │   ├── 001_invites.sql
│   │   ├── 002_audit_log.sql
│   │   ├── 003_oversight_approval.sql
│   │   ├── 004_ai_tool_registry.sql
│   │   ├── 005_implementation_reviews.sql
│   │   ├── 006_staff_rates.sql
│   │   ├── 007_policy_documents.sql
│   │   ├── 008_team_notes.sql
│   │   ├── 009_ai_transcript_fields.sql
│   │   ├── 010_tool_usage.sql
│   │   └── 011_auto_approval_rules.sql
│   ├── schema.sql                # Complete database schema
│   ├── add-oversight-users.sql   # User seeding script
│   └── seed-oversight-committee.sql # Committee seeding
├── types/                         # TypeScript type definitions
│   └── database.ts               # Supabase database types
├── docs/                          # Documentation
│   ├── CRON_SETUP.md            # Cron job setup guide
│   ├── PHASE_6_IMPLEMENTATION.md # Phase 6 features
│   ├── ROADMAP.md               # Development roadmap
│   ├── SYSTEM_OVERVIEW.md       # This document
│   └── USER_CREDENTIALS.md      # User credentials
├── middleware.ts                  # Next.js middleware (auth)
├── next.config.js                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # Dependencies and scripts
└── railway.json                  # Railway deployment config
```

### Key Files

**Configuration:**
- `next.config.js` - Next.js configuration (ESLint disabled during builds)
- `tailwind.config.ts` - Tailwind with RPGCC brand colors
- `tsconfig.json` - TypeScript strict mode configuration
- `railway.json` - Railway deployment settings
- `nixpacks.toml` - Railway build configuration

**Core Application:**
- `middleware.ts` - Authentication and route protection
- `app/layout.tsx` - Root layout with metadata
- `components/Sidebar.tsx` - Navigation component

**Database:**
- `supabase/schema.sql` - Complete database schema
- `supabase/migrations/*.sql` - Incremental migrations
- `types/database.ts` - TypeScript types for database

---

## Programming Languages & Patterns

### Languages

- **TypeScript** (Primary) - All application code
- **SQL** - Database schema, migrations, functions, triggers
- **CSS** (via Tailwind) - Styling
- **JavaScript** (Minimal) - Configuration files

### Code Patterns

**Frontend:**
- **Server Components** - Default in Next.js App Router
- **Client Components** - Marked with `'use client'` for interactivity
- **Server Actions** - API routes for mutations
- **Type Safety** - Full TypeScript coverage with strict mode

**Backend:**
- **API Routes** - Next.js API routes (`/app/api/*/route.ts`)
- **Server-Side Rendering** - Dynamic pages with `export const dynamic = 'force-dynamic'`
- **Database Functions** - PostgreSQL functions for complex logic
- **Triggers** - Automatic audit logging and data validation

**State Management:**
- **React Hooks** - `useState`, `useEffect` for local state
- **Supabase Realtime** - (Available but not currently used)
- **Server State** - Fetched on each page load

---

## Security Architecture

### Authentication

- **Provider:** Supabase Auth
- **Method:** Email/password
- **Session Management:** HTTP-only cookies via `@supabase/ssr`
- **Password Policy:** Enforced by Supabase (minimum 6 characters)
- **First-Time Login:** Forced password change via `must_change_password` flag

### Authorization

**Row Level Security (RLS):**
- All tables have RLS enabled
- Policies based on:
  - User's committee membership
  - User's role (admin/chair/member)
  - User's team (for team-specific data)
  - Record ownership (`created_by`, `submitted_by`)

**Security Definer Functions:**
```sql
CREATE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Middleware Protection:**
- Route-level authentication checks
- Committee-based route restrictions
- Password change enforcement
- Graceful handling of missing environment variables

### Data Protection

- **Encryption:** HTTPS enforced (Railway/Cloudflare)
- **Database:** Supabase managed PostgreSQL with encryption at rest
- **API Keys:** Stored in Railway environment variables (never in code)
- **Audit Trail:** Complete audit log of all data changes
- **Data Classification:** Support for public/internal/confidential/restricted

### Security Best Practices

1. **No client-side secrets** - All API keys server-side only
2. **RLS on all tables** - Database-level access control
3. **Input validation** - TypeScript types + database constraints
4. **SQL injection prevention** - Parameterized queries via Supabase
5. **XSS prevention** - React's built-in escaping
6. **CSRF protection** - SameSite cookies
7. **Rate limiting** - Resend API (600ms between emails)

---

## Database Schema

### Core Tables

#### `profiles` (extends `auth.users`)
```sql
- id (uuid, PK, FK → auth.users)
- email (text, unique)
- full_name (text)
- committee (enum: 'implementation' | 'oversight')
- team (enum: 'bsg' | 'audit' | 'tax' | 'corporate_finance' | 'bookkeeping' | 'admin')
- role (text: 'member' | 'chair' | 'admin')
- must_change_password (boolean)
- created_at, updated_at (timestamptz)
```

#### `identification_forms` (Implementation Committee)
```sql
- id (uuid, PK)
- problem_identified (text, required)
- solution (text)
- cost_of_solution (decimal)
- time_savings (jsonb) -- Array of {staff_level, hours_per_week, weekly_value}
- priority (enum: 'low' | 'medium' | 'high' | 'critical')
- status (enum: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'in_progress' | 'completed')
- submitted_by (uuid, FK → auth.users)
- submitted_by_name (text)
- notes (text)
- team (team_type)
- oversight_status (enum: 'not_required' | 'pending_review' | 'under_review' | 'approved' | 'rejected' | 'deferred' | 'requires_changes')
- oversight_reviewed_by, oversight_reviewed_at
- oversight_notes, oversight_conditions
- risk_category (text)
- risk_score (integer 1-5)
- data_classification (enum: 'public' | 'internal' | 'confidential' | 'restricted')
- security_review_required (boolean)
- escalated_to_partner (boolean)
- created_at, updated_at
```

#### `ai_tools` (AI Tool Registry)
```sql
- id (uuid, PK)
- name, vendor, version (text)
- category (enum: llm_general, llm_coding, audit_specific, tax_specific, etc.)
- status (enum: proposed, evaluating, pilot, approved, approved_restricted, deprecated, banned)
- description, approved_use_cases (jsonb), prohibited_use_cases (jsonb)
- data_classification_permitted (text[])
- data_residency (text)
- processes_pii, processes_client_data (boolean)
- pricing_model, annual_cost, cost_per_unit
- security_score, risk_score (integer 1-5)
- has_soc2, has_iso27001, gdpr_compliant (boolean)
- proposed_by, approved_by (uuid, FK)
- linked_form_id (uuid, FK → identification_forms)
- next_review_date, review_frequency_months
- created_at, updated_at
```

#### `implementation_reviews` (Post-Implementation Reviews)
```sql
- id (uuid, PK)
- form_id (uuid, FK → identification_forms)
- tool_id (uuid, FK → ai_tools)
- review_type (enum: 30_day, 90_day, 180_day, 365_day, ad_hoc)
- review_date, review_due_date
- actual_time_saved (jsonb), actual_weekly_hours, actual_annual_value
- actual_cost, actual_roi
- projected_weekly_hours, projected_annual_value, projected_cost
- variance_percentage
- user_satisfaction_score (integer 1-5)
- adoption_rate_percentage
- quality_impact (enum: improved, unchanged, declined)
- challenges_encountered, unexpected_benefits, lessons_learned (text)
- recommendation (enum: continue, expand, modify, pause, discontinue)
- recommendation_notes, action_items (jsonb)
- next_review_date, requires_oversight_review (boolean)
- reviewed_by, reviewed_by_name
- created_at, updated_at
```

#### `audit_log` (Audit Trail)
```sql
- id (uuid, PK)
- table_name, record_id (text, uuid)
- action (enum: create, update, delete, status_change, approval, rejection, etc.)
- changed_by, changed_by_name, changed_by_email
- changed_at (timestamptz)
- old_values, new_values (jsonb)
- change_summary (text)
- ip_address, user_agent, session_id (text)
```

#### `staff_rates` (Configurable Staff Rates)
```sql
- id (uuid, PK)
- staff_level (text, unique)
- hourly_rate (decimal)
- display_name, display_order (text, integer)
- is_active, effective_from, effective_to
- updated_by (uuid, FK)
- created_at, updated_at
```

#### `policy_documents` (Policy Management)
```sql
- id (uuid, PK)
- policy_code, title, category (text)
- summary, content (text)
- version, previous_version_id
- status (enum: draft, pending_approval, approved, superseded, archived)
- approved_by, approved_at
- effective_from, effective_to, review_date
- applies_to_committees (text[]), applies_to_teams (team_type[])
- owner, author (uuid, FK)
- tags (text[]), attachment_urls (jsonb)
- created_at, updated_at
```

#### `team_notes` (Team-Specific Notes)
```sql
- id (uuid, PK)
- team (team_type)
- title, content (text)
- note_type (enum: 'general' | 'meeting' | 'decision' | 'action_item')
- meeting_date, due_date (date)
- attendees (text[]), tags (text[])
- assigned_to (uuid, FK → auth.users)
- is_completed, completed_at (boolean, timestamptz)
- is_private (boolean)
- created_by, created_by_name
- created_at, updated_at
```

#### `ai_tool_usage` (Tool Usage Tracking)
```sql
- id (uuid, PK)
- tool_id (uuid, FK → ai_tools)
- user_id (uuid, FK → auth.users)
- usage_date (date)
- usage_type (enum: 'query' | 'generation' | 'analysis' | 'other')
- tokens_input, tokens_output (integer)
- cost_estimate (decimal)
- duration_ms (integer)
- task_category (text)
- success (boolean)
- team (team_type)
- client_id (text)
- metadata (jsonb)
- created_at
```

#### `auto_approval_rules` (Auto-Approval System)
```sql
- id (uuid, PK)
- name, description (text)
- is_active (boolean)
- max_cost (decimal)
- max_risk_score (integer)
- allowed_data_classifications (text[])
- allowed_teams (team_type[])
- require_all_conditions (boolean)
- auto_approve (boolean)
- approval_conditions (text)
- created_by (uuid, FK)
- created_at, updated_at
```

### Database Functions

**Audit Logging:**
- `log_audit_event()` - Trigger function for automatic audit logging

**Staff Rates:**
- `get_staff_rate(staff_level)` - Returns current hourly rate for staff level
- `maintain_rate_history()` - Trigger to maintain rate history

**Oversight Workflow:**
- `set_oversight_status()` - Trigger to auto-set oversight status based on thresholds

**Utility:**
- `update_updated_at_column()` - Trigger to auto-update `updated_at` timestamps
- `is_admin()` - Security definer function to check admin status

### Database Views

- `oversight_review_queue` - Forms requiring oversight review
- `implementation_with_reviews` - Forms with linked reviews
- `tool_usage_daily` - Daily aggregated tool usage statistics

---

## Application Routes

### Public Routes
- `/` - Landing page
- `/login` - Authentication page
- `/invite/[token]` - Accept invitation and set password
- `/change-password` - First-time password change

### Implementation Committee Routes
- `/implementation` - Dashboard
- `/implementation/forms` - All identification forms
- `/implementation/forms/[id]` - Form detail view
- `/implementation/forms/[id]/edit` - Edit form
- `/implementation/new` - Create new identification form
- `/implementation/reviews` - Post-implementation reviews dashboard
- `/implementation/reviews/new` - Create new review
- `/implementation/team-notes` - Team-specific notes
- `/implementation/analytics/roi-validation` - ROI validation dashboard
- `/implementation/analytics/teams` - Team performance dashboard

### Oversight Committee Routes
- `/oversight` - Dashboard
- `/oversight/reviews` - Review queue for high-value proposals
- `/oversight/tools` - AI Tool Registry listing
- `/oversight/tools/new` - Add new AI tool
- `/oversight/tools/[id]` - Tool detail view
- `/oversight/tools/[id]/edit` - Edit tool
- `/oversight/tools/[id]/permissions` - Manage tool permissions
- `/oversight/tools/[id]/usage` - Tool usage analytics
- `/oversight/policies` - Policy documents listing
- `/oversight/policies/new` - Create new policy
- `/oversight/policies/[id]/acknowledgments` - Policy acknowledgments
- `/oversight/auto-approval` - Auto-approval rules management
- `/oversight/suggestions` - All suggestions
- `/oversight/suggestions/new` - Create suggestion
- `/oversight/transcripts` - Meeting transcripts
- `/oversight/transcripts/new` - Add transcript
- `/oversight/analytics` - Analytics dashboard

### Admin Routes
- `/admin/invites` - Invite management
- `/admin/audit-log` - Complete audit trail viewer
- `/admin/settings/rates` - Staff rate management
- `/dashboard` - Committee selection (redirects based on user)

### Reporting Routes
- `/reports/board-pack` - Board reporting pack generator

---

## API Routes

### Authentication
- `POST /auth/callback` - Supabase auth callback

### Invites
- `POST /api/invite/send` - Send individual invite
- `POST /api/invite/send-bulk` - Send all pending invites

### AI Features
- `POST /api/ai/summarize-transcript` - AI-powered transcript summarization
- `POST /api/ai/predict-roi` - ROI prediction based on historical data

### Export
- `GET /api/export/forms` - Export identification forms as CSV
- `GET /api/export/tools` - Export AI tools as CSV
- `GET /api/export/reviews` - Export implementation reviews as CSV

### Tools
- `POST /api/tools/usage` - Log tool usage
- `GET /api/tools/usage` - Get usage statistics

### Policies
- `POST /api/policies/send-reminders` - Send policy acknowledgment reminders

### Cron Jobs
- `GET /api/cron/notifications` - Automated notifications (protected by CRON_SECRET)

---

## Key Features

### 1. Identification Forms (Implementation Committee)

**Purpose:** Document AI opportunities with ROI calculations

**Features:**
- Multi-staff-level time savings input
- Automatic ROI calculation (weekly/annual value, ROI %, payback period)
- Risk assessment (category, score, data classification)
- Oversight workflow integration
- Status workflow: draft → submitted → under_review → approved → in_progress → completed
- Export to CSV

**ROI Calculation:**
```
Weekly Value = Σ (hours_per_week × staff_rate)
Annual Value = Weekly Value × 52
ROI = (Annual Value / Cost) × 100
Payback Period = (Cost / Annual Value) × 12 months
```

### 2. Oversight Review Queue

**Purpose:** Governance review of high-value proposals

**Features:**
- Auto-populated queue (≥£5k or high-risk)
- Priority sorting by form priority and days pending
- Quick actions: Approve, Reject, Defer, Request Changes
- Review notes and approval conditions
- Risk assessment display
- Annual value calculations

### 3. AI Tool Registry

**Purpose:** Centralized management of AI tools

**Features:**
- Tool lifecycle: proposed → evaluating → pilot → approved → deprecated/banned
- Security & risk scoring (1-5 scale)
- Compliance tracking (SOC2, ISO 27001, GDPR)
- Data classification permissions
- Approved/prohibited use cases
- Team-based permissions
- Usage tracking and analytics
- Review scheduling
- Export to CSV

### 4. Post-Implementation Reviews

**Purpose:** Track actual outcomes vs projected

**Features:**
- Scheduled reviews: 30, 90, 180, 365 days
- Actual vs projected comparison with variance
- User satisfaction scoring (1-5)
- Adoption rate tracking
- Quality impact assessment
- Challenges, benefits, lessons learned
- Recommendations: continue, expand, modify, pause, discontinue
- Action items and next review scheduling
- Export to CSV

### 5. Audit Logging System

**Purpose:** Complete compliance trail

**Features:**
- Automatic logging of all create/update/delete operations
- Tracks: user, timestamp, old/new values, change summary
- Searchable and filterable by table, action, user, date range
- Admin/chair-only access

### 6. Team Notes System

**Purpose:** Secure team-specific notes and meeting records

**Features:**
- Note types: general, meeting, decision, action item
- Tags for filtering
- Action item tracking with due dates
- Team isolation via RLS
- Meeting date tracking
- Attendee lists

### 7. AI-Powered Features

**Transcript Summarization:**
- Automatic summarization using Claude AI
- Action item extraction
- Executive summary generation
- Key discussion points identification

**ROI Prediction:**
- Historical data analysis
- Team-specific adjustments
- Confidence levels and risk factors
- Recommendations for improvement

### 8. Auto-Approval Rules

**Purpose:** Streamline oversight workflow

**Features:**
- Configurable rules based on cost, risk, data classification, team
- All conditions or any condition logic
- Auto-approve or auto-reject actions
- Approval conditions attachment
- Audit log of all auto-approval actions

### 9. Tool Usage Tracking

**Purpose:** Monitor AI tool adoption and costs

**Features:**
- Usage logging (tokens, cost, duration)
- Daily aggregation
- Team-based analytics
- Cost tracking
- Success rate monitoring

### 10. Policy Management

**Purpose:** Version-controlled policy documents

**Features:**
- Policy lifecycle management
- Version control
- Acknowledgment tracking
- Reminder system
- Committee/team-specific policies

### 11. Reporting & Analytics

**ROI Validation Dashboard:**
- Projected vs actual comparison
- Team estimation accuracy
- Variance analysis
- Improvement trends

**Team Performance Dashboard:**
- AI adoption across teams
- Proposals, approvals, ROI metrics
- Member counts

**Board Reporting Pack:**
- Executive summary
- Investment summary
- Value realization
- Pipeline status
- Risk posture
- Compliance metrics

### 12. Invite System

**Flow:**
1. Admin creates invites via UI or bulk SQL
2. Click "Send All Invites" → Resend API sends branded emails
3. User clicks link → `/invite/[token]`
4. User sets name + password → Account created
5. Profile auto-populated with committee + team + role
6. Redirected to dashboard

**Features:**
- Bulk invite sending with rate limiting (600ms between emails)
- `email_sent_at` tracking to prevent duplicates
- 30-day expiry
- Team assignment

### 13. Email Notifications

**Types:**
- Invite emails
- Form status change notifications
- Oversight review required notifications
- Review due reminders
- Policy update notifications
- Weekly digests

**Service:** Resend API with branded HTML templates

---

## User Roles & Permissions

### Role Hierarchy

```
Admin
  └── Can access BOTH committees
  └── Can send invites
  └── Can manage all forms
  └── Can view audit logs
  └── Can manage staff rates
  └── Can manage policies
  └── Can manage auto-approval rules

Chair
  └── Can access their committee
  └── Can approve/reject forms in oversight queue
  └── Can manage tools in registry
  └── Can send invites (oversight only)

Member
  └── Can access their committee only
  └── Can create/edit their own forms
  └── Can view all forms in their committee
  └── Can create implementation reviews
  └── Can create team notes
```

### Committee Membership

**Implementation Committee:**
- **BSG:** James Howard (Admin), Laura Pond
- **Audit:** Steve Johnson, Grace Bischoff
- **Tax:** Tim Humphries, Adam Thompson
- **Corporate Finance:** James Palmer, Sam Stern
- **Bookkeeping:** Katy Dunn, Charlotte Stead
- **Admin:** Nicola Sidoli

**Oversight Committee:**
- James Howard (Admin/Chair)
- Steve Johnson
- Paul Randall
- Kevin Foster
- Katie Dunn

---

## Database Migrations

All migrations are in `/supabase/migrations/`:

| Migration | Purpose | Status |
|-----------|---------|--------|
| `001_invites.sql` | Invite system tables | ✅ Applied |
| `002_audit_log.sql` | Audit logging system | ✅ Applied |
| `003_oversight_approval.sql` | Oversight workflow | ✅ Applied |
| `004_ai_tool_registry.sql` | AI tools registry | ✅ Applied |
| `005_implementation_reviews.sql` | Post-implementation reviews | ✅ Applied |
| `006_staff_rates.sql` | Configurable staff rates | ✅ Applied |
| `007_policy_documents.sql` | Policy management | ✅ Applied |
| `008_team_notes.sql` | Team notes system | ✅ Applied |
| `009_ai_transcript_fields.sql` | AI summary fields | ✅ Applied |
| `010_tool_usage.sql` | Tool usage tracking | ✅ Applied |
| `011_auto_approval_rules.sql` | Auto-approval system | ✅ Applied |

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://baovfbsblkbibbbypnbf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[key]
SUPABASE_SERVICE_ROLE_KEY=[key] (optional, for admin operations)

# Resend Email
RESEND_API_KEY=[key]
RESEND_FROM_EMAIL=AI Portal <noreply@torsor.co.uk>

# App
NEXT_PUBLIC_APP_URL=https://ai.torsor.co.uk

# Cron Jobs
CRON_SECRET=[secure-random-string]

# AI Features (Phase 6)
ANTHROPIC_API_KEY=sk-ant-[key]
# Or use OpenAI instead:
# OPENAI_API_KEY=sk-[key]
```

---

## Deployment

### Railway Configuration

**nixpacks.toml:**
```toml
[phases.setup]
nixPkgs = ["nodejs_18"]

[phases.install]
cmds = ["npm ci"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npx next start -p ${PORT:-3030}"
```

**railway.json:**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "startCommand": "npx next start -p ${PORT:-3030}",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Build Process

1. Railway detects `nixpacks.toml`
2. Installs Node.js 18
3. Runs `npm ci` to install dependencies
4. Runs `npm run build` to build Next.js app
5. Starts with `npx next start -p ${PORT:-3030}`

### Domain Configuration

- **Domain:** ai.torsor.co.uk
- **DNS:** Managed via Cloudflare
- **SSL:** Automatic via Railway/Cloudflare

---

## Development Workflow

### Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Database Changes

1. Create migration file in `/supabase/migrations/`
2. Test locally (if possible)
3. Run in Supabase SQL Editor
4. Update TypeScript types if needed

### Deployment Process

1. Push to GitHub
2. Railway automatically detects changes
3. Builds and deploys new version
4. Health checks ensure successful deployment

---

## Quick Reference

### Login Credentials
- **Admin:** jhoward@rpgcc.co.uk (custom password)
- **Team Members:** [email]@rpgcc.co.uk / RPGCC2024! (must change on first login)

### Key URLs
- **Production:** https://ai.torsor.co.uk
- **Supabase:** https://supabase.com/dashboard/project/baovfbsblkbibbbypnbf
- **Railway:** Railway dashboard (AI-Portal service)
- **GitHub:** https://github.com/oracleconsulting/AI-Portal

### Support Contacts
- **Technical:** James Howard
- **Project:** RPGCC AI Implementation Committee

---

## Version History

- **v1.0** - Initial release with basic forms and committees
- **v2.0** - Governance features (audit logging, oversight workflow, AI tool registry)
- **v3.0** - Advanced features (team notes, AI summarization, ROI prediction, auto-approval, usage tracking)

---

*Document Generated: January 2025*  
*Version: 3.0 - Phase 6 Complete*
