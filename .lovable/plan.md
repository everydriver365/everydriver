

# Instructor Home Hero Tile Redesign - Demo Page

## Overview
Create a new demo page at `/instructor-hero-demo` showcasing 4 different redesign options for the instructor mobile home hero tile (currently `ContextualHomeHero.tsx`). Each option will use mock data to demonstrate the layout with weekly progress, weather, traffic, and greeting information.

## Design Options

### Option A: Glassmorphism Card
- Full-bleed hero image with a frosted glass overlay card
- Weekly hours displayed as a large number with a thin horizontal progress bar
- Weather and traffic shown as small pill badges floating on the image
- Greeting text in white over the image, stats card overlapping the bottom

### Option B: Gradient Dashboard (No Image)
- No hero image -- instead a dynamic gradient background based on time of day (warm sunrise tones in morning, cool blues at night)
- Large circular progress ring centered at top
- Stats in a horizontal scrollable row of mini-cards
- Weather/traffic as inline text below greeting
- Clean, minimal, app-native feel

### Option C: Split Hero
- Left 40%: dark navy panel with greeting, weekly goal text, and weather/traffic info stacked vertically
- Right 60%: hero image with rounded corners
- Progress bar spanning full width below the split
- Compact and information-dense

### Option D: Compact Status Bar
- No large hero image at all -- just a slim, information-dense card
- Top row: greeting + circular mini progress ring (48px)
- Bottom row: weather pill, traffic pill, hours pill in a horizontal flex
- Expandable drawer (chevron) reveals today's summary stats grid
- Maximum screen real estate saved for tiles below

## Technical Details

### New File
- `src/pages/InstructorHeroDemo.tsx` -- standalone demo page with all 4 options rendered vertically, each in a mobile-width container (max-w-[390px] centered) to simulate the phone view

### Route Registration
- Add route `/instructor-hero-demo` in `src/App.tsx`

### Mock Data
- All options use hardcoded mock data (firstName, weather, traffic, weekly stats, etc.) so no hooks or backend calls are needed

### Shared Elements
Each option will include:
- Time-based greeting (morning/afternoon/evening)
- Weekly hours progress (e.g., 24h / 42h)
- Weather badge (18C, Partly Cloudy)
- Traffic status indicator
- Framer Motion entrance animations

### Dependencies
- Uses existing dependencies only: framer-motion, lucide-react, tailwind
- Reuses the instructor hero image asset for options that include an image
