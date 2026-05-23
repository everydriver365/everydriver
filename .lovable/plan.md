## Goal
Make sure soft-deleted pupils can never appear in instructor "add lesson" pickers, and can never be booked into a lesson — even from older code paths or stale data.

## What I found

Both mobile lesson-add entry points already filter on the client:
- `AddLessonSheet.tsx` (line 322) — `.is('deleted_at', null)` ✓
- `VoiceQuickAddLessonSheet.tsx` (line 84) — `.is('deleted_at', null)` ✓

So the UI looks correct today. The Algernon Bin Bag orphan lesson was likely booked before that pupil was archived (or via a flow we no longer use). What's missing is a **server-side guard** so this can never happen again, regardless of which client path is used.

I'll also do a sweep of remaining pupil pickers to make sure none of them surface deleted pupils when used for any lesson/booking-related action.

## Plan

### 1. Database guard (prevents the bug at the source)
Add a `BEFORE INSERT OR UPDATE OF pupil_id` trigger on `public.scheduled_lessons` that raises an error if the referenced pupil has `deleted_at IS NOT NULL`. This guarantees that no client, edge function, or future code path can ever attach a lesson to an archived pupil.

```sql
CREATE OR REPLACE FUNCTION public.prevent_lesson_for_deleted_pupil()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.pupils
    WHERE id = NEW.pupil_id AND deleted_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Cannot book a lesson against an archived pupil'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_lesson_for_deleted_pupil
BEFORE INSERT OR UPDATE OF pupil_id ON public.scheduled_lessons
FOR EACH ROW EXECUTE FUNCTION public.prevent_lesson_for_deleted_pupil();
```

### 2. Clean up the existing orphan lesson
The 23 May 20:00 lesson booked against archived pupil "Algernon Bin Bag" is what's currently hiding behind the Next Up tile. I'll cancel it (set `status = 'cancelled'`) so the Next Up tile resolves correctly. If you'd rather restore the pupil instead, say so and I'll do that.

### 3. Client picker audit
Confirm the two known lesson-add pickers stay filtered (they already are) and add `.is('deleted_at', null)` to any other instructor-mobile pupil picker that feeds into a lesson/booking action. Candidates I'll re-check:
- `PupilSelector.tsx` (used by favourite-location dialogs — not lesson booking, but cheap to fix)
- `QuickActionsFAB` quick-add paths
- Any pupil dropdown reachable from the mobile schedule / home FAB

Pure read-only views (reports, history, archived-pupils dialog) are explicitly left alone — they need to show deleted pupils.

### 4. Verify
- Try booking a lesson against an archived pupil via SQL — expect the trigger to reject.
- Reload `/instructor` on mobile — Next Up should now show today's correct lesson (or fall through cleanly to the next real one).
- Spot-check the mobile add-lesson sheet to confirm Algernon no longer appears in the pupil list.

## Files touched
- New migration: trigger + function
- Data update: cancel the one orphan lesson
- Possibly small `.is('deleted_at', null)` additions in 1–2 picker components
