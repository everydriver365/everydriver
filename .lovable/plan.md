## Why the preview doesn't match

Your active home layout is `"premium"` which renders `PremiumHome.tsx`. The reference design (and all my recent refinements) live in a different component: `PremiumIOSHomeView.tsx`, which only renders when `layoutStyle === "premium-ios"`. That's why nothing visible has changed for you despite multiple edits.

Two things need to happen to fix this properly:

### 1. Make the reference layout the default

In `src/hooks/useInstructorAppearance.ts`, change the default `layoutStyle` from `"premium"` to `"premium-ios"` so PremiumIOSHomeView is what loads for everyone (including you) on first paint, with no settings change required.

### 2. Bring `PremiumIOSHomeView` up to match the reference

The current PremiumIOSHomeView is close but missing several elements visible in the reference. Update only this file:

**Header band**
- Add a top row with the DSM logo (red/blue/black tiles + "Driving School Manager" wordmark) on the left, and bell (with red 9+ badge) + circular avatar on the right.
- Below it: large "Good evening, Ken 👋" greeting (~32px), subtitle "1 lesson today · 2 things waiting" (red accent on waiting count), and a date pill "Fri, 16 May 2025 ⌄" aligned to the right of the subtitle row (not stacked, not overlapping).

**Needs your attention**
- Keep current 3-row card structure. Confirm pill colours: red (NEW), amber number, green number. Compact rows (~76–82px). Already mostly aligned.

**Today's schedule**
- Show up to 4 lessons (reference shows 4) instead of the current 2.
- Each row: coloured accent bar (blue for upcoming, green for confirmed), time + duration block, real avatar photo (fall back to initials), pupil full name (no truncation), "lesson type · location" subtext with pin icon, status pill (Upcoming = blue, Confirmed = green) and chevron.
- Add lesson footer: light blue tinted bar with "+ Add lesson" centred.

**Quick actions**
- Header row: "Quick actions" left, "Edit" link right (navigates to appearance settings).
- 5 tiles in one horizontally scrollable row (or 5-col grid that fits): Add lesson, Take payment, Message, Fill gap, More. Each tile ~88–96px tall, icon over label, soft tinted icon backgrounds matching the reference (blue, green, indigo, amber, neutral grey for More).

**Smart suggestion**
- Light green tinted card with calendar icon, "You have a 90 min gap at HH:MM" headline, "Fill it with a new lesson and boost your earnings." subtext, and a solid green "Add lesson" button on the right (replacing the current black pill button).
- Keep the dismiss X.

**Bottom spacing**
- Keep `pb-32` so nothing is hidden behind the bottom nav.

### What stays untouched
- All data hooks, navigation handlers, RLS, auth, routing, the bottom nav itself, and every other layout option (`clean`, `lockscreen`, `bestmate`, etc.).
- `PremiumHome.tsx` is left as-is (still selectable in appearance settings).

### Files to edit
- `src/hooks/useInstructorAppearance.ts` — default to `"premium-ios"`.
- `src/components/instructor/PremiumIOSHomeView.tsx` — header band, schedule (4 rows), Quick actions row of 5 with Edit, green Smart suggestion CTA.

After approval I'll implement the above and you should see the reference design on next reload.