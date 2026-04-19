

## Plan: Redesign instructor mobile homepage

Build a new, focused mobile homepage matching the spec. Keep all real data wired to existing hooks.

### Files

**New**
- `src/components/instructor/redesign/MapHero.tsx` — full-bleed map card (header strip, SVG map, action buttons)
- `src/components/instructor/redesign/StatTile.tsx` — small 2x2 grid tile (label / number / caption, optional red border)
- `src/components/instructor/redesign/RowCard.tsx` — Tests / Fill Gaps style row (left border, icon square, title + pill, chevron)
- `src/components/instructor/redesign/TelematicsPanel.tsx` — navy panel with vehicle + status pill
- `src/components/instructor/redesign/RedesignedMobileHome.tsx` — page composition

**Edited**
- `src/components/instructor/MobileBlueHeader.tsx` — switch gradient from blue to navy (`#0a0e27 → #141a3d`), keep existing structure (bell+badge, DSM logo centre, SOS / + / menu). All other functionality unchanged.
- `src/components/instructor/InstructorMobileHome.tsx` — replace the default `<>` block (lines 445–608, the standard layout branch) with `<RedesignedMobileHome />`. Other layout-style branches (ios-native, compact, bestmate, etc.) untouched.
- `tailwind.config.ts` — add brand tokens: `dsm-red #D12E2E`, `dsm-blue #1a6fd4`, `dsm-navy #0a0e27`, `alert-red #E24B4A`, `dsm-bg #f5f6fa`, `text-secondary #5F5E5A`, `text-tertiary #888`, `dsm-success #2e7d32`, `dsm-success-soft #5DCAA5`.

### Data wiring (all real, from existing hooks)

| UI element | Source |
|---|---|
| Greeting name | `instructor.first_name` |
| Date | `format(new Date(), "EEEE, d MMMM yyyy")` |
| Next lesson time / pickup / countdown | `useNextLessonDetails` (`startTime`, `pickupLocation`, `minutesUntil`) |
| ETA "1 min" | `useTrafficETA` / `useInstructorEnRouteETA` (already used on dashboard) |
| Earnings £ | `weeklyGoals.earningsThisWeek` |
| Job offers count | `usePendingJobsCount` |
| This week lessons | `weeklyGoals.lessonsThisWeek` |
| Messages | `useUnreadMessagesCount` |
| Tests swap requests | existing `testSwapCount` |
| Fill gaps slots | `useRealGapSlots` |
| Telematics reg/vehicle/status | existing vehicle hook used by `TelematicsTile` |

Countdown derived live: `Math.floor(minutesUntil/60)`h `minutesUntil%60`m, refreshed every minute via `setInterval`.

### Component details

**MapHero**
- White `rounded-2xl` card, overflow hidden.
- Top strip: left = "NEXT LESSON · IN {countdown}" / "Next lesson" / pickup area; right = "PICKUP" / time / green ● ETA.
- 180px inline SVG map per spec (base, road casings + fills, building rects, park blobs, blue route polyline, pulsing start marker, red destination teardrop, faint street labels, white pill destination label).
- Absolute overlays: top-left ETA pill, top-right zoom +/− stack, bottom-right compass circle.
- Action buttons row: red "Start navigation" (→ existing nav handler if available, else `/instructor/tracking?lessonId=…`), grey "Start track" (→ `/instructor/tracking`).
- Built so the SVG block can later swap to Google Maps/Mapbox without changing the card shell.

**StatTile** — props: `label`, `value`, `caption`, `urgent?: boolean`. Urgent variant: 1.5px `dsm-red` border, red label, small pulsing red dot top-right.

**RowCard** — props: `accentColor`, `iconBg`, `Icon`, `title`, `caption`, `pillValue`, `pillBg`, `pillFg`, `onClick`. 3px left border, 36×36 icon square, title + pill on right of header line, caption below, chevron.

**TelematicsPanel** — navy bg, blue-tinted icon square with `Activity`, vehicle line with reg + model, green-tinted status pill with dot.

**Header change** — only the gradient string changes:
```
linear-gradient(145deg, #0a0e27 0%, #141a3d 100%)
```
Everything else (bell, badges, logo, SOS, +, menu, safe-area fill) stays.

### Layout (RedesignedMobileHome)

```text
┌─ (MobileBlueHeader — navy now) ─┐
│ Greeting "Good morning, Ken"    │
│ "Sunday, 19 April 2026"          │
│ ┌── MapHero ───────────────────┐ │
│ │ next lesson strip + map +   │ │
│ │ Start navigation / track    │ │
│ └─────────────────────────────┘ │
│ ┌Earnings┐┌Job Offers (red)┐   │
│ ┌This wk ┐┌Messages       ┐   │
│ ┌─ Tests row (blue accent) ──┐ │
│ ┌─ Fill gaps row (black) ────┐ │
│ ┌─ TelematicsPanel ──────────┐ │
└─────────────────────────────────┘
(existing InstructorBottomNav unchanged)
```

Page bg `#f5f6fa`, 16px horizontal padding, 12px vertical gaps.

### What stays (unchanged)
- `MobileBlueHeader` structure, bell/SOS/+/menu actions, badge counts.
- `InstructorBottomNav` (Home/Schedule/Track/Pupils/More) and its badge logic.
- All other layout-style variants (ios-native, compact, etc.) — only the default branch in `InstructorMobileHome` is swapped.
- All hooks, routes, and click handlers — only visual composition changes.

### Out of scope
- No voice mic / "Hey ED" bubble (already not in the standard branch).
- No backend / RLS / migration changes.
- No edits to other layout views.

