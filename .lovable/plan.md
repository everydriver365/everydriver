
# Instructor Home Page Design Demo

## What We're Building

A new self-contained demo page at `/instructor-home-demo` showing 4 design variations of the instructor mobile home page in phone mockup frames. You can tab between them to compare and pick your favourite.

## The 4 Variations

### Variation A: "Track-Style Cards" (No Hero)
- Clean `#E8F1FE` background, no hero image at all
- Top card: gradient blue header (matching the track page GPSStatusHero) with avatar, name, online status, weather
- Second card: white `rounded-3xl shadow-xl` with 2x2 stat grid (Lessons, Earnings, Weekly %, Next Up)
- Third card: Quick Actions as horizontal scrollable icon chips
- Fourth card: Mini timeline of today's lessons

### Variation B: "Hero + Gradient Overlap"
- Full-bleed hero image at top (similar to current design)
- Modernised overlap card with gradient blue header instead of plain white
- Stats inside the overlap card use tinted-icon pill backgrounds
- Quick actions and timeline in white cards below

### Variation C: "Split Hero"
- Compact hero image (rounded corners, inset margins) -- not full bleed
- Status card directly below (no overlap), with gradient header
- Horizontal scroll strip for at-a-glance stats (compact pills)
- Quick actions in a 2-column grid card below

### Variation D: "Immersive Hero + Floating Stats"
- Large hero image (50vh) with dark gradient overlay
- Name, weather, status overlaid directly on the hero in white text
- Glassmorphism-style floating stat pills at bottom of hero
- Card stack below for quick actions and timeline

## Technical Details

### New File
- `src/pages/InstructorHomeDesignDemo.tsx` -- self-contained page with all 4 variations using hardcoded/static data, rendered inside phone mockup frames (`w-[375px] h-[812px]`)

### Modified File
- `src/App.tsx` -- add import and route `/instructor-home-demo` pointing to the new page (added alongside existing demo routes)

### Static Demo Data
- Name: "Ken", 4 lessons, GBP 180 expected, 72% weekly progress, next lesson "Sarah 14:30 SO31"
- Weather: 14 degrees C, Partly Cloudy
- Online status: true
- Uses existing `instructor-hero.jpeg` asset for hero image variations
- Uses existing custom tile icon assets for quick action icons

### Visual Language (matching Track Page)
- Background: `bg-[#E8F1FE]`
- Cards: `bg-white rounded-3xl shadow-xl overflow-hidden`
- Gradient headers: `bg-gradient-to-br from-primary to-primary/80` with white text
- Animated emerald pulse dot for online status
- Decorative circles (`bg-white/10`) in gradient headers
- `framer-motion` fade-up entrance animations with staggered delays
- Tab switcher at top to switch between A / B / C / D

### No Backend Changes
This is a purely visual demo page with hardcoded data -- no database queries, no hooks, no auth required.
