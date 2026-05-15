## What changed

The `/drive365` homepage used to render a long stack of marketing sections inline from `src/pages/Index.tsx`. At some point that page was collapsed down to a single `<Drive365Home />` component, which only ships 4 sections after the learning-path block:

1. Why Drive365
2. Reviews
3. Test Swap band
4. Footer CTA

The previous version had **10 additional sections** after "Choose Your Learning Path" that are no longer rendering.

## Sections to restore (in original order)

After the existing "Choose your learning path" block, re-introduce:

1. **Test Swap Banner** (dark band promoting the test-swap feature) — already partially present as "HomeSwapBand"; keep current styled version.
2. **What's Included** — V14 Glass Tiles grid pulling from `useIncludedFeatures` + `FeatureDetailModal`.
3. **Featured Courses** — dynamic course tiles from `useFeaturedCourses`.
4. **From Nervous to Road Ready** — warm-organic story section.
5. **Video Story** — full-bleed hero video using `welcome_video` / `video_thumbnail` site images, plus modal.
6. **Latest News & Tips** — blog band fed by `useDVSANews` (`newsFeatured`, `newsArticle1/2`).
7. **Stats** — band fed by `useHomepageStats`.
8. **Features Bento Grid** — image-rich grid fed by `useHomepageFeatures` + `FeatureDetailModal`.
9. **Testimonials Wall** — social-proof grid fed by `useHomepageTestimonials`.
10. **CTA + Trust Badges + Franchise Banner** — final stack (mobile trust strip, franchise promo, desktop accreditations + payment logos).

The existing "Why Drive365", "Reviews", and "Footer CTA" inside `Drive365Home` overlap with #8/#9/#10 above. Plan: keep them for now and slot the restored sections **between the learning-path block and the existing "Why Drive365" block**, so nothing currently visible disappears. We can de-duplicate in a follow-up if you want.

## How

- Source of truth: the JSX is recoverable from git commit `9fead5a62` (`src/pages/Index.tsx`, lines ~589–1265).
- Implementation:
  - Add the missing imports (assets + hooks) back into `src/pages/Index.tsx`.
  - Insert the 10 sections **after** `<Drive365Home />` (so they render below the learning-path block but above the page footer). This keeps `Drive365Home` untouched.
  - Re-wire dynamic data via the existing hooks already in the project (`useIncludedFeatures`, `useFeaturedCourses`, `useDVSANews`, `useHomepageStats`, `useHomepageFeatures`, `useHomepageTestimonials`, `useSiteImages`, `useBookingUpsells`).
  - Restore `FeatureDetailModal` + video `Dialog` state in `Index.tsx`.
  - No DB or backend changes required — all hooks and tables already exist.

## One question before I build

Do you want **all 10** restored, or only a subset? If "all", I will pull them straight back from the pre-collapse version and insert them under `<Drive365Home />`. If you only want some, tell me which numbers from the list above and I will restore just those.
