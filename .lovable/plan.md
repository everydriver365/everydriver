

# New Pupil Checklist Feature

## Overview

A collapsible "New Pupil Checklist" section on the expanded pupil card, allowing instructors to quickly capture and verify important details for new learners during their first lesson. Each item is interactive -- some are checkboxes, some are text inputs, and one allows a photo upload.

## What It Looks Like

A collapsible panel (matching the existing Tracking History / Feedback style) with:

- Eyesight check (checkbox + pass/fail toggle)
- Needs glasses (checkbox)
- Special needs / requirements (text field)
- DVLA check code (text input)
- Driver number (text input -- already exists in DB, pre-fills if set)
- Theory test certificate number (text input -- already exists in DB, pre-fills if set)
- Previous driving experience (dropdown: None / Some lessons / Significant experience)
- Driving licence photo (camera/upload button, stores image in `pupil-avatars` bucket)

A green progress indicator shows "5/8 completed" and a save button persists everything to the database.

## Database Changes

Add new columns to the `pupils` table:

```
eyesight_checked       boolean   default null
needs_glasses          boolean   default null
special_needs          text      default null
dvla_check_code        text      default null
previous_experience    text      default null
licence_photo_url      text      default null
checklist_completed_at timestamptz default null
```

`driver_number` and `theory_cert_number` already exist -- no changes needed for those.

## New Component

**`NewPupilChecklist.tsx`** -- a self-contained component that:
- Fetches the pupil's current checklist data on mount
- Renders each item with appropriate input type (checkbox, text, dropdown, photo)
- Shows completion progress (X/8 items)
- Saves all fields to the `pupils` table on "Save Checklist"
- Photo upload uses the existing `pupil-avatars` storage bucket
- Marks `checklist_completed_at` when all items are filled

## Integration

- Imported and rendered inside `ExpandablePupilCard.tsx`, placed after the Notes section and before the Lesson Feedback section (around line 800)
- Uses the same collapsible panel style as Tracking History (border, rounded-lg, bg-muted/30 header)
- Icon: `ClipboardCheck` from lucide-react

## Technical Details

### Files Created
| File | Purpose |
|------|---------|
| `src/components/instructor/NewPupilChecklist.tsx` | The checklist component with form fields, photo upload, and save logic |

### Files Modified
| File | Change |
|------|--------|
| `src/components/instructor/ExpandablePupilCard.tsx` | Import and render `NewPupilChecklist` in expanded card body |

### Database Migration
- Add 7 new nullable columns to `pupils` table (eyesight_checked, needs_glasses, special_needs, dvla_check_code, previous_experience, licence_photo_url, checklist_completed_at)
- No RLS changes needed -- existing `pupils` table policies already cover instructor access

### Storage
- Uses existing `pupil-avatars` bucket (already public) for licence photo uploads
- File path: `{pupilId}/licence-{timestamp}.jpg`

