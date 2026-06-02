# Fix: Top Edit button changes not reflected on Pupil Record

## Root cause

The top **Edit** button on the mobile pupil record opens `EditPupilSheet`. On save it only invalidates `["next-lesson-details"]` and calls `onSaved?.()` — but `PremiumPupilProfile` never passes an `onSaved` handler. The page's tiles are driven by `["pupil-profile", pupilId, instructorId]`, which is never invalidated, so the UI shows stale data until a manual refresh.

Inline `EditableRow` saves and the Theory/Driving test sheets work correctly because they invalidate that exact query key.

## Change

Single-line wiring fix in `src/pages/PremiumPupilProfile.tsx` (around line 2366) — pass `onSaved` to `EditPupilSheet` so the pupil-profile query is invalidated after a save:

```tsx
<EditPupilSheet
  open={editOpen}
  onOpenChange={setEditOpen}
  pupil={pupil}
  instructorId={instructorId || null}
  onSaved={() =>
    queryClient.invalidateQueries({
      queryKey: ["pupil-profile", pupil?.id, instructorId],
    })
  }
/>
```

No business logic, schema, or other component changes. Mobile layout untouched.

## Verification

- Open a pupil record on the mobile instructor app.
- Tap top **Edit**, change a field (e.g. phone, postcode, notes), save.
- Confirm the corresponding tile updates immediately without a manual refresh.
- Confirm inline edits and Theory/Driving test edits still work as before.
