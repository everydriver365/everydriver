

## Redesign the /drive365 Hero to Match Reference Image

### What Changes
Rewrite the hero section in `src/pages/Index.tsx` (lines ~136-320) to match the reference image design:

**Left side:**
- Remove the green "Free Re-test" badge
- Large bold headline: "The Free Diary App" (dark/navy) + "Built for ADIs" (blue `#0075c9`)
- Subtext: "Manage your lessons, track payments, and grow your business — all from one app. Free forever, no credit card required."
- Two CTAs side by side: filled blue "Start Free Today →" linking to `/instructor-app/signup`, and outline "Watch Demo" with play icon
- Trust row with green checkmarks: "No credit card", "Free forever", "GDPR compliant"

**Right side:**
- Copy the uploaded reference image into `src/assets/` as the hero composite image (instructor holding keys with phone/tablet mockups overlaid)
- Two floating stat badges:
  - Top-right: calendar icon + "98% Fill rate" (white card with shadow)
  - Bottom-center: users icon + "500+ Active instructors" (white card with shadow)

**Remove:**
- The polaroid collage (Sarah, James, Emma, Priya)
- The postcode search form
- The Klarna/Clearpay/star rating row
- The mobile hero image block

### Files
1. **Copy** `user-uploads://image-147.png` → `src/assets/hero-adi-composite.png`
2. **Edit** `src/pages/Index.tsx` — replace hero section (lines ~136-320) with the new layout described above. Keep all other sections (features, courses, testimonials, etc.) unchanged.

