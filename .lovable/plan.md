

## Plan: School Courses Management

### Current Architecture

The platform has a two-tier course system:
1. **`course_templates`** — global templates (admin-defined) with hours, features, descriptions
2. **`instructor_courses`** — per-instructor overrides (custom pricing, images, features) linked by `instructor_id` + `course_hours`

Schools currently have no course ownership. Their instructors use the global templates with individual overrides. The booking flow resolves courses via instructor → `instructor_courses` → `course_templates` fallback.

### Approach: School Courses Table

Create a new **`school_courses`** table that lets schools define their own course catalog. Schools set the price, features, and assign which of their instructors can teach each course. This keeps the existing `instructor_courses` / `course_templates` system untouched for independent instructors.

### Database Changes

**New table: `school_courses`**
- `id` (uuid, PK)
- `school_id` (uuid, FK → schools)
- `course_name` (text)
- `course_hours` (integer)
- `price` (numeric) — school-set price
- `discounted_price` (numeric, nullable)
- `description` (text, nullable)
- `features` (text[], nullable)
- `course_image_url` (text, nullable)
- `is_intensive` (boolean, default false)
- `is_popular` (boolean, default false)
- `is_active` (boolean, default true)
- `display_order` (integer, default 0)
- `created_at`, `updated_at`

**New junction table: `school_course_instructors`**
- `id` (uuid, PK)
- `school_course_id` (uuid, FK → school_courses)
- `instructor_id` (uuid, FK → instructors)
- Unique on (school_course_id, instructor_id)

RLS: school owner can CRUD their own courses; public can read active courses.

### UI Changes

1. **Add "Courses" to sidebar** in `SchoolLayout.tsx` — placed under Management group with a `BookOpen` icon.

2. **Create `SchoolCoursesSection.tsx`** — the main courses management page:
   - List of school courses as cards/table with name, hours, price, assigned instructors, active status
   - "Add Course" button opening a dialog/form
   - Edit/delete/toggle active per course
   - Instructor assignment via multi-select of the school's linked instructors

3. **Wire into `SchoolPortal.tsx` and `DemoSchoolPortal.tsx`** — add the new section to the `renderSection` switch.

4. **Add demo data** in `demoSchoolData.ts` for the demo portal.

### Integration with Booking Flow

The `public-courses` edge function and booking pages can be extended later to check `school_courses` when a booking comes through a school's booking page (via school slug), falling back to the existing instructor-level logic for direct instructor bookings. This keeps the current flow working unchanged.

### Files to Create
- `src/components/school/SchoolCoursesSection.tsx`

### Files to Modify
- `src/components/school/SchoolLayout.tsx` — add "Courses" nav item + sectionMeta
- `src/pages/SchoolPortal.tsx` — add courses case
- `src/pages/DemoSchoolPortal.tsx` — add courses case
- `src/data/demoSchoolData.ts` — add demo course data
- Database migration for `school_courses` and `school_course_instructors` tables with RLS

