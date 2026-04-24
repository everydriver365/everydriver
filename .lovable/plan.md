When the Upcoming Events query returns no results, hide the whole section (header + "No events scheduled" placeholder) instead of rendering an empty card.

## Changes

**`src/components/instructor/UpcomingEventsCard.tsx`**
- After loading completes, if `events.length === 0`, return `null` so neither the `SectionHeader` nor the empty-state card render.
- Keep the skeleton visible during the initial load so layout doesn't flash.
- Remove the now-unused empty-state branch.