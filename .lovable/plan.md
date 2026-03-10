

## Plan: Create Drive365 Learner Homepage Using HomepageRedesignDemo Layout

Replicate the exact visual structure of `HomepageRedesignDemo.tsx` but rewrite all content for learners (finding instructors, booking lessons, ETG).

### Sections to Adapt (same layout, learner content)

| HomepageRedesignDemo Section | Drive365 Adaptation |
|---|---|
| **Hero**: "The Free Diary App Built for ADIs" | "Find Your Perfect Driving Instructor" with postcode search |
| **Dark section**: "Your Diary, Your Way — Free for Life" | "Earlier Test Guaranteed" — ETG value prop with explainer video |
| **Social proof bar**: 500+ instructors, 50k lessons | 1,000+ instructors, 10,000+ tests passed, 4.8★, Earlier Tests |
| **Product tour** (8 alternating features) | Learner features: Find Instructors, Book Lessons, Track Progress, Theory Practice, Parent Tracking, Payments, ETG, Intensive Courses |
| **How it works** (3 steps) | 1. Search by postcode → 2. Book your course → 3. Pass your test |
| **Product grid** (free diary + paid add-ons) | Course types: Weekly Lessons (from £X), Semi-Intensive, Intensive, ETG Add-on |
| **Testimonials** | Learner testimonials (passed first time, loved the app, etc.) |
| **Platform strip** | iOS & Android, Online Booking, DVSA Approved, etc. |
| **Final CTA** | "Ready to Start Driving?" → Find courses CTA |

### Implementation

**1. Create `src/pages/Drive365HomepageRedesign.tsx`**
- Copy the exact layout/structure from `HomepageRedesignDemo.tsx`
- Use `MainLayout` instead of `InstructorSaaSLayout`
- Replace all instructor copy with learner-focused content
- Swap CTAs to link to `/courses`, `/pupil/login`, etc.
- Reuse existing learner assets (`course-intensive.jpg`, `course-weekly.jpg`, `feature-theory.jpg`, etc.)
- Include `PostcodeAutocomplete` in the hero for searching instructors
- Brand color: Drive365 green/primary instead of `#0075c9` blue

**2. Update `src/components/ConditionalHome.tsx`**
- Import `Drive365HomepageRedesign` (lazy)
- Change the Drive365 domain branch to render `<Drive365HomepageRedesign />` instead of `<Index />`

**3. Add route in `src/App.tsx`**
- Register `/drive365-homepage` for direct access/testing

No database changes needed.

