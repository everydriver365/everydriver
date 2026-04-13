

## Plan: Add Admin-Level Functions to School Portal (Scoped to Own School)

### Overview
Expand the school portal with admin-equivalent sections that are automatically scoped to the school's own instructors. All queries filter by the school's `instructorIds`, so school managers only see and affect their own data.

### New Sections to Add (Admin Functions Not Yet in School Portal)

1. **Enquiries & Callbacks** — show course enquiries from the school's instructors only
2. **Pupil Messages** — view message threads for the school's pupils
3. **Live Map** — real-time instructor positions filtered to school instructors
4. **Compliance Dashboard** — DBS/licence expiry tracking for school instructors
5. **Revenue Analytics** — revenue charts scoped to school's instructor payments
6. **Discount Codes** — school-specific discount codes (new `school_id` column)
7. **Instructor Leaderboard** — rankings within the school only
8. **Booking Pages** — manage booking pages for school instructors
9. **Campaigns** — school-scoped marketing campaigns

### Approach
Rather than duplicating all admin components, create thin school wrapper components that pass `instructorIds` or `schoolId` as filter props. Where admin components can't easily accept filters, create new school-specific versions that reuse the same UI patterns but query with `instructorIds` constraints.

### Files to Create
- `src/components/school/SchoolEnquiriesSection.tsx` — filters `course_enquiries` by school instructor IDs
- `src/components/school/SchoolMessagesSection.tsx` — filters conversations by school pupils
- `src/components/school/SchoolLiveMapSection.tsx` — filters `live_pupil_positions` by school instructors
- `src/components/school/SchoolComplianceSection.tsx` — filters instructor compliance by school instructors
- `src/components/school/SchoolRevenueAnalyticsSection.tsx` — revenue charts for school payments
- `src/components/school/SchoolDiscountCodesSection.tsx` — CRUD discount codes with `school_id` scope
- `src/components/school/SchoolLeaderboardSection.tsx` — leaderboard within school instructors
- `src/components/school/SchoolBookingPagesSection.tsx` — manage booking pages for school instructors
- `src/components/school/SchoolCampaignsSection.tsx` — school-scoped campaigns

### Files to Modify
- **`src/components/school/SchoolLayout.tsx`** — add new sidebar items under appropriate groups:
  - Management: + Enquiries, Messages, Compliance
  - Dashboard/Overview: + Live Map, Revenue Analytics, Leaderboard
  - Engagement: + Discount Codes, Campaigns
  - Settings: + Booking Pages
- **`src/pages/SchoolPortal.tsx`** — add case statements for all new sections
- **`src/pages/DemoSchoolPortal.tsx`** — add case statements with demo data

### Database Migration
- Add `school_id` (nullable UUID, FK to schools) to `discount_codes` table so schools can create their own codes
- RLS policy: school owners can CRUD discount codes where `school_id` matches their school

### Data Scoping Pattern
Every new section follows the same pattern already used by existing school sections:
```typescript
// Filter all queries by school's instructor IDs
const { data } = await supabase
  .from("some_table")
  .select("*")
  .in("instructor_id", instructorIds);
```

### Technical Notes
- No changes to admin portal — admin retains full cross-school visibility
- Feature gating via `enabled_features` JSONB continues to control which sidebar items appear
- New sections reuse existing UI components (Cards, Tables, Charts) with school-scoped data
- The `instructorIds` array from `useSchoolData` hook remains the primary filter mechanism

