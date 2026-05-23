## Plan

1. **Fix the picker shown in your screenshot**
   - Update `src/components/instructor/AddCalendarEventDialog.tsx` so its `fetchPupils()` query excludes archived pupils with `deleted_at IS NULL`.
   - This is the picker labelled **Add to Calendar → Add Lesson → Select a pupil**.

2. **Add a save-time guard in the same dialog**
   - Before inserting a lesson from this dialog, validate the selected pupil is still active/not deleted.
   - If the pupil has been archived since the list loaded, block the booking and show a clear error.

3. **Spot-check related lesson booking pickers**
   - Confirm `AddLessonSheet` and `PupilSelector` keep their existing `deleted_at IS NULL` filters.
   - Do not change read-only archived/history views.

4. **Verify**
   - Confirm `Algernon Bin Bag` remains `deleted_at` in the database.
   - Recheck the mobile Add to Calendar list no longer includes deleted pupils.

## Technical details

The screenshot is not using the newer `AddLessonSheet`; it is using `AddCalendarEventDialog`, whose pupil query currently filters only by `instructor_id` and orders by name. That query needs the same archived-pupil filter already used in the newer lesson sheet.