

## Plan: 100% Clone HomepageRedesignDemo to Drive365 Homepage

The user wants an **exact clone** — same layout, design, images, and content. The current `Drive365HomepageRedesign.tsx` has the right structure but different content and uses `MainLayout` instead of `InstructorSaaSLayout`.

### What's Different Now
- **Layout wrapper**: `MainLayout` (learner header/footer) vs `InstructorSaaSLayout` (instructor header/footer with blue nav)
- **Content**: All hero text, feature descriptions, images, CTAs, testimonials are different (learner-focused instead of instructor-focused)
- **Colors**: Uses `text-primary` instead of hardcoded `#0075c9`
- **Hero**: Has postcode search instead of CTA buttons
- **Images**: Uses learner assets instead of instructor assets (`drive365-hero-learner.png` vs `features-hero.png`)

### Changes

**1. Rewrite `src/pages/Drive365HomepageRedesign.tsx`**
- Make it a true 100% copy of `HomepageRedesignDemo.tsx`
- Same `InstructorSaaSLayout` wrapper
- Same imports (all instructor asset images)
- Same hero text ("The Free Diary App Built for ADIs"), same dark section, same social proof, same 8-feature product tour, same product grid, same testimonials, same platform strip, same final CTA
- Literally the same file content, just a different component name

This means the Drive365 domain will show the exact same page as the EveryDriver domain.

**2. No routing changes needed** — `ConditionalHome.tsx` already renders `<Drive365HomepageRedesign />` for Drive365 domains.

