# Fix Step 4 (Book Next Lesson) display issues

The data/logic from the previous prompt is correct — the problems are purely visual. On a 390px viewport, the layout fights the wizard's chrome: negative bleed margins overshoot, the "Best match" badge clips into the section header, the date stack and time row don't share a baseline, the footer overhangs the rounded sheet corners, and a `UserAvatar` ref warning fires.

## What's wrong

1. **Footer overhangs the rounded sheet.** Body uses `margin: "0 -24px -8px"` to escape the wizard's `padding: "8px 24px 0"`, but the wizard has no bottom padding to absorb it — the grey footer bar sits flush against the rounded-2xl dialog corners and visually clips.
2. **"Best match" badge clips the section header.** The badge is positioned `top: -7px` above the first slot card, which collides with the "SUGGESTED SLOTS / Pick another time" row sitting directly above it (only `marginBottom: 14`).
3. **Date stack vs time row baselines don't match.** The date stack is three lines (`EEE` / big day / `MMM`), the slot details is two lines (time + reasoning). They're center-aligned but the day number's `lineHeight: 1` and `EEE`/`MMM`'s `lineHeight: 1.1` push the visual centre off the time row.
4. **Section header has no top breathing room.** With the identity bar bleed and no top padding on the body, "SUGGESTED SLOTS" jams against the divider.
5. **Skip button looks inert.** Bare grey text "Skip — finish" next to a loud blue "Book & finish" reads as a label, not an action — needs a hairline border or pill shape to register as tappable.
6. **Console warning** — `UserAvatar` inside `StepBookNext` triggers `Function components cannot be given refs`. Likely a parent (Radix Dialog focus management) forwarding a ref. Wrap or guard the avatar so it stops warning.

## Changes (all in `src/components/instructor/end-lesson/StepBookNext.tsx`)

1. **Drop the negative bottom margin on the footer**, change `margin: "0 -24px -8px"` to `margin: "0 -24px"` and add `paddingBottom: 16` inside the footer so it sits inside the rounded corners. Add `borderBottomLeftRadius: 16; borderBottomRightRadius: 16` to the footer so it respects the sheet's rounded-2xl.
2. **Body wrapper:** change `padding: 16` to `padding: "16px 16px 0"` and add `paddingTop: 18` so the section header gets breathing room. Remove the negative left/right bleed (`margin: "0 -24px"`) — keep the body inside the wizard's 24px gutter so the slot cards align with the identity bar text instead of bleeding to the dialog edge.
3. **Reduce the body bleed too on the identity bar** to match — use `margin: "-8px -24px 0"` only when the wizard supplies that gutter; since we're keeping the bleed pattern consistent, normalise both to `margin: "-8px -24px 0"` (identity) and **no horizontal bleed on body/footer**. The footer becomes a normal-width block with `borderTop` and rounded bottom.
4. **Add `marginTop: 4` to the "Best match" badge container** by lifting the first slot card's `marginTop` to 10 so the badge clears the section header. Alternatively shift badge inline with the card title (replace the absolute positioning with a small inline pill above the time row) — preferred, simpler, no clipping.
5. **Align the date stack with the time row.** Wrap the date stack in `display: flex; flexDirection: column; justifyContent: center` and reduce the day number from 19px to 17px with `lineHeight: 1.15`. Tighten EEE/MMM to `lineHeight: 1.2` so the three lines centre cleanly against the two-line slot details.
6. **Skip button hierarchy.** Add `border: "0.5px solid #E5E5EA"; borderRadius: 10; padding: "10px 16px"; background: "#FFFFFF"` so it reads as a real action. Keep "Skip — finish" copy.
7. **`UserAvatar` ref warning.** Open `src/components/instructor/UserAvatar.tsx`, confirm it's a plain function component, and convert it to `React.forwardRef` so Radix's focus management can attach a ref without warning. (No visual change.)

## Out of scope

- Slot suggestion logic (already fixed in previous prompt)
- Wizard chrome / progress dots
- Identity bar copy / subtitle resolver
- Pickup row content
- Booking API / data model

## Files to edit

- `src/components/instructor/end-lesson/StepBookNext.tsx` — layout/padding/badge/footer/skip-button refinements
- `src/components/instructor/UserAvatar.tsx` — wrap in `React.forwardRef` to silence ref warning
