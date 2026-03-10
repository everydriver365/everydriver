

## Plan: Add Learner Sections to Drive365 Homepage

The current Drive365 homepage has the instructor-cloned layout (hero, what we do, social proof, product tour, how it works, product grid, testimonials, platform strip, final CTA). The old learner homepage (`Index.tsx` at `/drive365-old`) has several learner-specific sections that should be inserted into the new design.

### Sections to Insert (from old `Index.tsx`)

1. **Earlier Test Guarantee Banner** — emerald gradient banner with badge image and "Learn More" CTA (lines 325-351)
2. **Choose Your Learning Path** — 3 course cards: Intensive, Semi-Intensive, Weekly with pricing, durations, and CTAs (lines 353-540)
3. **What's Included** — dynamic grid of included features from `useIncludedFeatures` hook with images and modal (lines 542-623)
4. **Featured Courses** — live course cards from `useFeaturedCourses` hook (lines 625-698)
5. **From Nervous to Road Ready** — stats + testimonials split layout (lines 700-826)
6. **Learner Testimonials** — dynamic testimonials from `useHomepageTestimonials` hook (lines 1203-1251)
7. **Trust Badges** — ADI Code, MSA, CPD, Klarna, Clearpay logos (lines 1285-1369)

### Sections to Remove (instructor-specific)

- **"What We Do" dark section** — talks about ADI diary app, free for life
- **Product Tour** — 8 instructor features (diary, payments, website, telematics, dashcam, marketing, driving schools)
- **"How It Works"** — instructor onboarding steps (create account, set up diary, start teaching)
- **Product Grid** — instructor pricing tiers (diary free, website £4.99, telematics £9.99, dashcam £12.99)
- **Instructor Testimonials** — ADI-specific quotes
- **Platform Strip** — iOS/Android/GDPR strip (can keep, it's neutral)

### Sections to Keep (work for both)

- **Hero** — will be rewritten with learner content (postcode search, "Find your nearest instructor")
- **Social Proof Bar** — update stats to learner-focused numbers
- **Platform Strip** — neutral, works for learners too
- **Final CTA** — rewrite copy from "Simplify Your Business" to "Start Your Driving Journey"

### Proposed Page Structure (top to bottom)

1. **Hero** — rewrite to learner: postcode search, "Earlier Test Guaranteed", "Find your nearest instructor" (restore from old hero)
2. **Earlier Test Guarantee Banner** — insert from old page
3. **Choose Your Learning Path** — insert 3 course type cards
4. **What's Included** — insert dynamic feature grid with modal
5. **Featured Courses** — insert live course cards
6. **Social Proof Bar** — keep, update stats to learner numbers
7. **From Nervous to Road Ready** — insert testimonial + stats section
8. **Learner Testimonials** — insert dynamic testimonials
9. **Final CTA** — rewrite to "Start Your Driving Journey"
10. **Trust Badges** — insert ADI Code, Klarna, Clearpay logos

### Technical Changes

**File: `src/pages/Drive365HomepageRedesign.tsx`**
- Add imports for all learner hooks: `useIncludedFeatures`, `useFeaturedCourses`, `useHomepageTestimonials`, `useHomepageStats`, `useHomepageHero`
- Add imports for learner components: `DynamicCourseCard`, `FeatureDetailModal`, `PostcodeAutocomplete`
- Add imports for learner image assets (course images, testimonial photos, trust badge logos, earlier test badge)
- Remove the 8 instructor feature showcase sections, product grid, instructor testimonials, and "What We Do" dark section
- Insert the 7 learner sections listed above in their place
- Keep `MainLayout` wrapper (correct learner nav/footer)

No new files, no database changes, no routing changes needed.

