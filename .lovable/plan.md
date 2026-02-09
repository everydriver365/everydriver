
# Tint Tiles on Instructor Mobile Home

## Overview
Apply the same tinted icon background pill pattern (used on sub-pages like Schedule, Pay, Expenses, etc.) to all tiles and widget cards on the instructor mobile home page. This creates visual consistency across the entire mobile experience.

## Components to Update

### 1. TodayMiniTimeline (`src/components/instructor/TodayMiniTimeline.tsx`)
- Add a tinted header icon pill: `h-8 w-8 rounded-lg bg-blue-100` with a `Clock` or `Calendar` icon in `text-blue-600`
- Currently just has a plain text header "Today's Schedule"

### 2. TomorrowPeekCard (`src/components/instructor/TomorrowPeekCard.tsx`)
- Already has a tinted icon pill (`bg-primary/10`) -- update to use a specific color like `bg-indigo-100` with `text-indigo-600` for more visual variety

### 3. VehicleHealthStrip (`src/components/instructor/VehicleHealthStrip.tsx`)
- Currently uses a plain `Car` icon with `text-primary`
- Wrap in a tinted pill: `h-8 w-8 rounded-lg bg-sky-100` with `text-sky-600`

### 4. UnifiedAgendaTile (`src/components/instructor/dashboard/UnifiedAgendaTile.tsx`)
- Already uses a custom PNG icon (`agendaIcon`) -- no change needed (custom image icons are exempt)

### 5. PlanWidget (`src/components/instructor/dashboard/PlanWidget.tsx`)
- Currently uses a plain `Crown` icon with `text-muted-foreground`
- Wrap in a tinted pill: `h-8 w-8 rounded-lg bg-amber-100` with `text-amber-600`

### 6. ReferralStatsWidget (`src/components/instructor/dashboard/ReferralStatsWidget.tsx`)
- Currently uses a plain `Gift` icon with `text-muted-foreground`
- Wrap in a tinted pill: `h-8 w-8 rounded-lg bg-pink-100` with `text-pink-600`

### 7. MessagesWidget (`src/components/instructor/dashboard/MessagesWidget.tsx`)
- Currently uses a plain `MessageSquare` icon with `text-blue-500`
- Wrap in a tinted pill: `h-8 w-8 rounded-lg bg-blue-100` with `text-blue-600`

### 8. GapFillerCard (`src/components/instructor/GapFillerCard.tsx`)
- Currently has no icon in the header area
- Add a tinted icon pill: `h-8 w-8 rounded-lg bg-violet-100` with a `CalendarPlus` icon in `text-violet-600`

### 9. TodayRoutePreview (`src/components/instructor/TodayRoutePreview.tsx`)
- This is a map preview card -- the header/title area will get a tinted icon pill if it has one

## Technical Details

The pattern applied to each component follows this structure:
```tsx
<div className="h-8 w-8 rounded-lg bg-{color}-100 dark:bg-{color}-900/30 flex items-center justify-center">
  <Icon className="h-4 w-4 text-{color}-600 dark:text-{color}-400" />
</div>
```

### Color Assignments
| Component | Color | Icon |
|-----------|-------|------|
| TodayMiniTimeline | Blue | Calendar |
| TomorrowPeekCard | Indigo | Calendar |
| VehicleHealthStrip | Sky | Car |
| PlanWidget | Amber | Crown |
| ReferralStatsWidget | Pink | Gift |
| MessagesWidget | Blue | MessageSquare |
| GapFillerCard | Violet | CalendarPlus |

### Files Modified (8 files)
- `src/components/instructor/TodayMiniTimeline.tsx`
- `src/components/instructor/TomorrowPeekCard.tsx`
- `src/components/instructor/VehicleHealthStrip.tsx`
- `src/components/instructor/dashboard/PlanWidget.tsx`
- `src/components/instructor/dashboard/ReferralStatsWidget.tsx`
- `src/components/instructor/dashboard/MessagesWidget.tsx`
- `src/components/instructor/GapFillerCard.tsx`
- `src/components/instructor/TodayRoutePreview.tsx`
