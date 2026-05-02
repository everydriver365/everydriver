## Goal
Make the home-page section labels consistent. Right now:

- **"Do this next"** uses a tiny 11px uppercase grey label *above* its card (iOS-style section header).
- **"Needs your attention"** and **"Schedule"** use a large 17px bold heading *inside* the card.

This is jarring and makes "Do this next" look like a category label rather than a sibling section.

## Decision
**Standardise on the small uppercase label above the card** for all three sections — that's the iOS-consistency pattern already documented in memory (`mem://style/ios-consistency-patterns`: "uppercase section headers"). It also keeps card interiors cleaner and gives the screen a clearer rhythm.

```text
DO THIS NEXT
[ tinted hero card ]

NEEDS YOUR ATTENTION
[ white card · rows ]

SCHEDULE                          View all ›
[ white card · today/tomorrow tabs · rows ]
```

## Changes (all in `src/components/instructor/PremiumIOSHomeView.tsx`)

1. **Extract a `<SectionLabel>` helper** at the top of the file — one component renders the 11px / 600 / `#8E8E93` / `0.4px` tracking / `uppercase` label with `margin: 0 2px 8px`, optional right-side action slot (for "View all").
2. **Needs your attention section (lines ~338–383)**:
   - Remove the inner `<div className="px-4 pt-4 pb-1">…<h2>Needs your attention</h2></div>` heading block.
   - Render `<SectionLabel>Needs your attention</SectionLabel>` *above* the `<Card>`.
   - Adjust the first row's top padding (the card no longer has the heading taking that space) — drop `pt-4` from the inner container so the first row sits flush.
3. **Schedule section (lines ~386–400)**:
   - Replace the inner `<h2>Schedule</h2>` + "View all" header row with `<SectionLabel action={<ViewAllButton/>}>Schedule</SectionLabel>` above the card.
   - Tighten the segmented Today/Tomorrow control's top padding inside the card now that the heading row is gone.
4. **Do this next** stays exactly as-is structurally — but the label is moved out of `DoThisNextCard.tsx` into the parent so all three sections use the same `<SectionLabel>` component. The card itself becomes label-less.
   - Edit `src/components/instructor/DoThisNextCard.tsx`: remove the inline "Do this next" header `<div>` and the wrapping `<section>` margin — just render the card.
   - Edit `PremiumIOSHomeView.tsx` (line ~333): wrap the `<DoThisNextCard>` in `<section className="mt-4"><SectionLabel>Do this next</SectionLabel><DoThisNextCard … /></section>`.

## Visual spec for `<SectionLabel>`
```text
font-size: 11px
font-weight: 600
color: #8E8E93
text-transform: uppercase
letter-spacing: 0.4px
margin: 0 2px 8px
display: flex; justify-content: space-between; align-items: baseline
```
Right-side `action` slot styled as `text-[12px] font-semibold text-[#007AFF]` to keep the existing "View all ›" affordance.

## Out of scope
- No change to card interiors, row layout, icons or data.
- No mobile layout restructure (per Core memory rule) — only the heading element moves.
- "Do this next" tinted-hero styling from the prior plan is unaffected; this is purely about label parity.

## Files
- Edit: `src/components/instructor/PremiumIOSHomeView.tsx` — add `SectionLabel`, restructure three section headers.
- Edit: `src/components/instructor/DoThisNextCard.tsx` — remove the internal label/section wrapper.
