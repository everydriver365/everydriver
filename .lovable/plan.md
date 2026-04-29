## Restore Gap Filler to Schedule page

Add the existing `GapFillerCard` (currently unused) to the top of the Schedule page so it appears above the day-grouped list, matching what you remember seeing.

### What changes

In `src/pages/InstructorSchedule.tsx`:

1. Import `GapFillerCard` and the `useRealGapSlots` hook.
2. Call `useRealGapSlots(instructorId)` once in the component.
3. Render `<GapFillerCard gaps={gapSuggestions ?? []} isLoading={...} />` at the top of the content area, above the view content — visible in **all** Schedule view modes (Schedule list, Calendar grid, List, Day grid) so it's always reachable from this page.
4. Hide the card entirely when there are zero gap suggestions and it's finished loading, to avoid empty chrome.

### What stays the same

- The existing home-screen surfacing (`useRealGapSlots` count on insight tiles in `CompactHomeView` / `BestMateHomeView` / `MissionControlHomeView`) is untouched.
- The `GapFillerCard` component itself is unchanged — it already exists with the correct props, skeleton, and Fill flow.
- All other Schedule page behaviour (toggle, sync, lesson tap-through, FAB, sheets) is unchanged.

### Placement detail

```text
┌──────────────────────────────────────┐
│  [Calendar] [Schedule]   📅 Sync     │  ← existing header
├──────────────────────────────────────┤
│  ┌────────────────────────────────┐  │
│  │ 🟢 Fill gaps · 3 open slots  → │  │  ← restored GapFillerCard
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ TUE 29 APR · TODAY             │  │
│  │  09:00  ▎ Berty Fishtank   ›   │  │  ← compact list
│  │  ...                           │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

Approve and I'll switch to build mode and apply the change.