## Change

In `src/pages/PremiumPupilProfile.tsx` (line 2371), replace the `onSaved` handler on `EditPupilSheet` to:

1. Invalidate the `["pupil-profile", pupil?.id, instructorId]` query (as today).
2. Immediately call `queryClient.refetchQueries({ queryKey: ["pupil-profile", pupil?.id, instructorId], type: "active" })` and `await` it, so the tile data is forcibly re-fetched from the server even if the invalidation alone doesn't trigger a refetch (e.g. query not considered stale, mounted but inactive, or focus-based refetch disabled).

```tsx
onSaved={async () => {
  const key = ["pupil-profile", pupil?.id, instructorId];
  await queryClient.invalidateQueries({ queryKey: key });
  await queryClient.refetchQueries({ queryKey: key, type: "active" });
}}
```

No other components, no schema, no business logic, no mobile layout changes.

## Verification

- Open a pupil record on the mobile instructor app.
- Tap top **Edit**, change a field, save.
- Confirm the tile reflects the new value without any manual refresh.
- Confirm inline edits and Theory/Driving test edits still behave as before.
