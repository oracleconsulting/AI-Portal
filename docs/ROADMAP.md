# RPGCC AI Portal - Development Roadmap

**Last Updated:** December 2024  
**Current Version:** 2.0 (Governance-Enhanced)  
**Next Review:** January 2025

---

## ✅ Phase 1: Foundation (COMPLETED)

### Core Features
- [x] Next.js 14 application setup
- [x] Supabase authentication & database
- [x] Committee-based access control
- [x] Identification forms with ROI calculations
- [x] Multi-staff-level time savings
- [x] Invite system with Resend
- [x] User management & password reset
- [x] Basic analytics dashboard

### Deliverables
- Production deployment at ai.torsor.co.uk
- 10 Implementation Committee members onboarded
- 5 Oversight Committee members ready for onboarding

---

## ✅ Phase 2: Governance Foundation (COMPLETED)

### Database Migrations
- [x] Audit logging system (002)
- [x] Oversight approval workflow (003)
- [x] AI Tool Registry (004)
- [x] Post-implementation reviews (005)
- [x] Configurable staff rates (006)
- [x] Policy document management (007)

### UI Components
- [x] Oversight Review Queue (`/oversight/reviews`)
- [x] AI Tool Registry (`/oversight/tools`)
- [x] Implementation Reviews (`/implementation/reviews`)
- [x] Audit Log Viewer (`/admin/audit-log`)
- [x] Status badges component
- [x] ROI calculation utilities

### Deliverables
- Complete governance framework in place
- All migrations applied to production
- Oversight committee ready for review workflow

---

## 🔄 Phase 3: UI Completion & Polish (IN PROGRESS)

### Priority 1: Complete Missing UI Pages

#### 3.1 Tool Registry Enhancements
- [ ] **Tool Edit Page** (`/oversight/tools/[id]/edit`)
  - Allow editing tool details, status, security scores
  - Update compliance certifications
  - Modify approved/prohibited use cases
  - **Effort:** 4-6 hours
  - **Dependencies:** None

- [ ] **Tool Permissions Management**
  - UI to assign team/role permissions
  - Training requirement tracking
  - Access expiration dates
  - **Effort:** 6-8 hours
  - **Dependencies:** Tool edit page

#### 3.2 Form Detail Enhancements
- [ ] **Oversight Status Display**
  - Add oversight status badge to form detail page
  - Show approval conditions if approved
  - Display risk assessment summary
  - **Effort:** 3-4 hours
  - **Dependencies:** None

- [ ] **Risk Assessment Fields in Edit Form**
  - Add risk_category, risk_score, data_classification to edit form
  - Auto-flag for oversight based on risk
  - **Effort:** 2-3 hours
  - **Dependencies:** None

#### 3.3 Staff Rates Management
- [ ] **Admin Staff Rates Page** (`/admin/settings/rates`)
  - View current rates
  - Edit rates (with history tracking)
  - Recalculate affected forms button
  - **Effort:** 4-5 hours
  - **Dependencies:** None

#### 3.4 Policy Management UI
- [ ] **Policy Listing** (`/oversight/policies`)
  - List all policies with status filters
  - Search and category filtering
  - **Effort:** 3-4 hours
  - **Dependencies:** None

- [ ] **Policy Editor** (`/oversight/policies/new`, `/oversight/policies/[id]/edit`)
  - Rich text editor (Markdown support)
  - Version history display
  - Approval workflow
  - **Effort:** 8-10 hours
  - **Dependencies:** Policy listing

- [ ] **Policy Acknowledgment Tracking**
  - Show who has read/accepted policies
  - Reminder system for pending acknowledgments
  - **Effort:** 4-5 hours
  - **Dependencies:** Policy editor

**Phase 3 Total Effort:** ~40-50 hours  
**Target Completion:** End of January 2025

---

## 📊 Phase 4: Reporting & Analytics (PLANNED)

### 4.1 ROI Validation Report
- [ ] **ROI Validation Dashboard** (`/implementation/analytics/roi-validation`)
  - Compare projected vs actual across all reviewed implementations
  - Calculate overall accuracy of estimates
  - Identify teams/categories that over/under-estimate
  - Trend charts showing improvement over time
  - **Effort:** 8-10 hours
  - **Dependencies:** Implementation reviews data

### 4.2 Board Reporting Pack
- [ ] **Quarterly Summary Generator** (`/reports/board-pack`)
  - Total AI investment (approved costs)
  - Realised annual value (from reviews)
  - ROI accuracy metrics
  - Pipeline (pending proposals by value)
  - Risk posture (tools by risk score)
  - Policy compliance (acknowledgment rates)
  - Top 5 wins and challenges
  - **Effort:** 12-15 hours
  - **Dependencies:** All data sources

- [ ] **PDF Export**
  - Generate branded PDF report
  - Include charts and visualizations
  - **Effort:** 6-8 hours
  - **Dependencies:** Board pack generator

### 4.3 Team Performance Dashboard
- [ ] **Team Comparison** (`/implementation/analytics/teams`)
  - Proposals submitted per team
  - Approval rate
  - Average ROI
  - Adoption rates
  - Review completion rates
  - **Effort:** 6-8 hours
  - **Dependencies:** None

**Phase 4 Total Effort:** ~32-41 hours  
**Target Completion:** End of February 2025

---

## 📤 Phase 5: Export & Integration (PLANNED)

### 5.1 Export Functionality
- [ ] **Identification Forms Export**
  - CSV/Excel export with all fields
  - Filter by status, priority, team
  - **Effort:** 3-4 hours

- [ ] **AI Tool Registry Export**
  - CSV export with compliance data
  - Filter by status, category
  - **Effort:** 2-3 hours

- [ ] **Audit Log Export** (Already implemented)
  - ✅ CSV export available

- [ ] **Reviews Export**
  - Excel with variance analysis
  - Include projected vs actual breakdown
  - **Effort:** 4-5 hours

### 5.2 Email Notifications
- [ ] **Status Change Notifications**
  - Notify form owner when status changes
  - Notify oversight when form requires review
  - **Effort:** 6-8 hours

- [ ] **Review Reminders**
  - Email when reviews are due/overdue
  - Weekly digest of pending reviews
  - **Effort:** 4-5 hours

- [ ] **Policy Update Notifications**
  - Notify users when new policies are approved
  - Remind users of pending acknowledgments
  - **Effort:** 3-4 hours

**Phase 5 Total Effort:** ~22-29 hours  
**Target Completion:** Mid-March 2025

---

## 🚀 Phase 6: Advanced Features (FUTURE)

### 6.1 Team-Specific Features
- [ ] **Team Notes**
  - Private meeting notes per team
  - Secure access via RLS
  - **Effort:** 6-8 hours

- [ ] **Team Dashboards**
  - Team-specific analytics
  - Team leader views
  - **Effort:** 8-10 hours

### 6.2 AI-Powered Features
- [ ] **Transcript Summarization**
  - Auto-generate summaries from meeting transcripts
  - Extract action items automatically
  - **Effort:** 12-15 hours
  - **Dependencies:** AI API integration (OpenAI/Anthropic)

- [ ] **ROI Prediction**
  - ML model to predict actual ROI from form data
  - Improve estimation accuracy over time
  - **Effort:** 20-25 hours
  - **Dependencies:** Sufficient review data

### 6.3 Tool Usage Tracking
- [ ] **Usage Logging API**
  - Endpoint for tools to log usage
  - Track tokens, costs, time saved
  - **Effort:** 6-8 hours

- [ ] **Usage Analytics**
  - Dashboard showing tool adoption
  - Cost tracking vs projected
  - **Effort:** 8-10 hours

### 6.4 Workflow Automation
- [ ] **Auto-Approval Rules**
  - Configurable rules for auto-approving low-risk proposals
  - **Effort:** 8-10 hours

- [ ] **Review Scheduling Automation**
  - Auto-schedule reviews when forms move to "in_progress"
  - Send reminders automatically
  - **Effort:** 6-8 hours

**Phase 6 Total Effort:** ~66-84 hours  
**Target Completion:** Q2 2025

---

## 📋 Immediate Next Steps (This Week)

### 1. Complete Oversight Committee Onboarding
- [x] Run `add-oversight-users.sql` for prandall and kfoster
- [ ] Run `seed-oversight-committee.sql` to create invites
- [ ] Send all oversight invites via `/admin/invites`
- [ ] Verify all members can log in

### 2. Testing & Validation
- [ ] Test oversight review queue with a test form ≥£5k
- [ ] Verify audit logging is working
- [ ] Test AI tool registry CRUD operations
- [ ] Create a test implementation review

### 3. Documentation
- [x] Update system overview
- [x] Create roadmap document
- [ ] Create user guide for oversight committee
- [ ] Create quick start guide for implementation committee

---

## 🎯 Success Metrics

### Adoption Metrics
- **Active Users:** Target 15+ weekly active users
- **Forms Submitted:** Target 5+ forms per month
- **Reviews Completed:** Target 80% of due reviews completed on time

### Governance Metrics
- **Oversight Review Time:** Target <5 days for high-value proposals
- **ROI Accuracy:** Track variance between projected and actual
- **Policy Compliance:** Target 100% acknowledgment rate

### Quality Metrics
- **Tool Security:** All tools have security scores
- **Review Completion:** 100% of completed implementations have reviews
- **Audit Coverage:** All critical operations logged

---

## 🔧 Technical Debt & Improvements

### Code Quality
- [ ] Add comprehensive error boundaries
- [ ] Improve loading states across all pages
- [ ] Add unit tests for ROI calculations
- [ ] Add E2E tests for critical workflows

### Performance
- [ ] Optimize large list queries (pagination)
- [ ] Add caching for staff rates
- [ ] Optimize audit log queries

### Accessibility
- [ ] Add ARIA labels to all interactive elements
- [ ] Ensure keyboard navigation works everywhere
- [ ] Test with screen readers

---

## 📝 Notes

- All effort estimates are in developer hours
- Dependencies are noted where applicable
- Phases can be worked on in parallel where dependencies allow
- User feedback will inform priority adjustments

---

*Roadmap maintained by: James Howard*  
*Last reviewed: December 2024*

