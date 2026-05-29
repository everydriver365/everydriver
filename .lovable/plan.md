## Problem

The 2-up cards in the "At a glance" grid (`MobileHomeDSM2026.tsx`, lines ~636–854) put a 36px icon, a flex text column, and a coloured badge all on one horizontal row. At 390px viewport each card is ~177px wide, so:

- "Membership" truncates to "Member…" and the "Active/Inactive" badge eats the rest of the row.
- "Tax estimate" wraps the title onto two lines, the "2026/27" badge floats awkwardly, and "No data yet" wraps to three lines.
- "Tax Digital" truncates to "Tax Digit…" with the same badge collision; "Not enrolled" gets squeezed.

(Upcoming events is fine because it has no inline badge.)

## Fix

Rework the three problem tiles so the title row gets the full card width and the badge moves to a dedicated spot, matching the visual rhythm of Upcoming events. No data, routing or business logic changes — purely layout/typography inside `MobileHomeDSM2026.tsx`.

1. **Shared row tweak**: in `cardRowStyle` drop the icon→text gap from 12 → 10, and have all three cards render the badge on a second line (right-aligned, under the text) instead of as a third flex child. This frees the entire title line for the label.

2. **Membership card** (lines 702–727):
   - Remove the forced `<br/>` between `planName` and `renewLabel`; let them sit on one line with `·` separator (or wrap naturally if long).
   - Move the Active/Inactive `Badge` to a small footer row under the text (same pattern as Upcoming events' "+ Add / See all" row), right-aligned.

3. **Tax estimate card** (lines 729–795):
   - Move the `{tax.taxYear}` (e.g. "2026/27") badge out of the icon row and place it inline next to the projected-liability value (smaller, muted) — or under "Projected liability". This stops it from squeezing the title.
   - Keep the progress bar where it is.

4. **Tax Digital card** (lines 797–852):
   - Rename the title from "Tax Digital" to "Making Tax Digital" — but render it with `fontSize: 13` and allow it to wrap to two lines (remove any nowrap). On a full-width title row it fits comfortably.
   - Move the orange "{n} days" badge to a footer row under the date/subtitle, right-aligned, same as Membership.

5. **Title style**: bump `Title` from `fontWeight: 500` to `600` and ensure `whiteSpace: "normal"` so the longer labels read as a single clear line rather than truncating with an ellipsis.

## Out of scope

- Icons, colours, routes, the "Upcoming events" card, the cards above (lessons today / outstanding / needs attention), and the MTD logic in `useInstructorMTDStatus`.
- No changes to `MTDDeadlineTile.tsx` (that's a different surface).
