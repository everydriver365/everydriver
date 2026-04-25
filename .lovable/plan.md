I found why it still looks unchanged: the previous global rule only targeted `.instructor-portal`, but the instructor app marketing/mobile pages use `InstructorSaaSLayout` and DSM uses its own page wrapper, so many tiles were outside the scope. Some tiles also have inline/custom shadows that override the intended lift.

Plan:

1. Scope the lift to the actual instructor app wrappers
   - Add an instructor-app class to `InstructorSaaSLayout` so every `/instructor-app/...` page is covered.
   - Add the same scope to the DSM mobile app page so its Quick Actions, schedule, next lesson, feature grid, and CTA tiles are covered.

2. Create one stronger, visible tile elevation rule
   - Define a shared “lifted tile” shadow that is noticeably deeper on the light blue/grey backgrounds.
   - Apply it to standard tile/card surfaces: `Card`, `shadow-lift`, `shadow-premium`, Tailwind shadow classes, white/card rounded tiles, and common tile buttons inside the instructor app scope.
   - Keep the design unchanged apart from tile elevation: no layout, colour, typography, or content changes.

3. Explicitly catch Quick Actions and Telematics
   - Update DSM Quick Action tiles and DSM feature tiles so they use the stronger lift directly instead of their current tiny `0_1px_3px` shadow.
   - Ensure Telematics page cards, metric tiles, scorecard, and comparison/benefit cards inherit the same lift through the new instructor app scope.

4. Protect non-tile surfaces
   - Exclude maps, dialogs, popovers, bottom nav, headers, menus, and full-width section backgrounds so only tiles/cards are lifted.
   - Leave gradient CTA cards with their existing coloured shadow unless they need the added depth without changing their look.

5. Verify coverage
   - Check the instructor app pages for remaining `bg-white`/`bg-card` rounded tile patterns that do not use any shadow utility and add the shared class where needed.
   - Run a focused code search for tile/card/shadow patterns after changes to confirm no obvious instructor tiles were missed.