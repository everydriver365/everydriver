# Archive pupil with reason

Today, archiving a pupil is wired up on the desktop pupils list only (soft-delete via `pupils.deleted_at`). This plan adds an **Archive** action with a captured **reason** everywhere a pupil appears as a tile, and surfaces the reason in the Archived Pupils dialog.

## Scope

1. **Mobile pupil list tile** (`src/pages/InstructorPupils.tsx`) — add an Archive action (long-press / kebab) that opens a reason sheet, then soft-archives.
2. **Desktop pupil tile** (`src/pages/instructor-app/InstructorPupilsDesktop.tsx`) — existing Archive button now opens the same reason dialog before soft-archiving (currently archives with no reason).
3. **Pupil detail page** (`src/pages/PremiumPupilProfile.tsx`) — add an "Archive pupil" item in the header overflow menu, opening the reason dialog and returning the user to the pupils list after success.
4. **Archived Pupils dialog** (`src/components/instructor/pupils/ArchivedPupilsDialog.tsx`) — show the reason under each archived pupil and include it in the restore confirmation.

Out of scope: bulk archive, separate "paused vs archived" states, admin-level reason analytics.

## Reason capture UX

A single reusable `ArchivePupilDialog` component:

- **Preset reasons** (radio chips, instructor-friendly):
  - Passed test
  - Stopped lessons / lost contact
  - Switched instructor
  - Moved away
  - Behaviour / safeguarding
  - Duplicate record
  - Other
- **Free-text note** (optional, up to 280 chars; required when "Other" is selected).
- Primary action **Archive pupil**, secondary **Cancel**.
- Confirms with a toast: "Archived {name} — restore from Archived list."

The dialog is shared between mobile, desktop and detail page so behaviour stays consistent.

## Data model

Reuse existing soft-delete column `pupils.deleted_at`. Add two new nullable columns:

- `archive_reason text` — preset code (e.g. `passed_test`, `stopped`, `switched`, `moved`, `behaviour`, `duplicate`, `other`).
- `archive_note text` — optional free-text detail.

Both clear to NULL on restore. No backfill needed.

Migration:

```sql
ALTER TABLE public.pupils
  ADD COLUMN archive_reason text,
  ADD COLUMN archive_note   text;
```

RLS unchanged — existing instructor-scoped policies on `pupils` already gate updates.

## Implementation outline

**New file** `src/components/instructor/pupils/ArchivePupilDialog.tsx`
- Props: `open`, `onOpenChange`, `pupil: { id; name }`, `onArchived?()`.
- On confirm: `update pupils set deleted_at = now(), archive_reason, archive_note where id = :id` then invalidates the pupils list query.

**Mobile list** (`InstructorPupils.tsx`)
- Add a small kebab/overflow icon to each pupil tile (or a swipe-left action — pick kebab to stay consistent with iOS list patterns in this app).
- Menu items: "Edit" (if not already), "Archive…".
- "Archive…" opens `ArchivePupilDialog`.

**Desktop list** (`InstructorPupilsDesktop.tsx`)
- Replace the current direct soft-delete on the Archive confirm (around the existing `AlertDialog` near line 1588) with `ArchivePupilDialog`. Remove the old plain confirm alert.

**Detail page** (`PremiumPupilProfile.tsx`)
- Add an overflow menu in the header with an "Archive pupil…" item that opens `ArchivePupilDialog`. After success, navigate back to `/instructor/pupils`.

**Archived dialog** (`ArchivedPupilsDialog.tsx`)
- Select `archive_reason, archive_note` alongside existing fields.
- Render a small label under each row: e.g. *"Reason: Passed test"* (with the optional note in parentheses).
- On restore, also set `archive_reason = null, archive_note = null`.

## Technical notes

- Reason codes live in a single const map (`ARCHIVE_REASONS`) in `ArchivePupilDialog.tsx`, also imported by `ArchivedPupilsDialog.tsx` for label rendering.
- All Supabase writes go through the existing client; no edge function needed.
- The mobile tile menu uses the existing `Sheet` + button pattern already used elsewhere in the instructor mobile app, keeping radii and tokens per the DSM design memory.
- Migration must run before code is merged; the new columns are nullable so old code continues to work.
