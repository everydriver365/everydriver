## Goal

Restyle the collapsed pupil cards on the mobile **Pupils** list so they read like the **Schedule** tiles: pale tinted background, black title, system-grey secondary text, optional thin left accent. No behaviour, data, or layout changes.

## Scope

- **One file only:** `src/components/instructor/PupilCardStack.tsx` — the collapsed-card render inside the existing `motion.div` / `motion.button` block (≈ lines 714–928).
- **Untouched:** expanded sheet, actions row, swipe behaviour, navigation, data hooks, the desktop branch, and every other surface that renders pupils.

## What changes (visual only)

Borrow from `src/components/instructor/scheduleGoogleStyle.ts` → `CATEGORY_STYLES`:

| Pupil signal (existing flags, unchanged) | Schedule category used | bg → title |
|---|---|---|
| `hasDebt` (overdue balance) | `course`  | `#FBEAEC` / `#000000` (accent `#C8434F`) |
| `hasCredit` | `holiday` | `#E8F3E8` / `#000000` (accent `#3B8B3B`) |
| `status === "on_hold"` | `admin`   | `#FBF1DE` / `#000000` (accent `#B8801F`) |
| `status === "inactive"` | `task`    | `#F2F2F4` / `#000000` (accent `#6E6E73`) |
| default (active / tracking) | `lesson`  | `#E6F1FB` / `#000000` (accent `#2B7BC8`) |

Then in the collapsed card:

1. Replace the outer `motion.div` `backgroundColor: "#FFFFFF"` with the chosen category `bg`. Keep the existing `0.5px` hairline border (swap to `rgba(0,0,0,0.06)` so it reads against the tint). Keep `borderRadius: 12` and existing shadow tokens.
2. Optional **left accent hairline**: 3px-wide bar pinned to the leading edge inside the card, coloured with the category `border` colour. Implemented as an absolutely-positioned `<span>` inside the existing `motion.div` (no layout shift; card already has `overflow: hidden` and `position: relative`).
3. Title (`titleCaseName(pupil.name)`) colour: `#0F2044` → `#000000`.
4. Secondary meta lines (`nameSuffix`, `Next: …`, `Lesson N`): keep current greys (`#6B7280` / `#9CA3AF`) — they already match the schedule tile's grey-on-tint hierarchy.
5. Inner divider (`#F2F4F8`) → `rgba(0,0,0,0.06)` so it stays visible on the tinted backgrounds.
6. **Keep unchanged:** avatar, status dot, course pill, test badge, amount + status pill (these are already pale-tinted chips that read fine on the new bg), Actions row.

No new dependencies, no new exports, no token file changes. The category resolver is a small local helper at the top of the existing component file.

## Out of scope (explicitly)

- Expanded pupil card body, swipe actions, long-press, navigation targets.
- Desktop pupils list and `DesktopPupilDetailPanel`.
- Any other "pupil tile" surface (dashboard quick tiles, gap-filler card, live-session pupil chip) — confirmed via Q1.
- No changes to `scheduleGoogleStyle.ts` (read-only import of the palette values).

## Risks / notes

- Status pill colours (`OVERDUE` red on `#FBEAEC`, `CREDIT` blue on `#E6F1FB`, `ALL CLEAR` green on `#E8F3E8`) will sit on a same-family tint when the pupil's category matches. Contrast is still AA (dark text on lighter tint of the same hue), but it slightly mutes the pill. If that reads too soft after the swap, tighten by darkening pill `bg` one step — flag after preview, do not pre-empt.
- Memory rule "Mobile changes: do not update mobile layouts unless explicitly instructed" — satisfied: this request is explicit and visual-only.
- Live data: nothing in this change reads, defaults, or fabricates data. Pure presentational mapping from existing flags.

## Verification

After edit: open `/instructor/pupils` on mobile preview at 440px, confirm the five category states render with the expected tint (use any pupil with a balance for overdue, etc.), confirm tap → expand still works, confirm no console errors.
