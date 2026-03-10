

## Plan: Keep Redesigned Layout, Add Learner Sections Properly

### The Problem
The last edit replaced the entire redesigned page with a copy of the old `Index.tsx`. You lost the modern hero design, clean social proof bar, and the new layout aesthetic. You wanted those kept, with learner sections **added below**.

### What the Page Should Be

**Keep from the Redesign (HomepageRedesignDemo style, adapted for learners):**
1. **Hero** — Same modern layout grid with dot-pattern background, but rewritten for learners: "Your Driving Success Story Starts Here", postcode search, Klarna/Clearpay badges, hero image (polaroid collage or features hero image)
2. **Social Proof Bar** — Keep the clean stat strip, update to learner stats (10,000+ Learners, 95% Pass Rate, 4.9★, etc.)

**Remove (instructor-specific from HomepageRedesignDemo):**
- "What We Do" dark section
- Product Tour (8 instructor features)
- How It Works (instructor onboarding)
- Product Grid (instructor pricing)
- Instructor testimonials
- Platform strip
- Instructor CTA

**Add after Social Proof Bar (from old Index.tsx):**
1. Earlier Test Guarantee Banner
2. Choose Your Learning Path (3 course cards)
3. What's Included (dynamic features grid + modal)
4. Featured Courses (live course cards)
5. From Nervous to Road Ready (stats + testimonial split)
6. Video Story (thumbnail + play modal)
7. Latest News (DVSA feed)
8. Features Grid (Pupil/Parent portals)
9. Learner Testimonials (dynamic)
10. Final CTA ("Start Your Driving Journey")
11. Trust Badges (Klarna, Clearpay, ADI Code, MSA, CPD)

### Technical Change

**File: `src/pages/Drive365HomepageRedesign.tsx`** — rewrite:
- Hero: Use the `HomepageRedesignDemo` modern layout structure (dot-pattern bg, grid layout, clean typography) but with learner copy, postcode search, and learner hero image
- Social Proof Bar: Keep from redesign, update stats
- Lines after social proof: Insert all 11 learner sections (already present in current file from line 258 onward — these are correct and can be kept)
- Wrap in `MainLayout` (already correct)

Essentially: replace lines 1-257 (the old Index.tsx hero/polaroid collage) with the modern redesign hero adapted for learners, then keep everything from line 258 onward (the learner sections that were correctly added).

