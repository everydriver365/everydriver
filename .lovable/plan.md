

## Plan: Instructor-Linked Pupil Registration (Both Options)

### Current State
- Pupils register at `/pupil/login` with no instructor association — the edge function (`pupil-email-auth`) finds the instructor by looking up which instructor already has that email on file.
- Instructors already have an `app_slug` field used for branded portals (`/p/:slug`).

### What We'll Build

**Option A — Unique login URL per instructor:**
- Route: `/pupil/login/:instructorSlug` — when a pupil visits this URL, the instructor is pre-selected automatically. No dropdown shown. The instructor's name is displayed so the pupil knows who they're registering with.
- Instructors can share this link (e.g., `everydriver.lovable.app/pupil/login/jane-smith`).

**Option B — Dropdown selector on default page:**
- On the generic `/pupil/login` page, the register tab gets an instructor selector (dropdown of active instructors with `pupil_app_enabled = true`).
- The selector is hidden when arriving via a direct instructor link.

### Changes

1. **`src/pages/PupilLogin.tsx`**
   - Accept optional `instructorSlug` route param via `useParams()`
   - If slug present, fetch instructor name from `public_instructors` view and display it as a banner ("Registering with Jane Smith")
   - Pass `instructorSlug` or selected `instructorId` down to `PupilRegister`

2. **`src/components/pupil/PupilRegister.tsx`**
   - Accept optional `instructorId` prop
   - If no `instructorId` provided, fetch active instructors (`pupil_app_enabled = true`) from `public_instructors` view and show a `<Select>` dropdown
   - Pass the selected instructor ID to the edge function

3. **`supabase/functions/pupil-email-auth/index.ts`**
   - For `register` action: accept optional `instructorId` parameter
   - If provided and the email doesn't exist yet in `pupils`, create the pupil record linked to that instructor (removing the requirement that the instructor must add them first)
   - If email already exists, proceed with existing flow

4. **`src/App.tsx`**
   - Add route: `/pupil/login/:instructorSlug`  pointing to `PupilLogin`

### Security
- The instructor list only uses the existing `public_instructors` view (no sensitive data exposed)
- Registration still validates instructor exists and is active
- RLS policies unchanged — new pupils inherit existing row-level security

