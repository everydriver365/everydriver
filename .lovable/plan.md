

## Clone Homepage from Other Project

**The Problem:** The other project ("Every Driver and 365 (Supabase)") uses a completely different homepage component — `HomepageRedesignDemo` — as its landing page via `ConditionalHome.tsx`. This project's `ConditionalHome.tsx` instead renders `InstructorAppHome`, which is a different design.

Additionally, the `HomepageRedesignDemo.tsx` file in **this** project is a completely different file (a phone-frame demo page), not the marketing landing page from the other project.

**What needs to change:**

1. **Replace `src/pages/HomepageRedesignDemo.tsx`** with the 524-line marketing landing page version from the other project. The current file (a phone-frame demo) will be overwritten. It imports feature images that already exist in this project (e.g., `features-hero.png`, `diary-app.png`, `CrossfadeImages`, etc.).

2. **Update `src/components/ConditionalHome.tsx`** to render `HomepageRedesignDemo` instead of `InstructorAppHome` as the default homepage — matching the other project's routing:
   - Remove lazy import of `InstructorAppHome`
   - Import `HomepageRedesignDemo` (non-lazy, matching the other project)
   - Import `Drive365Home` instead of `Index` for the Drive365 domain
   - Return `<HomepageRedesignDemo />` as the default

3. **Verify assets exist** — all image imports used by the new homepage (`features-hero.png`, `diary-app.png`, `pupil-making-payment.png`, etc.) already exist in this project based on the search results.

No database changes needed — the new homepage uses hardcoded content rather than the CMS tables.

