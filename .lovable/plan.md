

## Make the Instructor App Landing Page Light

The `/instructor-app` page currently uses hardcoded dark navy backgrounds throughout. This plan converts it to a clean, light design while keeping the brand blue (#0075c9) as an accent.

### Changes to `src/pages/instructor-app/EveryDriverInstructorHome.tsx`

**1. Header** - Change from dark navy (`bg-[#142040]`) to white with a subtle border:
   - `bg-white border-b border-gray-200`
   - Update button text colors from white to dark/brand blue
   - Keep the "Get Started Free" button as brand blue

**2. Hero Section** - Convert from dark gradient to a light design:
   - Use a white/light gray background (e.g., `bg-gradient-to-b from-white to-gray-50`)
   - Change text from white to dark (`text-foreground`)
   - Keep the emerald/brand accent on the highlighted word
   - Update trust badges and subtext to use muted foreground colors

**3. CTA Section** - Convert from dark navy to brand blue gradient:
   - Use `bg-gradient-to-r from-[#0075c9] to-[#005a9e]` to keep visual interest while aligning with brand
   - Keep white text here for contrast against the blue

**4. Footer** - Lighten to match the rest:
   - Change from `bg-[#142040]` to `bg-gray-50 border-t border-gray-200`
   - Update text colors from white to dark/muted foreground

**5. Mobile Menu** - Update overlay colors from dark navy to white/light

### Technical Details

- Only one file needs editing: `src/pages/instructor-app/EveryDriverInstructorHome.tsx`
- All changes are CSS class swaps -- no structural changes
- The features grid section already uses theme-aware classes (`bg-background`, `text-foreground`) so it requires no changes

