

# Show "Nothing Upcoming" Empty State in Plan Ahead

## What changes
When there are no lessons scheduled for tomorrow and the setup checklist has nothing to show, display a friendly empty state graphic in the Plan Ahead section instead of showing nothing.

## How it works

1. **Always show the PLAN AHEAD heading** -- remove the conditional that hides it when there's nothing to display.

2. **Add an empty state** using the existing `EmptyState` component when `tomorrowPreview.lessonCount === 0` (and the checklist isn't rendering content). It will show:
   - A calendar icon
   - Title: "Nothing upcoming"
   - Description: "Your schedule is clear for tomorrow. Enjoy the downtime or check your waitlist!"
   - Optional action button: "Check Waitlist" linking to `/instructor/gaps`
   - Compact mode so it doesn't dominate the page

## File to modify

| File | Change |
|------|--------|
| `src/components/instructor/InstructorMobileHome.tsx` | Always render the PLAN AHEAD heading; add an `EmptyState` block (using the existing reusable component) when `tomorrowPreview.lessonCount === 0`, shown between the heading and the setup checklist |

## Technical details

- Reuses `src/components/ui/EmptyState.tsx` (already in the project) with `compact={true}`, `icon={Calendar}`, and a "Check Waitlist" action button
- The empty state only appears when `tomorrowPreview` data has loaded and `lessonCount === 0`
- The setup checklist continues to render independently below it

