

## Plan: Admin School Manager Section

### Overview
Add a new "School Manager" sidebar group in the admin portal where admins can view all schools with School Manager setups, and configure which features/functions each school has access to (e.g. toggle Courses, BNPL, Payment Gateways, Fleet Tracking, etc.).

### Database Migration
Add an `enabled_features` column (JSONB, default all features enabled) to the `schools` table. This stores a map of feature keys to booleans, e.g.:
```json
{
  "courses": true,
  "bnpl": true,
  "payment-gateways": true,
  "fleet": true,
  "payroll": false,
  "test-results": true,
  "booking-page": true,
  "branding": true
}
```

### Files to Create

**`src/components/admin/AdminSchoolManager.tsx`**
- Fetches all schools from the `schools` table
- Lists schools as cards showing name, slug, owner, instructor count (from `school_instructors`), and status
- Click a school to open a detail panel/dialog with:
  - School info summary (name, contact, domain)
  - **Feature Toggles**: a grid of switches for each School Manager function (Courses, BNPL, Payment Gateways, Fleet Tracking, Payroll, Test Results, Booking Page, Branding, Notifications, Calendar, Reports)
  - Current payment gateway mode indicator
  - Instructor count
- Save updates the `enabled_features` JSONB column on the `schools` table

### Files to Modify

1. **`src/components/admin/AdminLayout.tsx`** + **`AdminDesktopSidebar.tsx`**
   - Add a new "Schools" sidebar group with `Building2` icon containing `{ key: "school-manager", label: "School Manager", icon: Building2 }`

2. **`src/pages/AdminPortal.tsx`**
   - Add `school-manager` to `sectionMeta`
   - Add `case "school-manager"` rendering `<AdminSchoolManager />`
   - Import the new component

3. **`src/components/school/SchoolLayout.tsx`** (minor)
   - Export the sidebar feature keys so the admin toggle list stays in sync with actual school nav items

### Technical Details
- The `enabled_features` JSONB approach is flexible — new school features added later just need a new key
- The School Manager portal can later read `enabled_features` to conditionally hide disabled sidebar items
- Uses existing RLS — admins can read/write all schools via `has_role(auth.uid(), 'admin')`

