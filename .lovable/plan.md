

## Plan: Align School Courses with Site-Wide Course Template Design

### Problem
The school courses editor is a simplified form compared to the rich `CourseTemplateDialog` used elsewhere. School-created courses are missing fields like short/full descriptions, what-to-bring lists, prerequisites, explainer videos, theory/driving test details, payment terms, and terms & conditions. The creation dialog also lacks image/video upload capabilities.

### Database Migration
Add the missing columns to `school_courses` to match `course_templates`:

- `short_description` (text, nullable)
- `full_description` (text, nullable)  
- `what_to_bring` (text[], nullable)
- `prerequisites` (text[], nullable)
- `theory_test_details` (text, nullable)
- `driving_test_details` (text, nullable)
- `payment_terms` (text, nullable)
- `terms_conditions` (text, nullable)
- `explainer_video_url` (text, nullable)

### UI Changes

**Rewrite `SchoolCoursesSection.tsx` course editor dialog** to match the layout and fields of `CourseTemplateDialog.tsx`:

- Course image upload with preview and remove button (using Supabase storage)
- Course name, hours, price, discounted price
- Short description and full description textareas
- Features list with add/remove individual items (not a single textarea)
- What-to-bring list with add/remove items
- Prerequisites list with add/remove items
- Explainer video upload with preview
- Theory test details, driving test details textareas
- Payment terms and terms & conditions textareas
- Active/Intensive/Popular toggle switches in a grid layout
- Instructor assignment (kept from current implementation)

**Course card display** — update the course list cards to show the image, short description, and richer badge/feature display matching the style used in `MiniWebsiteCourseCard` and `CourseCard`.

### Demo Data
Update `demoSchoolCourses` in `demoSchoolData.ts` with the new fields populated.

### Files to Modify
- `src/components/school/SchoolCoursesSection.tsx` — rebuild editor dialog and card display
- `src/data/demoSchoolData.ts` — add new fields to demo courses
- Database migration — add missing columns

