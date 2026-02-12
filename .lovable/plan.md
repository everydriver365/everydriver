

## Redesigning the Marketing Website to Promote Key Products

The current site has a strong features listing, but the homepage tries to showcase 50+ features equally, which dilutes the impact of your four core revenue-driving products. This plan restructures the marketing site around a **product-led storytelling approach** -- guiding visitors through a clear narrative of how each product supports their business.

---

### The Problem Today

- The homepage (InstructorFeatures) is a long scrolling list of 13 feature categories -- visitors have to scroll through everything to find what matters
- The four key products (Free Diary App, Domains/Website, Telematics, Dashcam) are buried among other features rather than headlined as standalone offerings
- There's no clear "journey" showing how the products work together
- The hero talks generically about "50+ tools" rather than leading with the free offer

---

### Proposed Site Structure

```text
Homepage (new)
|
|-- Hero: Lead with the FREE diary app offer
|-- "How It Works" 3-step section
|-- Product Spotlight Cards (4 products)
|-- Social Proof / Testimonials
|-- CTA: Start Free
|
+-- /features (existing, keep as the deep-dive page)
+-- /telematics (existing dedicated page)
+-- /dashcam (existing dedicated page)
+-- /domains (existing dedicated page)
+-- /pricing (existing)
```

---

### Section-by-Section Design

#### 1. New Hero Section -- Lead with Free

Replace the current generic hero with a specific, benefit-driven message:

- **Headline**: "Your Free Instructor Diary -- No Catches, No Card Required"
- **Subtext**: "Manage lessons, pupils, and payments from your phone. Then grow with domains, telematics, and dashcams when you're ready."
- **Primary CTA**: "Start Free Today" (links to signup)
- **Secondary CTA**: "See All Features" (links to /features)
- **Right side**: Phone mockup showing the diary app

This immediately communicates the free offer and positions the paid products as natural upgrades.

#### 2. "How It Works" -- 3-Step Journey

A clean horizontal strip with three numbered steps:

| Step | Title | Description |
|------|-------|-------------|
| 1 | Sign Up Free | Create your account in 60 seconds. No card needed. |
| 2 | Set Up Your Diary | Add your availability, import pupils, and start taking bookings. |
| 3 | Grow Your Business | Add your own website, GPS tracking, and dashcam when you're ready. |

This reassures visitors that it's genuinely free to start and shows the upgrade path.

#### 3. Product Spotlight Cards -- The Core Four

Four large, visually distinct cards arranged in a 2x2 grid (stacked on mobile). Each card has:
- A product icon and name
- A short benefit headline
- 3-4 bullet points
- A "Learn More" link to the dedicated page
- A pricing indicator (Free / From X/month)

| Product | Headline | Key Benefits | Link |
|---------|----------|-------------|------|
| Smart Diary | "Your lessons, your way" | Drag-and-drop calendar, Google Calendar sync, gap filling, payment tracking | /features |
| Professional Website & Domain | "Get found online" | Mini-website builder, custom .co.uk domain, direct bookings, SEO | /domains |
| Telematics | "Teach with data" | Live speed monitoring, driver scoring, trip replay, progress tracking | /telematics |
| Dashcam | "Eyes on every lesson" | Geotab integration, incident recording, clip sharing, cloud storage | /dashcam |

The Diary card is highlighted with a "FREE" badge. The other three show their tier pricing.

#### 4. "Better Together" -- Connected Value Strip

A horizontal section showing how the four products connect:

```text
[Diary] --> [Website brings pupils] --> [Telematics improves lessons] --> [Dashcam protects you]
```

Short copy: "Each product works on its own, but together they create the complete instructor platform. Start with the free diary, add what you need as you grow."

#### 5. Testimonials -- Product-Specific

Three testimonial cards, each tied to a specific product (reuse existing testimonials but tag them):
- Sarah M. -- Diary ("I just teach")
- James T. -- Telematics ("Pupils see their improvement")
- Priya K. -- Tracking/Dashcam ("Parents love the live tracking")

#### 6. Final CTA

"Start Your Free Diary Today" with signup button.

---

### Navigation Updates

Reorder the nav links to match the product story:

**Current**: Home | Features | Telematics | Dashcam | Pricing | Domains | About | Contact

**Proposed**: Home | Features | Websites & Domains | Telematics | Dashcam | Pricing | About | Contact

This groups the website/domain offering more clearly as a product.

---

### Technical Implementation

**Files to create:**
- `src/components/instructor-features/HowItWorks.tsx` -- 3-step section
- `src/components/instructor-features/ProductSpotlightGrid.tsx` -- 4 product cards
- `src/components/instructor-features/ConnectedValueStrip.tsx` -- "Better Together" section

**Files to modify:**
- `src/pages/instructor-app/InstructorFeatures.tsx` -- Replace the current homepage layout with the new product-led structure
- `src/components/instructor-features/FeatureHero.tsx` -- Update hero copy and layout to lead with free diary
- `src/components/layout/InstructorSaaSLayout.tsx` -- Reorder nav links

**No database changes required** -- this is purely a frontend restructure using existing components and patterns.

