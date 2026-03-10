

## Plan: Sync EveryDriver Homepage with the Other Project's Redesign

### Problem
The other project ("Every Driver and 365 (Supabase) USE THIS ONE") switched its homepage to use `HomepageRedesignDemo.tsx` — a completely different design with:
- Split hero: "The Free Diary App Built for ADIs" + feature hero image with floating stat badges
- Dark "Your Diary, Your Way — Free for Life" section with explainer video placeholder
- Social proof bar (500+, 50k+, 4.9, £0)
- Product tour: 8 alternating image/text feature sections
- "How it works" 3-step section
- Product grid (Free diary + paid add-ons with images)
- Testimonials + platform strip + final CTA

This project still renders `InstructorAppHome` (the older SaaS-style hero with "Grow Your Driving School Business").

### What Changed in the Other Project
In `ConditionalHome.tsx`, line 27 was changed from `<InstructorAppHome />` to `<HomepageRedesignDemo />`.

### Plan

**1. Create `src/pages/HomepageRedesignDemo.tsx`**
- Copy the exact 524-line file from the other project
- All required assets already exist in this project: `features-hero.png`, `diary-app.png`, `pupil-making-payment.png`, `website-showcase.png`, `telematics-showcase.png`, `dashcam-feature.png`, `marketing-website-mockup.png`, `diary-option-lifestyle.png`, `dashcam-ai.png`, `driving-school-1.png`, `driving-school-2.png`, `pupil-app-hero.png`
- `CrossfadeImages` component already exists at `src/components/ui/CrossfadeImages.tsx`
- `InstructorSaaSLayout` already exists

**2. Update `src/components/ConditionalHome.tsx`**
- Import `HomepageRedesignDemo` instead of `InstructorAppHome`
- Change the default return to render `<HomepageRedesignDemo />` instead of `<InstructorAppHome />`

**3. Add route in `src/App.tsx`**
- Register `/homepage-redesign-demo` route for direct access

No database changes needed — all content is hardcoded in the component.

