
What’s happening

- This has been so difficult because the problem is not really in the tile components themselves.
- The real blocker is a global CSS override in `src/index.css` that flattens corners across the instructor app.

I found the root cause:

```css
.instructor-portal .bg-card:not(.rounded-full),
.instructor-portal [class*="shadow-sm"]:not(.rounded-full),
.instructor-portal [class*="shadow-md"]:not(.rounded-full),
.instructor-portal [class*="overflow-hidden"]:not(img):not(video):not(.rounded-full):not(.hero-banner-no-top-radius) {
  border-radius: 0 !important;
}
```

Why this breaks repeated fixes

- `NextUpTile` already has `rounded-2xl` and `overflow-hidden`.
- `TelematicsTile` already has `overflow-hidden`, and it was even changed to inline `borderRadius: 16`.
- But both still match the global `.instructor-portal [class*="overflow-hidden"]` selector.
- Because that rule uses `border-radius: 0 !important`, it overrides both Tailwind rounding and normal inline `style={{ borderRadius: 16 }}`.

So the reason this became a 10-attempt issue is:

- the fixes were being made locally,
- but the bug lives globally,
- and the global rule keeps canceling every local rounding change.

Why the screenshots look exactly like this bug

- The outer tile shells are square.
- Small pills and badges are still rounded.
- That matches the CSS, because `.rounded-full` is explicitly exempted, while the tile containers are not.

Plan to fix it

1. Update `src/index.css` to remove or significantly narrow the instructor-wide square-corner reset.
2. Keep square corners only for elements that actually need them, using targeted opt-in classes instead of blanket selectors.
3. Leave `rounded-2xl`/`overflow-hidden` on the tile components themselves so the intended design works normally.
4. Re-check the instructor home variants where `NextUpTile` appears, so the same fix applies everywhere and doesn’t only solve one screen.
5. Verify the affected tiles after the global CSS change, because this is a cascade/specificity issue, not a rebuild issue.

Technical details

- Root cause file:
  - `src/index.css` around lines 353–359
- Wrapper that activates the override:
  - `src/components/layout/InstructorPortalLayout.tsx`
- Directly affected components:
  - `src/components/instructor/NextUpTile.tsx`
  - `src/components/instructor/TelematicsTile.tsx`
- Places to audit after fixing the global CSS:
  - `src/components/instructor/InstructorMobileHome.tsx`
  - `src/components/instructor/CompactHomeView.tsx`
  - `src/components/instructor/CleanHomeView.tsx`
  - `src/components/instructor/BestMateHomeView.tsx`

Expected outcome

- Once the global `!important` reset is removed/narrowed, the tiles should finally render rounded consistently.
- After that, future rounding changes will be simple again, because component-level `rounded-2xl` will no longer be fighting a hidden global override.
