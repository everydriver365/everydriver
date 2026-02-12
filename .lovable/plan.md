

# Restyle Instructor Features Page to Capacitor-Inspired Design

Redesign the InstructorFeatures marketing page to match the clean, minimal aesthetic shown in the Capacitor website reference image: white backgrounds, bold black typography, generous whitespace, and a modern split-layout hero.

---

## Design Changes

### 1. Hero Section (FeatureHero.tsx) -- Major Rework
- Replace the dark full-bleed background image with a **clean white/light gray background**
- **Left-right split layout**: bold headline text on the left, a product mockup/illustration on the right
- Typography: **extra-bold black text**, very large heading (similar to Capacitor's massive font weight)
- Subtitle in lighter gray below the heading
- CTA buttons: **rounded pill buttons** -- one filled (brand blue/emerald), one outlined
- Remove the background image overlay entirely
- Add subtle platform icons (Apple, Android, PWA) below the CTAs like Capacitor does

### 2. Navigation Header (InstructorSaaSLayout.tsx) -- Restyle
- Change from dark navy (`bg-[#142040]`) to a **clean white header** with subtle bottom border
- Nav links become **dark text** on white background
- Logo stays the same
- CTA button keeps the emerald accent
- This matches the Capacitor site's light, airy nav

### 3. Stats Bar (StatsBar.tsx) -- Lighten
- Keep the same data but ensure it sits on a clean white/very light background
- Use darker text for values, lighter for labels
- Minimal border or a very subtle divider

### 4. Feature Category Sections (FeatureCategorySection.tsx) -- Simplify
- Alternate between pure white and very light gray (`bg-gray-50`) backgrounds instead of themed colors
- Keep the split text/image layout but with more whitespace
- Cards get a cleaner, flatter look: white background, subtle border, no heavy shadows
- Feature highlight pills stay but get a lighter treatment

### 5. Product Showcase (ProductShowcase.tsx) -- Clean Up
- Remove gradient backgrounds, use plain white
- Keep the split layout with generous padding
- Badges get a lighter, more minimal style

### 6. Testimonial Strip (TestimonialStrip.tsx) -- Lighten
- Change from dark primary background to a light gray or white section
- Testimonial cards: white cards with subtle borders on light background
- Dark text instead of light-on-dark

### 7. Comparison Section (ComparisonSection.tsx) -- Already Light
- Minor refinements to match the overall cleaner aesthetic

### 8. CTA Section (FeatureCTA.tsx) -- Soften
- Option A: Keep dark CTA for contrast (common pattern even on light sites)
- Option B: Switch to a light blue/brand-tinted background
- Will go with Option A as a visual anchor at the page bottom

### 9. Extra Features (ExtraFeatures.tsx) -- Minimal
- Clean white/light background
- Simpler card styling

---

## Summary of the Visual Shift

| Element | Current | New |
|---------|---------|-----|
| Hero BG | Dark navy with image overlay | White with split layout |
| Nav | Dark navy header | White with dark text |
| Typography | White on dark | Bold black on white |
| Section BGs | Dark alternating | White / very light gray |
| Cards | Shadowed with colored accents | Flat, subtle borders |
| CTAs | Emerald on dark | Rounded pills, emerald on white |
| Testimonials | Dark primary background | Light background, white cards |

---

## Technical Details

### Files to Modify

| File | Change |
|------|--------|
| `src/components/instructor-features/FeatureHero.tsx` | Full rewrite to split-layout, white BG, bold black text, pill buttons |
| `src/components/layout/InstructorSaaSLayout.tsx` | Header from dark navy to white, dark text nav links |
| `src/components/instructor-features/StatsBar.tsx` | Lighter background, darker text |
| `src/components/instructor-features/FeatureCategorySection.tsx` | White/gray alternating BGs, cleaner cards |
| `src/components/instructor-features/ProductShowcase.tsx` | Remove gradient BG, cleaner style |
| `src/components/instructor-features/TestimonialStrip.tsx` | Light background, white cards, dark text |
| `src/components/instructor-features/ExtraFeatures.tsx` | Lighter, flatter card styling |
| `src/components/instructor-features/FeatureCTA.tsx` | Minor refinements |
| `src/components/instructor-features/ComparisonSection.tsx` | Minor alignment tweaks |

### Approach
- Keep all existing content, data, and functionality intact
- Only change visual styling (colors, backgrounds, typography weights, border radius)
- Use the existing mockup images in the hero right-side panel
- All framer-motion animations remain
- Mobile responsiveness preserved (hero stacks vertically on small screens)
