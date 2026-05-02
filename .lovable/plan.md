## Goal

Restyle the **expanded "Up Next / Next Lesson" tile** on the instructor mobile Home page so its visual language matches the Schedule page — flat white cards, hairline `0.5px` borders, `borderRadius 12`, compact iOS typography — while keeping **every piece of functionality intact** (state-machine actions, awaiting/confirmed pill + nudge, map preview, travel/ETA bar, smart prompts, balance notice, lesson details, conditions, last-lesson summary, payment cards, unread chat, reschedule/cancel, end-lesson wizard, all handlers and data hooks).

## Schedule-page visual language (the target)

From `MultiDayScheduleView.tsx`:

- Container: `background #FFFFFF`, `borderRadius 12`, `border 0.5px solid #E5E5EA`, `padding 0 8px`, no drop shadow.
- Row hairlines: `0.5px solid #E5E5EA`, indented to match the row content.
- Coloured accents: thin 3px accent bar, never large coloured fills.
- Typography: black titles, `#8A8A8E` (system grey) secondary, tabular numerals for times, no oversized display sizes.
- Pills: small, `borderRadius 999`, `padding 3–6px 8–10px`, ~12–13px font.

## File to change

Only `src/components/instructor/NextUpTile.tsx` — and only the **expanded** branch (`expanded && (...)` starting around line 708). The **collapsed** header (lines 517–702) is untouched. No props, no data hooks, no handlers, no state machine, no child components change.

## Visual changes (expanded section)

### 1. Outer expanded wrapper (currently lines 717+)
- Replace `padding: "22px 0 20px"` + `borderTop: 1px rgba(15,23,42,0.08)` with `padding: "12px 0 16px"` + `borderTop: 0.5px solid #E5E5EA`.
- Reduce inter-section `gap` from `24` → `14`.
- Remove the negative `marginBottom: -16` (no longer needed once cards are flat).

### 2. Hero + Primary Actions card (lines 720–1116)
- Container: change to `background #FFFFFF`, `borderRadius 12`, `border 0.5px solid #E5E5EA`, **remove** the `boxShadow: "0 14px 34px rgba(15,23,42,0.07)"`, reduce `padding: 24` → `padding: 14`, reduce internal `gap: 18` → `gap: 12`.
- "UP NEXT" label: keep small-caps but recolour to `#8A8A8E` (system grey) at `11px / weight 700 / letter-spacing 1px` so it matches Schedule section labels rather than the bright `#8BB9F2`.
- Status pill (Awaiting / Confirmed / Declined / Cancelled / Reminder sent): shrink to `padding 4px 10px`, `fontSize 12`, `fontWeight 600`, icon `12×12`. Keep all 5 variants and the **nudge SMS** click handler (`sendSMS`, `setNudgeSentAt`, toast) exactly as-is.
- Pupil name: `28px / 800` → `20px / 700`, `letter-spacing -0.3`.
- Time: `34px / 800` → `22px / 700`, tabular-nums retained.
- Date label: `16px` → `13px`, colour `#8A8A8E`.
- "Standard lesson · 1h" line, address row, countdown row: drop to `13px`, icons to `14×14`, colour `#8A8A8E` for secondary, `#000` for primary text. Keep the address resolution logic (`formattedPickupAddress || pickupPostcode || pickupLocation`).
- Add a thin 3px coloured accent bar to the left of the pupil-name row (using the same blue `#2B7BC8` lesson accent from `scheduleGoogleStyle.ts`), to mirror Schedule rows.

### 3. State-based action area (`getNextUpVisibility` branches, lines 859–1109)
Functionality (Start / End / Quick row / Early Nav-Call-Text + segmented status strip) is preserved 1:1. Only chrome changes:
- **End lesson** & **Start lesson** full-width buttons: `borderRadius 14` → `10`, `padding 16` → `12 14`, `fontSize 17` → `15`, drop the coloured drop shadows (keep solid red `#FF3B30` / blue `#1B5BFF` fills).
- **Mid quick-action row** (Navigate/Call/Message/Arrived): already flat — just tighten icon size from `22` → `20` and label from `12` → `11`.
- **Early primary action grid** (Nav/Call/Text):
  - Reduce row height `58` → `44`, `borderRadius 20` → `10`, font `17/800` → `14/700`.
  - Remove the heavy `boxShadow: "0 12px 22px rgba(37,99,255,0.28)"` on Nav.
  - Keep colours but flatten: Nav stays solid `#2563FF`; Call & Text become subtle tinted (`#E8F7EE` / `#EAF3FB`) pills consistent with the rest of the app.
- **Inline status banner** (en route / running late, lines 1011–1031): keep behaviour, drop padding to `6px 10px`, font `12` → `11`.
- **Segmented status strip** (line 1081, "Prep / On the way / Running late / Here"): replace the rounded `22px / #EEF1F5` capsule with a flat hairline-bordered strip — `borderRadius 10`, `border 0.5px solid #E5E5EA`, white background, active item gets a subtle `#F2F2F7` fill rather than a floating white tile with shadow. Min-height `64` → `44`. Same handlers.

### 4. Map preview (~line 1118)
- Reduce `borderRadius 14` → `10`, drop the wrapper background to `#F2F2F7` only as the map placeholder; outer wrapper gets `border 0.5px solid #E5E5EA` instead of a shadow.

### 5. Travel-time bar (~line 1133)
- `borderRadius 12` → `10`, swap any heavy shadow for a `0.5px` hairline border.
- Inline action chips (Send ETA, etc.) shrink to `padding 6px 12px`, `fontSize 12`.

### 6. Sub-section cards (Lesson details, Conditions, Last lesson + payment + unread, Reschedule/Cancel — lines 1202+)
All currently `background #FFFFFF, borderRadius 16, shadow`. Convert each container to the unified flat card:
- `background #FFFFFF`
- `borderRadius 12`
- `border 0.5px solid #E5E5EA`
- **No** drop shadow
- `padding 12–14`

Internal rows inside each card keep their existing icon tiles (`32×32, borderRadius 8`) but:
- Reduce the per-row `borderRadius` from 14/16 → 10.
- Replace nested white-on-white sub-cards with simple rows separated by `0.5px #E5E5EA` hairlines (matches Schedule row dividers).
- Keep all icons, copy, links (`Link to="/instructor/pupils/:id"`, payment CTAs, unread chat link, reschedule/cancel buttons, last-lesson plan summary).

### 7. Section headers between cards
Add small-caps section labels above each sub-card (`Lesson details`, `Conditions`, `Pupil context`, `Reschedule`) styled like Schedule's day headers: `11px / 700 / #8A8A8E / letter-spacing 0.6px / textTransform uppercase / margin 0 4px 6px`.

## What stays exactly the same

- All data hooks and queries (`useNextLessonDetails`, last-review query, etc.).
- All handlers: `handleCall`, `handleMessage`, `handleNavigate`, `handleArrived`, `sendSMS`, Start lesson Supabase update + auto-tracker navigation, End lesson wizard, segmented status strip handlers, reschedule, cancel, payment buttons, unread chat link.
- `getNextUpVisibility` state machine + every conditional branch (early / mid / starting-now / in-lesson).
- Awaiting / Confirmed / Declined / Cancelled / Reminder-sent pill logic and the `nudgeSentAt` cooldown.
- Map preview gating (within 4h), travel-time bar gating (within 30 min), smart prompts, balance notice gating.
- Conditions card data, Last lesson plan summary, payment status display, unread chat count.
- Collapsed header row (lines 517–702) — untouched.
- Props, exports, `EndLessonWizard` integration, accessibility labels (`aria-label`, `aria-expanded`).

## Acceptance

- Expanded Next Up tile uses flat white cards with `0.5px #E5E5EA` borders and `borderRadius 12`, no large drop shadows, compact 13–15px iOS typography, matching Schedule visually.
- Pupil name 20px, time 22px (was 28/34); status pill, action grid, and segmented strip all shrink to compact iOS sizes.
- Every existing CTA still works: Start, End, Nav, Call, Text, Message, Arrived, Send ETA, nudge SMS, segmented status updates, reschedule, cancel, payment links, unread chat link.
- State-machine visibility (early / mid / starting-now / in-lesson) renders the same controls as before — only their chrome changes.
- No other files or components touched; collapsed header unchanged.
