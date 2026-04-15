

## Restyle TodayScheduleAgenda to iOS Design

Restyle the `TodayScheduleAgenda` component to match the provided iOS-style HTML mockup exactly. No functionality changes — same data, same links, same Today/Tomorrow tabs.

### Visual changes to `src/components/instructor/TodayScheduleAgenda.tsx`

1. **Outer card**: White `#FFFFFF` background, `border-radius: 20px`, `0.5px solid #E5E5EA` border, light shadow, overflow hidden — replaces the current unstyled wrapper

2. **Header row**: Inside the card top, left-aligned "Today's Schedule" title (`15px`, `font-weight: 700`, black) with subtitle showing day/date and lesson count (`12px`, `#8E8E93`). Right side: iOS-style segmented control (Today/Tomorrow) using `#F2F2F7` background pill with `border-radius: 9px`, active tab gets white background with subtle shadow

3. **Divider**: `0.5px` solid `#F2F2F7` line between header and lesson list

4. **Lesson rows**: Each row gets inline iOS styling — no card/border per row, just padding with `0.5px` bottom divider between items. Time on the left in bold, pupil name + details on the right. Payment amount right-aligned. Completed lessons get a muted/strikethrough treatment

5. **Empty state**: Centered "No lessons scheduled" with calendar icon, matching `#8E8E93` text

6. **Summary bar**: Restyled with iOS grey text palette — earnings in `#30D158`, paid count in green

### Technical details

- Replace the shadcn `Tabs`/`TabsList`/`TabsTrigger` with a custom iOS-style segmented control using plain buttons + state
- Use inline `style` props for precise iOS colours (`#E5E5EA`, `#8E8E93`, `#F2F2F7`, `#30D158`)
- Keep all existing props, data flow, links, and `PupilAvatar` usage unchanged
- Remove the external "Schedule" heading and "See all" link — move them inside the card header
- Single file edit: `src/components/instructor/TodayScheduleAgenda.tsx`

