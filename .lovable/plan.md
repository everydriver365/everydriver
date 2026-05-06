## Remove Find Slot side panel — Instructor desktop schedule

**File:** `src/pages/instructor-app/InstructorScheduleDesktop.tsx`

1. Drop the `rightRail={<RightRail ... />}` prop on the layout shell so the calendar uses full width.
2. Delete the `RightRail` component and the `PupilChip` helper (only used by the rail).
3. Remove dead state/derivations: `aiSuggestions`/`setAiSuggestions`, `unbookedPupils` memo.
4. Remove unused icon imports `Sparkles` and `GripVertical`.
5. Keep the toolbar `Find a slot — try "2h Tue morning"` search input and its `aiPrompt` state — it lives in the calendar toolbar, not the side panel.

Mobile schedule and the shared availability hook are untouched.