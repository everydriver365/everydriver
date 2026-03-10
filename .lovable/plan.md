

## Plan: Restore Learner Sections to Drive365 Homepage

The current `Drive365HomepageRedesign.tsx` has instructor-specific content (ADI product tour, instructor testimonials, product grid, "How It Works" onboarding). The old `Index.tsx` has all the learner sections needed. The goal is to keep the current page structure (MainLayout wrapper, hero) but replace instructor sections with learner sections.

### Sections to Remove from Current Page
- **"What We Do"** dark section (instructor diary pitch, lines 113-158)
- **Product Tour** — 8 instructor feature showcases (lines 179-311)
- **"How It Works"** — instructor onboarding steps (lines 314-349)
- **Product Grid** — instructor pricing tiers (lines 351-428)
- **Instructor Testimonials** (lines 431-469)
- **Platform Strip** (lines 473-491)
- **Instructor Final CTA** (lines 493-519)

### Sections to Insert (copied from Index.tsx)
Inserted after the Hero section, in this order:

1. **Earlier Test Guarantee Banner** — emerald gradient with badge image and "Learn More" CTA (Index lines 325-351)
2. **Choose Your Learning Path** — 3 course type cards: Intensive, Semi-Intensive, Weekly (Index lines 353-540)
3. **What's Included** — dynamic grid from `useIncludedFeatures` with feature detail modal (Index lines 542-623)
4. **Featured Courses** — live cards from `useFeaturedCourses` with `DynamicCourseCard` (Index lines 625-698)
5. **From Nervous to Road Ready** — stats + testimonials split layout (Index lines 700-826)
6. **Video Story** — video thumbnail with play modal (Index lines 828-911)
7. **Latest News** — DVSA news feed with featured article layout (Index lines 913-1067)
8. **Features Grid** — portals (Pupil/Parent) + feature cards (Live Availability, Local Instructors, Track Progress) (Index lines 1088-1201)
9. **Learner Testimonials** — dynamic testimonials from `useHomepageTestimonials` (Index lines 1203-1251)
10. **Final CTA** — learner-focused "Ready to Start Your Driving Journey?" (Index lines 1253-1283)
11. **Trust Badges** — mobile text badges + desktop logo images (ADI Code, MSA, CPD, Klarna, Clearpay) (Index lines 1285-1369)

### Keep Unchanged
- **Hero section** (current lines 28-111) — keep the existing hero with its current design
- **Social Proof Bar** (current lines 160-177) — keep, update stats to learner numbers (pass rate, learners, etc.)

### Technical Changes

**File: `src/pages/Drive365HomepageRedesign.tsx`** — full rewrite:

- Add all learner hook imports: `useIncludedFeatures`, `useFeaturedCourses`, `useHomepageTestimonials`, `useHomepageStats`, `useHomepageHero`, `useDVSANews`, `useHomepageFeatures`, `useSiteImages`, `useBookingUpsells`
- Add component imports: `DynamicCourseCard`, `FeatureDetailModal`, `PostcodeAutocomplete`, `SEOHead`
- Add all learner asset imports (course images, testimonial photos, trust badge logos, earlier test badge, video thumbnail, news images)
- Add `motion` from framer-motion for animations
- Add `Dialog`/`DialogContent` for video modal
- Add component state: `selectedFeature`, `featureModalOpen`, `videoModalOpen`
- Replace instructor sections (lines 113-519) with the 11 learner sections listed above
- Keep `MainLayout` wrapper

No database changes, no routing changes, no new files needed.

