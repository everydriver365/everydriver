
## Goal
Replace the flat `#F2F2F7` background across the instructor mobile app with a more characterful, contrasting backdrop — without breaking the "Waiting Room" white tile language.

## Constraints
- White tiles (`#FFFFFF`, `0.5px #E4E4E7` border, `14px` radius) must still pop against the new background.
- Frosted nav and headers (`rgba(255,255,255,0.8)` + blur) must still read as "above" the page.
- Mobile-only — no changes to `MobileHomepage` or learner Drive365 surfaces.
- Must not clash with the new DSM logo (white background, dark slate mark).

## Recommended option (my pick)
**Soft slate-tinted gradient** — keeps it iOS-native but adds depth and ties to the DSM dark slate brand (`#2A394F`).

```text
top:    #EEF2F7  (cool off-white, hint of slate)
bottom: #E4E9F0  (slightly deeper slate-grey)
fixed gradient, no scroll parallax
```
Why: white tiles gain ~6% contrast vs current `#F2F2F7`, the slate undertone echoes the DSM icon roundel colour (`#E8ECF1`) so the whole app feels designed as one system, and it stays neutral enough that status colours (amber weather, red payments owing, green success) still read clearly.

## Alternatives to choose from
1. **Slate gradient** (above) — `#EEF2F7 → #E4E9F0`. Calm, brand-aligned, premium feel.
2. **Warm paper** — `#F5F2EC → #ECE6DA`. Cosy, "notebook" feel; pairs well with the diary/schedule metaphor. Risk: warm tones can fight the cool slate icon roundels.
3. **Subtle dotted slate** — solid `#ECEFF3` + faint 1px dot grid at 6% opacity, 16px spacing. Texture without colour shift. Risk: can look busy on small screens at 390px width.
4. **Deep mode (opt-in)** — keep light default, but add a "Graphite" theme: bg `#1C1C1E`, tiles `#2C2C2E`, border `#3A3A3C`. Useful for night-driving instructors. Larger scope — would be a follow-up.

## Where it changes
Single source — the page-background colour is set in:
- `src/components/instructor/InstructorMobileLayout.tsx` (or wherever `#F2F2F7` is hard-coded for the mobile shell)
- `src/components/instructor/InstructorPageHeader.tsx` — sticky header `rgba(242,242,247,0.9)` overlay needs to match new base so the blur doesn't show a colour seam
- Any page that hard-codes `backgroundColor: "#F2F2F7"` inline (Schedule, Pupils, Finance pages from the recent sweep) — switch to a CSS variable `--instructor-bg` so future changes are one-line

## Implementation sketch
1. Add CSS vars in `src/index.css`:
   ```css
   :root {
     --instructor-bg-start: #EEF2F7;
     --instructor-bg-end:   #E4E9F0;
     --instructor-bg-overlay: rgba(238,242,247,0.85); /* for sticky headers */
   }
   ```
2. Apply on the instructor shell:
   ```css
   .instructor-shell {
     background: linear-gradient(180deg, var(--instructor-bg-start) 0%, var(--instructor-bg-end) 100%);
     background-attachment: fixed;
     min-height: 100dvh;
   }
   ```
3. Replace inline `backgroundColor: "#F2F2F7"` and `rgba(242,242,247,0.9)` across instructor pages with the new vars.
4. Update `mem://style/instructor-portal-design-system` so future pages use the variable, not the literal.

## Out of scope
- Drive365 learner pages
- Every Instructor portal (`/every-instructor/*`)
- Tile, header, bottom-nav internals — purely the page background

## One quick question
Which direction do you want?
- **A. Slate gradient** (recommended — `#EEF2F7 → #E4E9F0`, brand-aligned)
- **B. Warm paper** (`#F5F2EC → #ECE6DA`, cosy diary feel)
- **C. Dotted slate texture** (solid + faint dot grid)
- **D. Add a dark "Graphite" theme as opt-in** (bigger scope)
