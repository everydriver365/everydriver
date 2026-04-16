

# Tile Design Consistency Audit

## Current State

The "Insight Tile" design spec (white bg `#FFFFFF`, `0.5px solid #E4E4E7` border, `14px` border-radius, no box-shadow, Inter font 15px/500 + 12px/400) has been applied to:
- Insight Tiles Grid
- Activity Tiles Grid  
- Waiting Room Promo Tile
- Telematics Tile
- View Schedule Tile
- Pupil Cards
- Pupil stat pills/filter tabs
- Schedule event tiles
- InstructorPay summary + quick action tiles

## Components Still Using Old Design

The following tiles still use the legacy style (`rounded-2xl`, `shadow-[0_2px_8px_rgba(20,37,66,0.08)]`, Tailwind theme colors instead of explicit hex):

| Component | File | Issue |
|-----------|------|-------|
| **MoneyActionGrid** | `src/components/instructor/money/MoneyActionGrid.tsx` | `rounded-2xl`, box-shadow, Tailwind `bg-card`/`text-primary` classes, `rounded-full` icon containers |
| **NextLessonCard** | `src/components/instructor/NextLessonCard.tsx` | `rounded-2xl`, box-shadow |
| **GapFillerCard** | `src/components/instructor/GapFillerCard.tsx` | `rounded-2xl`, box-shadow |
| **FuelFinderCard** | `src/components/instructor/FuelFinderCard.tsx` | `rounded-2xl`, box-shadow, `rounded-2xl` icon containers |
| **TodayRoutePreview** | `src/components/instructor/TodayRoutePreview.tsx` | `rounded-2xl`, box-shadow |
| **ContextualHomeHero** | `src/components/instructor/ContextualHomeHero.tsx` | box-shadow on overlapping card |
| **InstructorCard** | `src/components/instructor/InstructorCard.tsx` | `ios-card-shadow`, `rounded-2xl` (generic wrapper used in various places) |
| **DiscoverFeaturesTile** | `src/components/instructor/DiscoverFeaturesTile.tsx` | `rounded-2xl`, `shadow-sm` |
| **KanbanBoard** | `src/components/instructor/pipeline/KanbanBoard.tsx` | `rounded-[14px]` but has box-shadow |
| **InstructorGPSSetup** | `src/pages/InstructorGPSSetup.tsx` | `rounded-lg`, box-shadow on cards |

## Plan

Restyle each component above to match the Insight Tile spec:

1. **MoneyActionGrid** — Replace `rounded-2xl` with `borderRadius: 14`, remove box-shadow, use `#FFFFFF` bg with `0.5px solid #E4E4E7` border, change icon containers from `rounded-full` to `borderRadius: 12` squares (44x44), use explicit hex colors for icons.

2. **NextLessonCard** — Replace shadow and `rounded-2xl` with the standard tile container style. Keep swipe-to-dismiss and all interactive behaviour.

3. **GapFillerCard** — Update both skeleton and main card containers to the standard tile style.

4. **FuelFinderCard** — Update skeleton, error, and main states to the standard tile style.

5. **TodayRoutePreview** — Replace shadow and `rounded-2xl` with the standard style. Keep map display and click handler.

6. **ContextualHomeHero** — Remove box-shadow from the overlapping card.

7. **InstructorCard** — Replace `ios-card-shadow` and `rounded-2xl` with `borderRadius: 14` and `0.5px solid #E4E4E7`. Remove ring utility. This is a shared wrapper, so all consumers automatically update.

8. **DiscoverFeaturesTile** — Replace `rounded-2xl` and `shadow-sm` with standard tile style.

9. **KanbanBoard** — Remove box-shadow from column containers.

10. **InstructorGPSSetup** — Update device cards and provider banner to standard tile style.

All changes are purely visual — no functional or behavioural modifications.

