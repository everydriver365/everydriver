

## Apple Notes Feature -- All Portals

A rich note-taking system inspired by Apple Notes, added across all four user types: instructors, pupils, admins, and shared instructor-pupil notes.

---

### Database Migration

Create a single `notes` table to serve all note types:

```text
notes
  id              uuid PK (default gen_random_uuid())
  owner_type      text NOT NULL  -- 'instructor', 'pupil', 'admin'
  owner_id        uuid NOT NULL  -- instructor.id, pupil.id, or admin user_id
  shared_with_id  uuid           -- if set, the note is shared (e.g. pupil_id for instructor notes shared with a pupil)
  title           text NOT NULL DEFAULT 'Untitled'
  content         text NOT NULL DEFAULT ''
  is_pinned       boolean DEFAULT false
  folder          text DEFAULT 'General'
  deleted_at      timestamptz    -- soft delete
  created_at      timestamptz DEFAULT now()
  updated_at      timestamptz DEFAULT now()
```

Indexes:
- `(owner_type, owner_id, deleted_at)` for fetching a user's notes
- `(shared_with_id)` for looking up shared notes

RLS policies:
- Instructors can CRUD their own notes (`owner_type = 'instructor' AND owner_id = auth.uid()` mapped via instructors table)
- Pupils can read notes shared with them (`shared_with_id = pupil_id`) and CRUD their own (`owner_type = 'pupil'`)
- Admin notes use service role or admin role check

Trigger: `set_updated_at()` on UPDATE.

---

### 1. Instructor Notes Page

**New file: `src/pages/InstructorNotes.tsx`**

Apple Notes-style interface with:
- Left sidebar listing notes grouped by folder (General, Lessons, Pupils, Personal), with pinned notes at the top
- Right panel showing the selected note with editable title and content (plain textarea, auto-saving on blur/debounce)
- Search bar filtering notes by title and content
- "New Note" button creating a note with focus on the title
- Pin/unpin, move to folder, and delete actions via a dropdown menu on each note
- Share toggle: optionally link a note to a pupil (dropdown of instructor's pupils) so it appears in the pupil portal
- Mobile: full-width list view, tapping a note opens the editor view with a back button
- Wrapped in `InstructorPortalLayout`

**Changes to `src/pages/InstructorMenu.tsx`:**
- Add `StickyNote` (or `FileText`) to lucide imports
- Add "Notes" item in the "Tools" section with path `/instructor/notes`

**Changes to `src/App.tsx`:**
- Add route `/instructor/notes` pointing to `InstructorNotes`

---

### 2. Pupil Notes Section

**New file: `src/components/pupil-portal/PupilNotes.tsx`**

A simpler Apple Notes view for pupils:
- List of the pupil's own notes (created by them) plus any notes shared by their instructor
- Shared notes are read-only and visually distinguished with an instructor badge
- Pupils can create, edit, pin, and delete their own notes
- Search bar for filtering
- Styled using the instructor's brand colour (passed as prop)

**Changes to `src/pages/BrandedPupilPortal.tsx`:**
- Add `'notes'` to the `ActiveSection` type
- Add a "My Notes" menu item in the navigation menu (between Messages and Payments)
- Add the `activeSection === 'notes'` rendering block importing `PupilNotes`

---

### 3. Shared Notes (Instructor to Pupil)

No separate UI needed -- this is handled by the "Share with pupil" toggle on the instructor notes page:
- When an instructor shares a note with a pupil, `shared_with_id` is set to the pupil's ID
- The pupil sees these shared notes in their notes section marked as "From [Instructor Name]"
- Instructor can edit/unshare at any time

---

### 4. Admin Notes

**Changes to `src/pages/AdminPortal.tsx`:**
- Add `"admin-notes"` to `sectionMeta` under System Settings: `{ title: "Admin Notes", group: "System Settings", icon: StickyNote }`
- Add switch case rendering a new `AdminNotesManager` component

**New file: `src/components/admin/AdminNotesManager.tsx`**
- Apple Notes-style interface for admins
- Folders: General, Instructors, Operations, Internal
- Full CRUD with pin, search, and folder organization
- Notes are private to the admin team (owner_type = 'admin')

---

### Implementation Summary

| # | What | Files | DB |
|---|------|-------|----|
| 1 | Database table + RLS | -- | Migration: `notes` table |
| 2 | Instructor Notes page | `InstructorNotes.tsx` (new), `InstructorMenu.tsx`, `App.tsx` | -- |
| 3 | Pupil Notes section | `PupilNotes.tsx` (new), `BrandedPupilPortal.tsx` | -- |
| 4 | Admin Notes section | `AdminNotesManager.tsx` (new), `AdminPortal.tsx` | -- |

**Total: 3 new files, 4 modified files, 1 database migration**

### Key Behaviours
- Auto-save: notes save automatically 1 second after the user stops typing (debounced)
- Soft delete: deleted notes go to a "Recently Deleted" folder and can be restored within 30 days
- Pinned notes always appear at the top of any folder view
- Search is client-side filtering across title and content
- Mobile-first layout: list view collapses to full-width with tap-to-open editor

