

## Instructor Dashboard Redesign Demo Page

A new demo page at `/instructor-tile-demo` showcasing multiple redesign options for both the **Hero card** and the **Next Lesson tile**, rendered with mock data so you can compare them side-by-side on any device.

---

### Page Structure

The page will be split into two main sections:

**Section A: Hero Card Redesigns (3 options)**
**Section B: Next Lesson Tile Redesigns (3 options)**

Each option is a fully rendered, self-contained mock using static data (no database queries needed).

---

### Section A: Hero Card Options

**Option A1 -- Glassmorphism Card**
- Semi-transparent frosted glass card overlapping the hero image
- Blurred backdrop (`backdrop-blur-xl bg-white/70`)
- Progress ring and stats visible through the frosted effect
- Weather and traffic shown as small pill badges in a horizontal row
- More modern, iOS-style feel

**Option A2 -- Full-Bleed Dark Overlay**
- No separate card -- all content rendered directly over the hero image with a dark gradient overlay
- White text on dark gradient (`bg-gradient-to-t from-black/80 via-black/40 to-transparent`)
- Progress ring with a glowing emerald stroke on dark background
- Stats in a bottom row of glass pill badges
- Immersive, editorial feel

**Option A3 -- Split Gradient (No Image)**
- Removes the hero image entirely
- Full gradient background from primary to a teal/navy blend
- Greeting, stats, and progress ring laid out in a clean card-free layout
- Weather/traffic as inline text
- Faster loading (no image), cleaner on lower-end devices

---

### Section B: Next Lesson Tile Options

**Option B1 -- Compact Pill Card**
- Single-row compact layout: Avatar | Name + Time | Navigate button
- Urgency indicated by left border color (blue > amber > red)
- Action buttons hidden behind a "swipe" or expand gesture
- Duration badge as a small rounded pill
- Minimal vertical footprint

**Option B2 -- Rich Card with Map Preview**
- Larger card with a mini static map placeholder at the top (grey box with MapPin icon, simulating a map preview)
- Pupil info below with avatar, name, location, payment badge, and traffic ETA
- Countdown as a prominent pulsing badge when < 30 min
- Action buttons in a horizontal scrollable strip
- Premium, information-dense feel

**Option B3 -- Timeline-Style Card**
- Vertical timeline aesthetic with a colored line on the left
- Time marker dot at the top, connected by a line to the pupil info
- Urgency colors on the timeline line itself
- Actions as icon-only circular buttons in a row
- Duration shown inline with the time
- Clean, schedule-oriented look

---

### Technical Details

**New file:** `src/pages/InstructorTileDemo.tsx`
- Self-contained page with all mock data inline
- Uses existing components: `PupilAvatar`, `PaymentStatusBadge`, `Badge`, `Button`
- Uses `framer-motion` for entrance animations
- Mobile-first layout (single column, scrollable sections)
- Each option wrapped in a labeled section with `Badge` tag and description

**Route registration:** `src/App.tsx`
- Add route: `<Route path="/instructor-tile-demo" element={<InstructorTileDemo />} />`
- Placed alongside existing demo routes (`/hero-demo`, `/collage-demo`, `/hero-redesign`)

**Mock data used:**
- Pupil name: "Sarah Mitchell"
- Start time: "10:30 AM", date: "Today"
- Minutes until: 26
- Duration: 90 min (1.5h)
- Pickup: "SW1A 1AA"
- Account balance: 80 (credit)
- Weather: 14 degrees C, partly cloudy
- Weekly progress: 22h / 30h (73%)
- Traffic: moderate with 5 min delay

**No database queries or API calls** -- purely visual mock-ups for comparison.
