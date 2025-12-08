# RPGCC AI Portal - Complete System Overview

## Executive Summary

The RPGCC AI Portal is a secure, role-based web application designed to help RPGCC manage their AI implementation initiative across two committees: the **Implementation Committee** (identifying AI opportunities) and the **Oversight Committee** (governance, security, and funding).

**Current Version:** 2.0 (Governance-Enhanced)  
**Last Updated:** December 2024  
**Status:** ✅ Production Live at ai.torsor.co.uk

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
│  │  │  • ID Forms     │  │  • Review Queue │  │  • Invite System        │  │   │
│  │  │  • Multi-level  │  │  • AI Tools     │  │  • Audit Log            │  │   │
│  │  │    ROI          │  │  • Policies     │  │  • Staff Rates          │  │   │
│  │  • Reviews         │  │  • Suggestions  │  │                         │  │   │
│  │  • Analytics       │  │  • Transcripts  │  │                         │  │   │
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
├── time_savings (jsonb) -- Array of {staff_level, hours_per_week, weekly_value}
├── priority (enum: 'low' | 'medium' | 'high' | 'critical')
├── status (enum: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'in_progress' | 'completed')
├── submitted_by (uuid, FK → auth.users)
├── submitted_by_name (text)
├── notes (text)
├── -- Oversight fields (added in v2.0)
├── oversight_status (enum: 'not_required' | 'pending_review' | 'under_review' | 'approved' | 'rejected' | 'deferred' | 'requires_changes')
├── oversight_reviewed_by (uuid, FK)
├── oversight_reviewed_at (timestamp)
├── oversight_notes (text)
├── oversight_conditions (text)
├── risk_category (text)
├── risk_score (integer 1-5)
├── data_classification (enum: 'public' | 'internal' | 'confidential' | 'restricted')
├── security_review_required (boolean)
├── escalated_to_partner (boolean)
├── created_at / updated_at

-- AI TOOLS REGISTRY (v2.0)
ai_tools
├── id (uuid, PK)
├── name, vendor, version
├── category (enum: llm_general, llm_coding, audit_specific, etc.)
├── status (enum: proposed, evaluating, pilot, approved, approved_restricted, deprecated, banned)
├── description, approved_use_cases (jsonb), prohibited_use_cases (jsonb)
├── data_classification_permitted, data_residency
├── processes_pii, processes_client_data
├── pricing_model, annual_cost, cost_per_unit
├── security_score (1-5), risk_score (1-5)
├── has_soc2, has_iso27001, gdpr_compliant
├── proposed_by, approved_by, linked_form_id
├── next_review_date, review_frequency_months
├── created_at / updated_at

-- IMPLEMENTATION REVIEWS (v2.0)
implementation_reviews
├── id (uuid, PK)
├── form_id (uuid, FK → identification_forms)
├── tool_id (uuid, FK → ai_tools)
├── review_type (enum: 30_day, 90_day, 180_day, 365_day, ad_hoc)
├── review_date, review_due_date
├── actual_time_saved (jsonb), actual_weekly_hours, actual_annual_value
├── actual_cost, actual_roi
├── projected_weekly_hours, projected_annual_value, projected_cost
├── variance_percentage
├── user_satisfaction_score (1-5), adoption_rate_percentage
├── quality_impact (enum: improved, unchanged, declined)
├── challenges_encountered, unexpected_benefits, lessons_learned
├── recommendation (enum: continue, expand, modify, pause, discontinue)
├── recommendation_notes, action_items (jsonb)
├── next_review_date, requires_oversight_review
├── reviewed_by, reviewed_by_name
├── created_at / updated_at

-- AUDIT LOG (v2.0)
audit_log
├── id (uuid, PK)
├── table_name, record_id
├── action (enum: create, update, delete, status_change, approval, rejection, etc.)
├── changed_by, changed_by_name, changed_by_email
├── changed_at
├── old_values (jsonb), new_values (jsonb)
├── change_summary (text)
├── ip_address, user_agent, session_id

-- STAFF RATES (v2.0)
staff_rates
├── id (uuid, PK)
├── staff_level (text, unique)
├── hourly_rate (decimal)
├── display_name, display_order
├── is_active, effective_from, effective_to
├── updated_by, created_at, updated_at

-- POLICY DOCUMENTS (v2.0)
policy_documents
├── id (uuid, PK)
├── policy_code, title, category
├── summary, content (text)
├── version, previous_version_id
├── status (enum: draft, pending_approval, approved, superseded, archived)
├── approved_by, approved_at
├── effective_from, effective_to, review_date
├── applies_to_committees (text[]), applies_to_teams (team_type[])
├── owner, author, tags (text[])
├── attachment_urls (jsonb)
├── created_at / updated_at

-- INVITES, MEETING_TRANSCRIPTS, OVERSIGHT_SUGGESTIONS, TEAMS
-- (See full schema.sql for complete structure)
```

### Staff Rates (Configurable via Database)

| Staff Level | Default Hourly Rate | Managed Via |
|-------------|---------------------|-------------|
| Admin | £80/hr | `staff_rates` table |
| Junior | £100/hr | `staff_rates` table |
| Senior | £120/hr | `staff_rates` table |
| Assistant Manager | £150/hr | `staff_rates` table |
| Manager | £175/hr | `staff_rates` table |
| Director | £250/hr | `staff_rates` table |
| Partner | £400/hr | `staff_rates` table |

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

Chair
  └── Can access their committee
  └── Can approve/reject forms in oversight queue
  └── Can manage tools in registry
  └── Can send invites

Member
  └── Can access their committee only
  └── Can create/edit their own forms
  └── Can view all forms in their committee
  └── Can create implementation reviews
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
- `/implementation/reviews` - Post-implementation reviews dashboard
- `/implementation/reviews/new` - Create new review
- `/implementation/analytics` - ROI analytics

### Oversight Committee Routes
- `/oversight` - Dashboard
- `/oversight/reviews` - Review queue for high-value proposals (≥£5k)
- `/oversight/tools` - AI Tool Registry listing
- `/oversight/tools/new` - Add new AI tool
- `/oversight/tools/[id]` - Tool detail view
- `/oversight/suggestions` - All suggestions
- `/oversight/suggestions/new` - Create suggestion
- `/oversight/transcripts` - Meeting transcripts
- `/oversight/transcripts/new` - Add transcript
- `/oversight/analytics` - Analytics dashboard

### Admin Routes
- `/admin/invites` - Invite management
- `/admin/audit-log` - Complete audit trail viewer
- `/dashboard` - Committee selection (redirect)

---

## Key Features

### 1. Identification Forms (Implementation Committee)

**Purpose:** Document AI opportunities with ROI calculations

**Fields:**
- Problem Identified (required)
- Proposed Solution
- Estimated Cost (£)
- Time Savings by Staff Level (multiple entries with auto-calculated values)
- Priority (Low/Medium/High/Critical)
- Status workflow: draft → submitted → under_review → approved → in_progress → completed
- Risk assessment (category, score, data classification)
- Notes

**ROI Calculation:**
```
Weekly Value = Σ (hours_per_week × staff_rate)
Annual Value = Weekly Value × 52
ROI = (Annual Value / Cost) × 100
Payback Period = (Cost / Annual Value) × 12 months
```

**Oversight Integration:**
- Forms with cost ≥£5,000 automatically flagged for oversight review
- High-risk items (risk_score ≥4 or restricted data) always require oversight
- Oversight can approve, reject, defer, or request changes
- Approval conditions can be attached

### 2. Oversight Review Queue

**Purpose:** Governance review of high-value proposals

**Features:**
- Auto-populated queue of forms requiring oversight (≥£5k or high-risk)
- Priority sorting by form priority and days pending
- Quick actions: Approve, Reject, Defer, Request Changes
- Review notes and approval conditions
- Risk assessment display
- Annual value calculations for prioritization

### 3. AI Tool Registry

**Purpose:** Centralized management of approved, evaluated, and banned AI tools

**Features:**
- Tool lifecycle: proposed → evaluating → pilot → approved → deprecated/banned
- Security & risk scoring (1-5 scale)
- Compliance tracking (SOC2, ISO 27001, GDPR)
- Data classification permissions
- Approved/prohibited use cases
- Team-based permissions
- Usage tracking (for future ROI measurement)
- Review scheduling

### 4. Post-Implementation Reviews

**Purpose:** Track actual outcomes vs projected for ROI validation

**Features:**
- Scheduled reviews: 30, 90, 180, 365 days
- Actual vs projected comparison with variance calculation
- User satisfaction scoring (1-5)
- Adoption rate tracking
- Quality impact assessment
- Challenges, benefits, and lessons learned
- Recommendations: continue, expand, modify, pause, discontinue
- Action items and next review scheduling

### 5. Audit Logging System

**Purpose:** Complete compliance trail for all system changes

**Features:**
- Automatic logging of all create/update/delete operations
- Tracks: user, timestamp, old/new values, change summary
- Searchable and filterable by table, action, user, date range
- CSV export capability
- Admin/chair-only access

### 6. Invite System

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

### 7. First-Time Password Change

**Flow:**
1. Admin creates user manually with temp password
2. Sets `must_change_password = true` in profile
3. User logs in → Middleware redirects to `/change-password`
4. User sets new password → `must_change_password = false`
5. Access granted to dashboard

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

*Document Generated: December 2024*  
*Version: 2.0 - Governance Enhanced*
