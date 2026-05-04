## Goal

Restyle the **Needs Attention** and add a new **Upgrade** section on the instructor mobile Home (`MobileHomeRedesign.tsx`) to match the supplied spec. Pure visual changes — all data sources, navigation routes, badge counts, and state remain wired exactly as today.

## Scope

Single file: `src/components/instructor/MobileHomeRedesign.tsx` (lines ~735–884 for the row/card components, ~972–1121 for row composition, ~1203–1207 for layout).

No other files touched. No new dependencies.

## Changes

### 1. Split Membership + Health cover out of `attentionRows`

Currently both are pushed into `attentionRows` with `group: "todo"`. Move them into a new `upgradeRows` array so they render in their own **Upgrade** section instead of the To do card.

- Keep the same `membershipLevel` and `healthCover` placeholder variables (already in file at lines 1089 / 1104) — these become the bound `tierLabel` values.
- Keep navigation: `/instructor/subscription` and `/instructor/health-cover`.

### 2. Restyle the `Needs attention` section header

Replace the existing `<SectionLabel>Needs attention</SectionLabel>` (line 1205) with a flex row containing:
- Left: uppercase "Needs attention" — `fontSize 10, weight 700, color #8E8E93, letter-spacing 1.2px`.
- Right: red total pill (`#CC2229`, white 9px bold) showing `totalAttentionCount`, only when > 0.

`totalAttentionCount` is computed locally as the sum of every active count already in scope: `missedCallsCount + enquiriesCount + pendingJobs + openSlots + dormantCount + unread + (debt > 0 ? 1 : 0) + (vehicleFault ? 1 : 0)`. No new state, no new fetches.

### 3. Always render Calls and Enquiries (clear state)

Today Calls/Enquiries always render with badge hidden when count is 0. Spec says they stay visible but appear "cleared" (opacity 0.45, grey icon chip, green "Clear" pill). Update `AttentionRow` interface to include an optional `isClear?: boolean`, derived from `count === 0`.

For Calls, Enquiries, Job offers, Open slots, Dormant pupils — push the row unconditionally (not behind `> 0` checks) so the cleared visual state can show. Vehicle, Messages, Outstanding balance keep their existing conditional logic (they aren't in the spec's row list).

### 4. Restyle `AttentionGroupCard` rows

Update the row rendering (lines 778–848) to match spec:
- Group label row: keep current style (already matches: 9px / 700 / uppercase / 1px letter-spacing / 4px margin / 0.5px hairline). Confirm Urgent uses `#CC2229` (currently `#B23A3F` — change to `#CC2229`) and the hairline `#F0CCCC`. To do uses `#B45309` and `#E8D5B0`.
- Card border: Urgent `rgba(204,34,41,0.12)`, To do `rgba(26,82,160,0.08)`.
- Card margin-bottom: Urgent 8px, To do 12px.
- Row separators: hairline `#F0F3F8`, inset 14px (currently full width — change `borderTop` on the button to a separator div or set `marginLeft/Right: 14`).
- Icon chip: 30×30, radius 8, `strokeWidth 1.6`, size 13.
- When `isClear`: chip background `#F2F4F8`, icon color `#5B6B8A`, row `opacity: 0.45`, title weight 600 (vs 700).
- Title: 12px / weight 700 (600 when clear) / `#1A1A1A`.
- Subtitle: 10px / `#8E8E93`.
- Trailing element priority:
  1. If `isClear` → green "Clear" pill (`#E8F8ED` bg, `#1A7A3C` text, 9px/600).
  2. Else if `count > 0` (urgent group) → red circular badge `#CC2229` / white.
  3. Else if `count > 0` (todo group, openSlots key) → blue pill `#EEF3FF` / `#1A52A0`.
  4. Else if `count > 0` (todo group, dormant key) → amber pill `#FFF6E6` / `#B45309`.
  5. Chevron right (size 5 per spec; we'll use 14 since 5 is illegibly small in the existing UI — note this trade-off below).

To keep colour selection clean, extend `AttentionRow.badge` to `{ label: string; bg: string; fg?: string; variant?: "circle" | "pill" }` and pass `variant: "pill"` for openSlots / dormant.

### 5. New Upgrade section + `UpgradeRow` component

After the Needs Attention block (around line 1207), add:

```text
UPGRADE
┌─────────────────────────────────────────┐
│ ⭐ Membership  [Starter]                 │
│    Unlock more features · lower fees    │  [Upgrade] ›
│ ─────────────── (hairline) ───────────  │
│ ❤  Health cover  [Basic]                │
│    Full income protection available     │  [Upgrade] ›
└─────────────────────────────────────────┘
```

Build a local `UpgradeRow` component inside the file matching the spec exactly (icon chip, title + tier pill inline, subtitle, solid "Upgrade" button, chevron). White card, radius 14, border `rgba(26,82,160,0.08)`.

Render two rows bound to `membershipLevel` and `healthCover` (keep existing variable names). Navigation stays `/instructor/subscription` and `/instructor/health-cover`. Use `Crown` and `ShieldPlus` icons (already imported).

### 6. Layout / spacing pass

Wrap both sections in a 15px horizontal padding container (matches spec's "screen horizontal padding 15px"). Existing inner cards already use 14px — keep them and let the section wrapper add the outer padding so the visual rhythm matches spec without a sweeping refactor. Top padding 14, bottom 24 for the combined block.

## Trade-offs / notes

- **Chevron size**: spec says `size={5}` which is too small to render usefully on web. Will use 14 (current value) to stay legible. Flag for review.
- **`totalAttentionCount`** counts each active row once (vehicle, debt) plus exact counts (calls, enquiries, jobs, slots, dormant, messages). Will document in a comment.
- **No data wiring**: `missedCallsCount`, `enquiriesCount`, `membershipLevel`, `healthCover` remain hardcoded placeholders as today — only the visuals change.
- **Mobile layout policy**: this is a mobile layout change, but the user has explicitly requested it, which satisfies the "do not update mobile layouts unless explicitly instructed" memory rule.

## Out of scope

- Wiring real data for calls / enquiries / membership / health cover.
- Creating `/instructor/calls`, `/instructor/enquiries`, `/instructor/health-cover` pages (still stubs).
- Any change to other sections of the Home screen (header, hero, schedule, quick access, upcoming events).
