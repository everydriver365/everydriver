# Shrink top 3 tiles on instructor Home

The AI Receptionist, Today, and This Week tiles currently feel oversized. The AI Receptionist card stacks an icon + title + status + toggle + full-width segmented control, which forces all three cards taller than they should be. The two stat cards also use generous padding and a 22px value.

## Changes

**1. `src/components/instructor/AIReceptionistCard.tsx` — compact mode rework**

When `compact` is true:
- Hide the segmented control entirely (Off / On now / Auto). Mode switching stays available via the existing AI Call Divert sheet (tap the card body opens it). Removes ~38px of height.
- Reduce internal vertical gap from 8 → 6 and padding from `10px 11px` → `9px 10px`.
- Shrink icon badge 32 → 28, inner Phone icon 14 → 12, Sparkles 9 → 8.
- Title row: keep "AI RECEPTIONIST" eyebrow at 10px, drop body line "Auto-divert during lessons" font from 14 → 13, status line stays 11px but truncates with `whiteSpace: nowrap; overflow: hidden; textOverflow: ellipsis`.
- iOS toggle 38×22 → 34×20 (knob 18 → 16) so it sits neatly beside the text in the narrower column.

**2. `src/components/instructor/MobileHomeRedesign.tsx` — SummaryStatCard tightening**

- Padding `12px 12px` → `10px 11px`.
- Value font 22 → 19, label letter-spacing kept, sub font 11 → 10.5.
- Icon badge 26 → 24, inner icon 13 → 12.
- Internal `gap` 6 → 4.

**3. Grid row spacing**

- Keep the `7fr 3fr 3fr` ratio from the previous step.
- Reduce horizontal `gap-3` (12px) → `gap-2` (8px) so three tiles don't crowd at 390px viewport.
- Reduce bottom padding of the row container `0 14px 14px` → `0 14px 10px`.

## Preserved

- All Supabase data (`useInstructorLiveStats`, `useTodayOverview`, `useAICallDivert`).
- AI divert mode switching (still reachable via the sheet — tapping the card already calls `onOpenSheet`).
- Up Next tile, attention rows, navigation, schedule logic, all bottom sections.
- Live status colour logic (active = green, off = grey, setup issue = amber).

## Out of scope

- No changes to the greeting block, pills row, Up Next card, or any section below the top row.
- No DB or hook changes.

## Files touched

- `src/components/instructor/AIReceptionistCard.tsx`
- `src/components/instructor/MobileHomeRedesign.tsx`
