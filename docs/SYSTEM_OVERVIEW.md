# RPGCC AI Portal - Complete System Overview

## Executive Summary

The RPGCC AI Portal is a secure, role-based web application designed to help RPGCC manage their AI implementation initiative across two committees: the **Implementation Committee** (identifying AI opportunities) and the **Oversight Committee** (governance, security, and funding).

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           RPGCC AI PORTAL ECOSYSTEM                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         ai.torsor.co.uk                                  │   │
│  │                         (Next.js 14 App)                                 │   │
│  │                                                                          │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐  │   │
│  │  │  IMPLEMENTATION │  │    OVERSIGHT    │  │        ADMIN            │  │   │
│  │  │   COMMITTEE     │  │    COMMITTEE    │  │                         │  │   │
│  │  │                 │  │                 │  │  • User Management      │  │   │
│  │  │  • ID Forms     │  │  • Suggestions  │  │  • Invite System        │  │   │
│  │  │  • Analytics    │  │  • Transcripts  │  │  • Bulk Invites         │  │   │
│  │  │  • ROI Calcs    │  │  • Analytics    │  │                         │  │   │
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
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                    │  │
│  │  │   Railway    │  │    Resend    │  │  Cloudflare  │                    │  │
│  │  │  (Hosting)   │  │   (Email)    │  │    (DNS)     │                    │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                    │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 14 (App Router) | React framework with server-side rendering |
| **Styling** | Tailwind CSS | Utility-first CSS with RPGCC brand colors |
| **Database** | Supabase (PostgreSQL) | Managed PostgreSQL with real-time capabilities |
| **Authentication** | Supabase Auth | Email/password authentication |
| **Security** | Row Level Security (RLS) | Database-level access control |
| **Hosting** | Railway | Container-based deployment |
| **Email** | Resend | Transactional email for invites |
| **DNS** | Cloudflare | Domain management for torsor.co.uk |
| **Version Control** | GitHub | oracleconsulting/AI-Portal repository |

---

## Domain Structure

The AI Portal sits alongside the existing Torsor ecosystem:

| Domain | Purpose | Status |
|--------|---------|--------|
| `torsor.co.uk` | Practice Platform | ✅ Live |
| `client.torsor.co.uk` | Client Portal | ✅ Live |
| `ai.torsor.co.uk` | **AI Committee Portal** | ✅ Live |

---

## Database Schema

### Core Tables

```sql
-- PROFILES (extends Supabase auth.users)
profiles
├── id (uuid, PK, FK → auth.users)
├── email (text)
├── full_name (text)
├── committee (enum: 'implementation' | 'oversight')
├── team (enum: 'bsg' | 'audit' | 'tax' | 'corporate_finance' | 'bookkeeping' | 'admin')
├── role (text: 'member' | 'chair' | 'admin')
├── must_change_password (boolean)
├── created_at / updated_at

-- IDENTIFICATION FORMS (Implementation Committee)
identification_forms
├── id (uuid, PK)
├── problem_identified (text)
├── solution (text)
├── cost_of_solution (decimal)
├── time_savings (jsonb) -- Array of {staff_level, hours_per_week}
├── time_saving_hours (decimal) -- Legacy, total hours
├── staff_level (text) -- Legacy, primary staff level
├── time_saving_description (text)
├── priority (enum: 'low' | 'medium' | 'high' | 'critical')
├── status (enum: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'in_progress' | 'completed')
├── submitted_by (uuid, FK → auth.users)
├── submitted_by_name (text)
├── notes (text)
├── created_at / updated_at

-- MEETING TRANSCRIPTS (Both Committees)
meeting_transcripts
├── id (uuid, PK)
├── title (text)
├── meeting_date (date)
├── transcript (text)
├── summary (text)
├── action_items (jsonb)
├── committee (enum)
├── team (enum)
├── created_by (uuid, FK)
├── created_at / updated_at

-- OVERSIGHT SUGGESTIONS
oversight_suggestions
├── id (uuid, PK)
├── category (enum: 'cost' | 'security' | 'risk' | 'general')
├── title (text)
├── description (text)
├── estimated_cost (decimal)
├── risk_level (enum: 'low' | 'medium' | 'high')
├── status (enum: 'pending' | 'reviewed' | 'approved' | 'rejected')
├── submitted_by (uuid, FK)
├── created_at / updated_at

-- INVITES (User Invitation System)
invites
├── id (uuid, PK)
├── email (text)
├── committee (enum)
├── team (enum)
├── role (text)
├── token (text, unique)
├── expires_at (timestamp)
├── accepted_at (timestamp)
├── email_sent_at (timestamp)
├── created_by (uuid, FK)
├── created_at

-- TEAMS (Reference Data)
teams
├── id (team_type, PK)
├── name (text)
├── description (text)
├── created_at
```

### Staff Rates (Hardcoded)

| Staff Level | Hourly Rate |
|-------------|-------------|
| Admin | £80/hr |
| Junior | £100/hr |
| Senior | £120/hr |
| Assistant Manager | £150/hr |
| Manager | £175/hr |
| Director | £250/hr |
| Partner | £400/hr |

---

## User Roles & Permissions

### Role Hierarchy

```
Admin
  └── Can access BOTH committees
  └── Can send invites
  └── Can manage all forms
  └── Can view all profiles

Chair
  └── Can access their committee
  └── Can update any form in their committee
  └── Can send invites

Member
  └── Can access their committee only
  └── Can create/edit their own forms
  └── Can view all forms in their committee
```

### Team Structure (Implementation Committee)

| Team | Members |
|------|---------|
| **BSG** | James Howard (Admin), Laura Pond |
| **Audit** | Steve Johnson, Grace Bischoff |
| **Tax** | Tim Humphries, Adam Thompson |
| **Corporate Finance** | James Palmer, Sam Stern |
| **Bookkeeping** | Katy Dunn, Charlotte Stead |
| **Admin** | Nicola Sidoli |

---

## Application Routes

### Public Routes
- `/` - Landing page
- `/login` - Authentication
- `/invite/[token]` - Accept invitation
- `/change-password` - First-time password change

### Implementation Committee Routes
- `/implementation` - Dashboard
- `/implementation/forms` - All identification forms
- `/implementation/forms/[id]` - Form detail view
- `/implementation/forms/[id]/edit` - Edit form
- `/implementation/new` - Create new form
- `/implementation/analytics` - ROI analytics

### Oversight Committee Routes
- `/oversight` - Dashboard
- `/oversight/suggestions` - All suggestions
- `/oversight/suggestions/new` - Create suggestion
- `/oversight/transcripts` - Meeting transcripts
- `/oversight/transcripts/new` - Add transcript
- `/oversight/analytics` - Analytics dashboard

### Admin Routes
- `/admin/invites` - Invite management
- `/dashboard` - Committee selection (redirect)

---

## Key Features

### 1. Identification Forms (Implementation Committee)

**Purpose:** Document AI opportunities with ROI calculations

**Fields:**
- Problem Identified (required)
- Proposed Solution
- Estimated Cost (£)
- Time Savings by Staff Level (multiple entries)
- Priority (Low/Medium/High/Critical)
- Status workflow
- Notes

**ROI Calculation:**
```
Weekly Value = Σ (hours_per_week × staff_rate)
Annual Value = Weekly Value × 52
ROI = (Annual Value / Cost) × 100
```

### 2. Invite System

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

### 3. First-Time Password Change

**Flow:**
1. Admin creates user manually with temp password
2. Sets `must_change_password = true` in profile
3. User logs in → Middleware redirects to `/change-password`
4. User sets new password → `must_change_password = false`
5. Access granted to dashboard

### 4. Analytics Dashboard

**Metrics:**
- Total Investment (sum of costs)
- Weekly Time Saved (sum of hours)
- Annual Value (calculated from staff rates)
- Average ROI
- Status Distribution
- Priority Distribution
- Top ROI Opportunities

---

## Security Implementation

### Row Level Security (RLS) Policies

All tables have RLS enabled with policies based on:
- User's committee membership
- User's role (admin/chair/member)
- Ownership (submitted_by = auth.uid())

**Key Security Function:**
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

### Middleware Protection

Next.js middleware checks:
1. Authentication status
2. Redirect unauthenticated users to login
3. Redirect users needing password change
4. Committee-based route protection

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://baovfbsblkbibbbypnbf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[key]
SUPABASE_SERVICE_ROLE_KEY=[key]

# Resend Email
RESEND_API_KEY=[key]
RESEND_FROM_EMAIL=AI Portal <noreply@torsor.co.uk>

# App
NEXT_PUBLIC_APP_URL=https://ai.torsor.co.uk
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
cmd = "npm run start:next"
```

**railway.json:**
```json
{
  "build": { "builder": "NIXPACKS" },
  "deploy": {
    "startCommand": "npx next start -p ${PORT:-3030}",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

---

## Conversation History & Development Timeline

### Session 1: Project Setup

**User Request:** Create a new "AI Portal" for RPGCC with two committees

**Decisions Made:**
- Next.js 14 with App Router
- Supabase for auth + database
- Railway for hosting
- Committee-based access control

**Key Deliverables:**
- Project scaffolding
- Supabase schema with RLS
- Basic authentication flow
- Committee selection dashboard

### Session 2: Branding & Identity

**User Request:** Remove all Oracle Consulting references, rebrand to RPGCC

**Decisions Made:**
- Created RPGCCLogo component (text + 3 dots)
- Brand colors: Blue (#2D9CDB), Red (#EB5757), Amber (#F2994A)
- Updated all UI text and meta tags

### Session 3: Invite System

**User Request:** Invite system with Resend for committee members

**Decisions Made:**
- Token-based invites with 30-day expiry
- Branded email templates
- Auto-populate profile on signup
- Bulk invite feature

**Challenges Solved:**
- Resend rate limiting (increased delay to 600ms)
- RLS infinite recursion (created is_admin() security definer function)

### Session 4: Team Structure

**User Request:** Add teams within Implementation Committee with private notes

**Teams Added:**
- BSG, Audit, Tax, Corporate Finance, Bookkeeping, Admin

**Decisions Made:**
- `team_type` enum added
- Team column in profiles
- Team-based RLS for meeting notes (future feature)

### Session 5: Manual User Creation

**User Request:** Create users manually since invite emails had issues

**Solution:**
- `/change-password` page for first-time login
- `must_change_password` flag in profiles
- Middleware redirect for password change
- Provided SQL + instructions for manual user creation

### Session 6: Form Enhancements

**User Request:** 
1. Fix 404 on form detail pages
2. Add multiple staff levels for time savings

**Staff Rates Defined:**
- Admin: £80, Junior: £100, Senior: £120
- Ass Mgr: £150, Manager: £175, Director: £250, Partner: £400

**Deliverables:**
- Form detail page (`/implementation/forms/[id]`)
- Edit form page (`/implementation/forms/[id]/edit`)
- `time_savings` JSONB field for multiple staff levels
- Dynamic ROI calculation with breakdown

---

## File Structure

```
ai-portal/
├── app/
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Landing page
│   ├── globals.css                   # Global styles
│   ├── login/page.tsx                # Login page
│   ├── dashboard/page.tsx            # Committee selector
│   ├── change-password/page.tsx      # First-time password change
│   ├── auth/callback/route.ts        # Supabase auth callback
│   ├── admin/
│   │   └── invites/page.tsx          # Invite management
│   ├── api/
│   │   └── invite/
│   │       ├── send/route.ts         # Single invite API
│   │       └── send-bulk/route.ts    # Bulk invite API
│   ├── implementation/
│   │   ├── layout.tsx                # Implementation layout + sidebar
│   │   ├── page.tsx                  # Dashboard
│   │   ├── new/page.tsx              # New form
│   │   ├── forms/
│   │   │   ├── page.tsx              # All forms list
│   │   │   └── [id]/
│   │   │       ├── page.tsx          # Form detail
│   │   │       └── edit/page.tsx     # Edit form
│   │   └── analytics/page.tsx        # Analytics
│   ├── oversight/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── suggestions/
│   │   ├── transcripts/
│   │   └── analytics/
│   └── invite/[token]/page.tsx       # Accept invite
├── components/
│   ├── Sidebar.tsx                   # Navigation sidebar
│   └── RPGCCLogo.tsx                 # Brand logo
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Browser client
│   │   ├── server.ts                 # Server client
│   │   └── middleware.ts             # Auth middleware
│   └── utils.ts                      # Utility functions
├── types/
│   └── database.ts                   # TypeScript types
├── supabase/
│   ├── schema.sql                    # Main database schema
│   └── migrations/
│       └── 001_invites.sql           # Invites migration
├── middleware.ts                     # Next.js middleware
├── tailwind.config.ts                # Tailwind + brand colors
├── next.config.js                    # Next.js config
├── nixpacks.toml                     # Railway build config
├── railway.json                      # Railway deploy config
└── package.json
```

---

## Future Enhancements (Not Yet Built)

1. **Team-Specific Notes** - Private meeting notes per team
2. **AI Transcript Summarization** - Auto-generate summaries + action items
3. **Email Notifications** - Notify when forms change status
4. **Export/Reports** - PDF/Excel export of forms and analytics
5. **Audit Log** - Track all changes for compliance
6. **Oversight Committee Full Build-out** - Suggestion workflows, cost tracking

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

*Document Generated: December 2025*
*Version: 1.0*

