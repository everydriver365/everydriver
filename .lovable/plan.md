## Goal

Make every visible number/badge on the instructor mobile home screen reflect **live database data**. Static placeholders are only acceptable when **Demo Mode** (`instructor.demo_mode = true`) is enabled, in which case sample numbers come from the existing `demoModeData.ts`.

## Scope (what's static today, after the previous audit)

1. **`InsightTilesGrid.tsx`** — three of four tiles show hardcoded subtitles, no live counts:
   - Vehicle health → "View status"
   - Smart nudges → "Suggested actions"
   - Re-engage → "Dormant pupils" + always-on `liveDot`
2. **`BottomPromoGroup.tsx`** — "Discover Features" tile has a hardcoded **`45+`** badge.
3. **`ReadyToTeachTile.tsx`** — purely presentational; no fetching of its own. Acceptable as-is, but we'll add a defensive note (no code change needed) since parents already pass live props.

Everything else on the home screen is already wired to live hooks (verified in the previous audit).

## Approach

### 1. Add live counts to `InsightTilesGrid`

Convert it from a dumb tile grid into a component that fetches its own three missing counts. Pass `instructorId` from `InstructorMobileHome` (and any other caller).

| Tile | New live source |
|---|---|
| Vehicle health | `useVehicleHealth()` → `engineFaultCount` (sum of `last_fault_codes` lengths). Subtitle: "All clear" / "N fault code(s)". `liveDot` only when count > 0. |
| Smart nudges | New lightweight hook `useSmartNudgesCount(instructorId)` that invokes the existing `generate-nudges` edge function (already used by `SmartNudgesCard`) with a 5-min stale time, returning `nudges.length`. Subtitle: "No suggestions" / "N suggestion(s)". |
| Re-engage | New `useDormantPupilsCount(instructorId)` — query `pupils` for active pupils whose latest `scheduled_lessons.lesson_date` is > 30 days ago (or never). Reuses the same logic already present in `DormantPupilsCard`, extracted into a hook. Subtitle: "All caught up" / "N dormant". `liveDot` only when count > 0. |

Fill gaps tile already uses the live `gapCount` prop — unchanged.

### 2. Replace the "45+" badge in `BottomPromoGroup`

The Discover Features sheet enumerates features from a registry. Replace the hardcoded `45+` with `features.length` from that registry (read from `DiscoverFeaturesSheet`'s data source — extract the feature list into a small shared module if not already exported). Falls back to no badge if the count is 0.

### 3. Demo Mode gating

Use the existing `useDemoMode()` hook. In `InsightTilesGrid` and `BottomPromoGroup`:

```ts
const { isDemoMode } = useDemoMode();
const vehicleFaultCount = isDemoMode ? demoStats.vehicleFaults : liveFaultCount;
const dormantCount      = isDemoMode ? demoStats.dormantPupils : liveDormantCount;
const nudgesCount       = isDemoMode ? demoStats.smartNudges   : liveNudgesCount;
const featuresCount     = isDemoMode ? 45 : liveFeaturesCount;
```

Add the missing demo fields (`vehicleFaults`, `dormantPupils`, `smartNudges`) to `src/data/demoModeData.ts` with realistic sample numbers (e.g. 1, 3, 4).

### 4. Sweep audit (defensive)

Grep the instructor mobile components one more time for inline numeric strings (`"45+"`, `"3 new"`, etc.) and confirm no other hardcoded counts slipped in. Fix any that surface.

## Files to change

- `src/components/instructor/InsightTilesGrid.tsx` — accept `instructorId`, add live hooks, demo-mode gating.
- `src/components/instructor/InstructorMobileHome.tsx` — pass `instructorId` (and possibly remove the now-unused `gapCount` prop wiring if needed).
- `src/components/instructor/BottomPromoGroup.tsx` — read live feature count + demo gating.
- `src/components/instructor/DiscoverFeaturesSheet.tsx` — export the feature list (or its length).
- `src/hooks/useDormantPupilsCount.ts` (new) — extracted from `DormantPupilsCard` logic.
- `src/hooks/useSmartNudgesCount.ts` (new) — wraps `generate-nudges` edge function call with React Query caching.
- `src/data/demoModeData.ts` — add `vehicleFaults`, `dormantPupils`, `smartNudges` sample numbers.

## Out of scope

- Other instructor pages (Pupils, Pay, Jobs, etc.) — already use live data per the previous audit.
- Marketing/landing pages and the public mini-website.
- Demo mode for tiles that already correctly show real data — they'll just continue to display real numbers (demo mode override there is a separate feature, not requested).

## Acceptance

- With Demo Mode **off**: every numeric badge / subtitle on the instructor mobile home reflects the signed-in instructor's actual data (or shows an empty/"All clear" state).
- With Demo Mode **on**: the same tiles display the sample numbers from `demoModeData.ts`.
- No string literals like `"45+"`, `"View status"`, `"Suggested actions"`, `"Dormant pupils"` remain as the only thing the user sees on these tiles.
