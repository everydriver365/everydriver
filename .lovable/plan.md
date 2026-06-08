## Goal
Let instructors pick a date in the past when adding a lesson (useful for logging lessons that have already happened).

## Change
In `src/components/instructor/ScheduleLessonsDialog.tsx` (line 287), the date picker currently blocks past dates:

```tsx
disabled={(date) => date < new Date()}
```

Remove this restriction so any date — past, today, or future — can be selected.

## Scope
- Only the "Add lesson" dialog (`ScheduleLessonsDialog`) on the instructor portal.
- Other date pickers (booking flow `LessonScheduler`, reschedule sheet, gap filling, etc.) keep their existing rules — those represent live future scheduling and shouldn't allow back-dating.
- No backend, validation, or availability-engine changes. Past lessons will simply be saved with their chosen date.

## Verify
Open Add Lesson → confirm yesterday and earlier dates are selectable and save successfully.