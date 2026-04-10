

## Make Hero Image Match Reference

The reference image shows a different layout from the current hero:

**Current**: Avatar + single-line greeting ("Good Morning, Name") + date subtitle, all on one line with avatar  
**Reference**: No avatar in the hero area. Two-line greeting — small "Good evening," on top, then large bold "Instructor" (the name) below. No date shown in the hero.

### Changes to `src/components/instructor/HomepageHero.tsx`

1. **Remove the avatar/profile image** from the hero overlay — the greeting area should only have text.

2. **Restructure greeting text** to match the reference:
   - Line 1: Small text — just the greeting phrase (e.g. "Good evening,") in ~16px, normal weight, white with slight transparency
   - Line 2: Large bold name (e.g. "Instructor" / firstName) in ~32-36px, bold, white

3. **Remove the date** line (`format(new Date(), "EEEE d MMMM")`).

4. **Adjust vertical positioning** — move the text down so it sits in the lower-left of the hero image (the reference shows the greeting near the bottom of the image area, not at the top). Change from `justify-start` with top padding to `justify-end` with bottom padding (~50px to clear the carousel overlap).

5. **Keep the hero image aspect ratio** as-is (`1 / 0.43`) — the reference looks similar.

These are purely visual/layout changes to the text overlay within the existing hero component.

