## Goal

On the instructor home page Schedule tile (Today / Tomorrow), render an **EOL** pill and a **payment status** pill on every lesson row, matching the uploaded mock. EOL pill gets a strikethrough only once the EOL has actually been completed.

## File to change

`src/components/instructor/MobileHomeBottomSections.tsx` — `ScheduleSection` component (this is what renders on the home page via `MobileHomeRedesign`, route `/instructor`). The right‑hand side of each row currently shows only one of: `Now`, `Done`, `Cancelled`, or a "minutes until" countdown. We will keep that existing status indicator and add two more pills next to it.

## Data already available

`useDayLessons` already returns `paymentStatus` and `amountDue`, and `useDayLessonHistory` returns the set of completed EOL keys (`eolSet`). The row already computes a local `completed` boolean from `eolSet`. Both pills can be derived without any new query.

## Pill behaviour

For each lesson row, on the right side (before any existing status pill):

1. **EOL pill**
   - Always shown.
   - Label: `EOL`.
   - Style: blue tint background, blue text (matches the mock — same blue as the day toggle).
   - When the lesson's EOL is complete (`completed === true`, sourced from `eolSet`): apply `text-decoration: line-through` and lower opacity to ~0.6. No other state changes the strikethrough.

2. **Payment pill**
   - Always shown when `amountDue > 0` (skip on £0 lessons to avoid a meaningless "Paid" badge).
   - `paymentStatus === "paid"` → green tint background, green text, label `Paid`, with a small check dot.
   - Anything else → red tint background, red text, label `Not paid`, with a small alert dot.

3. **Existing right‑side indicator** (Now / Done / Cancelled / `12m` countdown) stays where it is, rendered after the two new pills, so the visual order left→right is: `EOL`, `Paid/Not paid`, `Now/Done/…`.

The row container becomes a flex group with `gap: 6` on the right cluster; pills use the same compact sizing already used by `StatusPill` (radius 20, `2px 7px`, font‑size 9, weight 700, uppercase) so they sit consistently with the existing Done/Now pill.

## Layout / responsive notes

- Viewport is 440px; three small pills + time + name fit comfortably. Pupil name keeps `min-width: 0` and ellipsis so long names truncate before pushing the pills.
- Row height stays the same; pills align centred vertically.
- `done` rows still get the existing `opacity: 0.55` dim — that combined with the EOL strikethrough naturally communicates "all wrapped up".

## Out of scope

- No DB or hook changes.
- No edits to the desktop / older `HomeTodaySchedule` / `TodayLessonsList` views.
- Tapping the pills does nothing new (whole row already navigates to the pupil); a follow‑up could wire EOL pill → EOL wizard if you want.

## QA

- Today tab: a paid completed lesson shows `EOL` strikethrough + green `Paid` + grey `Done`.
- Today tab: an unpaid upcoming lesson shows plain `EOL` + red `Not paid` + blue `12m`.
- Tomorrow tab: pills render the same way; nothing is auto‑marked done.
- £0 / free lesson: payment pill is hidden, EOL pill still shown.
- Long pupil names truncate without wrapping the pills.
