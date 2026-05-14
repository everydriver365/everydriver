# Lesson scheduler redesign

Yes, your spec works as-is. It's well-defined and matches what the current scheduler is missing (no scroll between calendar/slots, persistent lesson list). One caveat at the bottom about sticky positioning — flagged because it is the most likely thing to bite us.

## What changes

### 1. `src/components/booking/LessonScheduler.tsx` — rebuild internals
Replace the current vertical-stack layout (calendar → length panel → slots → list) with the spec:

- **Header card** (full width): icon + title/helper on left, hours-booked + 8px progress bar on right. Drive365 navy `#142040` for primary, soft blue tint for icon backdrop.
- **Two-column grid** below (`grid-cols-[60%_40%]`, 16px gap):
  - **Left workspace card**: toolbar (month nav left, length pill toggle right) + inner `grid-cols-2` with calendar on the left and slot pane on the right separated by `border-l pl-[14px]`.
  - **Right scheduled-lessons card**: `position: sticky; top: 16px;` with internal `max-h-[320px] overflow-y-auto` list and confirm button pinned underneath.
- **Calendar cells**: keep existing day-state logic but restyle to the four states (past, available soft-green, has-lesson soft-blue + dot, selected primary). Add legend row.
- **Slot pane**: group existing slot data into Morning (<12), Afternoon (12–17), Evening (≥17). Single vertical column of full-width buttons, time range left, green plus right. Booked slots rendered in place, greyed + strikethrough, disabled.
- **Length toggle**: compact pill group (1 / 1.5 / 2 / 3 hr) inside toolbar; remove the existing full-width "Choose your lesson length" panel.
- **Empty states**: icon + copy for "Click any available date…" (slot pane, min-h 280px) and "Click any date to schedule your first lesson" (lessons list).
- **Confirm button**: disabled grey with "Book {n} more hours to continue" until remaining = 0, then primary "Confirm all lessons" + 11px hint underneath.
- All copy in sentence case; only MORNING/AFTERNOON/EVENING uppercase + tracked.

### 2. Both `BookingSummary.tsx` pages (Drive365 + EveryDriver, lines ~1715)
Remove the wrapper that renders the duplicate "Select Your Lesson Slots" header and the outer "0/10h" pill. The new in-component header replaces both.

### 3. Responsive (<900px)
- Outer two-column grid → single column (workspace first, lessons after).
- Right card: `lg:sticky lg:top-4` so sticky is desktop-only; stays static on mobile.
- Inner calendar/slots grid also stacks; the `border-l pl-[14px]` becomes `border-t pt-[14px]` via responsive classes.

### 4. Brand tokens
Use existing Drive365 tokens already in the project: navy `#142040` (primary), accent blue `#2B7BC8`, slate-50 `#F9FAFB` row backgrounds, success green for available cells. No new colours invented; will pull from `tailwind.config.ts` / `index.css` rather than hardcoding.

## Sticky-positioning caveat (your warning, confirmed)
The booking page wraps content in motion divs and gradient sections. If `sticky` doesn't engage, the cause will be an ancestor with `overflow: hidden`, `overflow-x: clip`, or `transform`/`will-change` (which creates a containing block and breaks sticky). Plan: when wiring it up, walk up the DOM from the lessons card and remove/relocate any such ancestor styles around the scheduler section only — without changing the rest of the page's overflow rules.

## Out of scope
- No business logic changes: slot generation, conflict checking, RPCs, and persistence stay identical. Pure presentational rebuild + duplicate-header removal.
- Mobile booking view (`MobileBookingView.tsx`) is not touched — per project rule, mobile layouts only change when explicitly asked. The responsive stacking above only covers narrow desktop widths within the existing `LessonScheduler` component.

## Deliverables on completion
- Desktop screenshot with a date selected and 3 lessons scheduled.
- Scroll test confirming the lessons column stays in view (or note + fix if an ancestor blocks sticky).
- Internal-scroll test with >5 lessons.
- 375px screenshot showing the workspace stacked above the lessons card.
- Confirmation that only existing Drive365 tokens were used.
