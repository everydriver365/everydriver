## Rename "Diary" to "Lesson History" and clarify what it does

### 1. Sidebar label (desktop)
File: `src/components/instructor/dashboardV2/DashboardSidebar.tsx`
- Change the Overview nav item from `Diary` → `Lesson History` (route stays `/instructor/diary`).

### 2. Page header subtitle (clearer purpose)
File: `src/pages/InstructorDiary.tsx`
- Title already reads "Lesson History" — keep.
- Replace the tiny subtitle "All lessons across all pupils" with a clearer one-liner:
  *"A searchable record of every past lesson — review notes, ratings and pupil progress."*
- Add a small dismissible help banner directly below the header (desktop + mobile) explaining in plain English what the page is for:
  > Use Lesson History to look back at completed lessons. Filter by pupil, date range or status to find lessons that are missing notes or a rating, review what you covered last time, or pull stats for tax and CPD evidence.
- Banner stores its dismissed state in `localStorage` (`dsm.lessonHistory.helpDismissed`) so it only shows until the instructor closes it.

### 3. Anywhere else "Diary" appears as a user-visible label
Quick sweep of:
- Mobile bottom nav / menu entries
- Any breadcrumb, tile, or quick-action labels referencing "Diary"
Rename each user-visible instance to "Lesson History". Routes, file names, component names, and the underlying `InstructorDiary.tsx` filename are left untouched to avoid breaking imports.

### Out of scope
- No data model, query, or filter logic changes.
- No mobile layout restructuring beyond the label/subtitle/banner text.
