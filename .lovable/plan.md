I found why the accessibility controls feel disjointed: the current implementation mixes a global `html` font-size change, portal `zoom`, hardcoded pixel font sizes, hardcoded colours, and separate instructor/accessible styling systems. Some sections are inside `.instructor-portal` / `.ios-instructor`, others are portalled into `body`, and many tile components use inline `fontSize`/`color`, so contrast and text size changes only affect parts of the app.

Plan to fix it properly:

1. Centralise accessibility application
   - Update `AccessibilityContext` so settings are applied immediately on load and every change.
   - Add stable root attributes/classes for:
     - text scale
     - high contrast
     - reduced motion
     - larger tap targets
   - Keep local persistence so there is no separate save step required.

2. Replace the current inconsistent scaling approach
   - Remove the broad `html { font-size: calc(...) }` scaling that can affect unrelated areas unpredictably.
   - Apply instructor-app scaling through a dedicated `.a11y-scope` wrapper/class on instructor portal containers and portalled panels.
   - Use a consistent CSS variable system so both Tailwind `rem` text and fixed-pixel/inline-styled instructor tiles can respond.

3. Make the instructor shell the accessibility scope
   - Add the accessibility scope class to the instructor mobile/desktop layout container.
   - Add the same scope to instructor sheets/drawers/dialog-like content that renders outside the main DOM tree where needed.
   - Ensure the `/instructor/accessibility` page itself uses the same scope so the preview matches the real app.

4. Fix hardcoded tile and section text sizing
   - Update the shared instructor tile primitives (`Tile`, `WarmTile`/`InstructorTile` where needed) to use CSS variables or scalable helper values instead of fixed `15px`, `12px`, etc.
   - This will make the horizontal quick actions, dashboard tiles, and repeated tile components respond consistently.

5. Fix contrast mode properly
   - Expand high-contrast CSS beyond just changing `--dsm-text` and `--dsm-border`.
   - Override key instructor variables for card backgrounds, secondary text, icons, muted text, borders, focus rings, and input/switch colours.
   - Add targeted rules for common hardcoded iOS colours like `#6E6E73`, `#E5E5EA`, and white cards inside the instructor scope so sections do not remain low contrast.

6. Make the accessibility page clearer
   - Update the page copy to say settings apply automatically.
   - Keep the reset button.
   - Make the preview use the same CSS rules as the app instead of manually calculating font sizes, so it reflects the real result.

7. Validate the common instructor areas
   - Check the mobile home page, horizontal quick actions, menu drawer, notifications/search overlays, and a couple of secondary instructor pages to confirm:
     - text sizes change consistently
     - high contrast is visibly stronger
     - larger tap targets apply
     - reduced motion still disables transitions/animations

Technical notes:
- No database changes are needed.
- Main files expected to change:
  - `src/context/AccessibilityContext.tsx`
  - `src/index.css`
  - `src/components/layout/InstructorPortalLayout.tsx`
  - `src/pages/InstructorAccessibility.tsx`
  - shared instructor tile components such as `src/components/instructor/Tile.tsx` and any related tile primitive needed for consistency.