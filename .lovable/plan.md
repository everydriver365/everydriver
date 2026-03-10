

## Redesign Drive365 Demo Page Using Instructor Marketing Page Pattern

### What We're Doing
Replace the current 4-option demo at `/demo/drive365-hero` with a single polished Drive365 learner homepage that mirrors the instructor marketing page structure — adapted for learner/course content.

### Design Structure (mirroring `InstructorMarketing.tsx`)

**1. Hero — Split layout (FeaturePageHero style)**
- Left: Badge ("Earlier Test Guaranteed"), large headline, description, 4 checkmark bullet points, postcode search bar + CTA button, star rating strip
- Right: Hero image (reuse `heroMobile` asset) in rounded card with floating stat badges (pass rate, reviews)
- Light background, clean typography, emerald/blue accent

**2. Feature Detail Grid — 8-card grid (4 cols on desktop)**
- Cards for: Earlier Test Guarantee, 0% Finance, DVSA-Approved Instructors, Flexible Scheduling, Theory Support, Dashcam Lessons, Progress Tracking, Cancellation Cover
- Each card: icon in tinted circle + title + short description
- Alternating `bg-muted/30` background section

**3. "More Than Just Lessons" CTA Section**
- Centered heading + subtext + "Browse All Courses" button
- Clean `bg-background` section

**4. Testimonial Strip — 3-column cards**
- Reuse `TestimonialStrip` component with learner testimonials
- Star ratings, quotes, names

**5. Bottom CTA Banner**
- Dark `bg-primary` full-width banner
- "Ready to Start Driving?" headline + "Find Courses" and "Call Us" buttons
- "No commitment required" subtext

### Implementation
**Single file change:** Rewrite `src/pages/Drive365HeroDemo.tsx` with the new unified design. Reuse existing components (`TestimonialStrip`, or inline equivalents) and existing assets. No routing changes needed.

