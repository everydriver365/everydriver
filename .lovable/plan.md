## Goal
Make the **"Do this next"** card visually pop so it reads as the *primary* CTA on the home screen — instead of looking like just another white card sitting between "Up next" and "Needs your attention".

The uppercase `DO THIS NEXT` label above the card stays unchanged (peer of the other section labels). Only the card itself gets the hero treatment.

## Visual changes (per-tone)

The priority engine already returns a `tone` (amber/blue/green/purple) per action. We'll use it to drive a tinted hero card:

| Tone | Trigger | Card gradient | Solid icon fill | Verb pill |
|---|---|---|---|---|
| amber | Debt | `#FFF8EC → #FFFFFF` | `#B8801F` / white glyph | `Chase` |
| blue | Swap offer | `#EFF6FF → #FFFFFF` | `#2B7BC8` / white glyph | `Respond` |
| green | Gap fill | `#EEF7EE → #FFFFFF` | `#3B8B3B` / white glyph | `Offer` |
| purple | Re-engage | `#F5EFFB → #FFFFFF` | `#8A5BC9` / white glyph | `Re-engage` |

Card itself:

```text
┌─ tinted gradient · 1px tone/20% border · same rounded-22 ──┐
│  ╭──╮                                                       │
│  │💷│  Chase £45 from Sarah               ┌─────┐  ›        │
│  ╰──╯  Outstanding balance                │Chase│           │
└────────────────────────────────────────────┴─────┘──────────┘
```

Specifics:

1. **Background**: `linear-gradient(135deg, {tone-soft} 0%, #FFFFFF 70%)` instead of pure white. Subtle but immediately distinct from the flat white siblings on `#F4F7F6` page bg.
2. **Border**: 1px solid `{tone}/20%` for a hairline coloured edge.
3. **Icon tile**: 44×44 (up from 40), solid `{iconFg}` fill (was 10% wash), white glyph at strokeWidth 2.
4. **Title**: bump from 15px/600 to **16.5px/700**, letter-spacing `-0.2px` (kept tight, not larger than "Up next" pupil name to maintain hierarchy).
5. **Verb pill**: small rounded pill (`{tone}/14% bg`, `{iconFg}` text, 11px/700, `Chase`/`Respond`/`Offer`/`Re-engage`) sitting between the text block and the chevron.
6. **One-shot pulse**: a 1.6s ease-out ring expansion behind the icon tile on mount only (CSS keyframes). Skipped when `prefers-reduced-motion: reduce`.
7. **Snooze button (✕)**: shrunk to a tiny 13px control top-right, lower-contrast — stops competing with the verb pill / chevron.

## Code changes

**`src/hooks/useNextBestAction.ts`** — extend `NextBestAction` interface with three fields per branch:
- `verb: string` (already mapped above)
- `cardBg: string` (gradient start hex)
- `cardBorder: string` (border colour)

Set them per rank in the existing `useMemo`. No new queries.

**`src/components/instructor/DoThisNextCard.tsx`** — restyle the existing button:
- Replace flat `background: #FFFFFF` with `linear-gradient(135deg, ${action.cardBg} 0%, #FFFFFF 70%)`.
- Add `border: 1px solid ${action.cardBorder}`.
- Bump icon tile to 44px, swap to solid `action.iconFg` fill with white glyph.
- Bump title to 16.5px/700.
- Insert verb pill before the snooze + chevron group.
- Wrap icon tile in a relatively-positioned span with an absolute `::after` pseudo-ring driven by a keyframe (one-shot via `animationFillMode: forwards` and a state guard so it only plays once per mount).
- Add a small `<style>` block (or inline keyframes via a styled span) registering `@keyframes dtn-pulse` once. Use a unique class so it doesn't collide.
- Honour `@media (prefers-reduced-motion: reduce)` to disable the pulse.

## Out of scope
- No change to the priority engine logic or data sources.
- No change to gating in `PremiumIOSHomeView.tsx`.
- No change to the `SectionLabel` style — label stays grey to keep all five home sections visually equal at the heading level. The card carries all the emphasis.
- No mobile layout restructure.

## Files
- Edit: `src/hooks/useNextBestAction.ts` — add `verb`, `cardBg`, `cardBorder` to each returned action.
- Edit: `src/components/instructor/DoThisNextCard.tsx` — apply hero styling, verb pill, one-shot pulse, smaller snooze.
