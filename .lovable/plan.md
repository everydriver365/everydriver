## Plan: Surface "Lesson length, buffer & bank holidays" in the Working hours page

The section already exists in `categories.tsx` and is pulled into the `working-hours` area in `v3/areas.tsx`, but it currently renders **last** (after Google Calendar sync and Reminders), which buries it. It should sit next to Working hours where it logically belongs.

### Change

**`src/components/instructor/settings/categories.tsx`** — reorder `schedule.sections` so the new editor appears directly under Working hours:

1. Working hours
2. **Lesson length, buffer & bank holidays** ← move up
3. Pupil self-service booking
4. Google Calendar sync
5. Lesson reminders

**`src/components/instructor/settings/v3/areas.tsx`** — update the `pulls` array order for `working-hours` to match:

```
[hours, lesson-length, self-service, calendar, reminders]
```

### Verification

- Visit `/instructor/settings/working-hours` and confirm the five rows render in the order above.
- Confirm the editor's fields (default lesson length, buffer minutes, auto-block bank holidays) edit cleanly and trigger the sticky save bar.

### Out of scope

- No changes to `LessonLengthBufferEditor` itself.
- No changes to other settings pages, mobile layout, or save-bar wiring (already done in the previous step).