

## Full School Manager Portal + Master-Detail Pupils Page

### Shared Data Hook
- **New** `src/hooks/useSchoolData.ts` — fetches school record + all instructor IDs from `school_instructors`

### Sidebar & Routing Updates
- **Modify** `SchoolLayout.tsx` — expand sidebar with all sections below
- **Modify** `SchoolPortal.tsx` — add switch cases for every new section

### New Section Components (14 total)

| Section | Component | Purpose |
|---------|-----------|---------|
| Overview | `SchoolDashboardSection` | KPI cards, activity feed, alerts |
| Management | `SchoolInstructorsSection` | Instructor table, invite/remove |
| Management | `SchoolPupilsSection` | Master-detail: pupil list left, detail right |
| Management | `SchoolPupilDetailPanel` | Detail panel: instructor, tests, lessons, payments, tracking, messages, reviews |
| Management | `SchoolBookingsSection` | All lessons with status filters |
| Management | `SchoolCalendarSection` | Multi-instructor calendar view |
| Financials | `SchoolPaymentsSection` | Payment history + date filters |
| Financials | `SchoolPayrollSection` | Earnings breakdown per instructor |
| Financials | `SchoolReportsSection` | Summary cards + CSV export |
| Operations | `SchoolFleetSection` | Live GPS tracking map |
| Operations | `SchoolTestResultsSection` | Pass/fail stats across school |
| Settings | `SchoolProfileSection` | Edit school name, contact |
| Settings | `SchoolBrandingSection` | Logo upload, colours |
| Settings | `SchoolBookingPageSection` | Slug manager + preview |
| Settings | `SchoolNotificationsSection` | Email/SMS alert toggles |

### Pupils Page Detail

When a pupil is clicked, the right panel shows collapsible sections:
1. Instructor assignment
2. Theory test status
3. Driving test status
4. Lesson history table
5. Payment history
6. Tracking sessions
7. Messages
8. Reviews/feedback

All read-only for school managers.

### Database
- One migration: add `notification_preferences` JSONB column to `schools` table

### Data Access
All queries filter by the school's instructor IDs from `school_instructors` — no new tables needed beyond the one column addition.

