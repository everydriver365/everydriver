Plan to fix this properly:

1. Create one shared instructor mobile blue token
   - Use the existing target colour from the reference: `#3D55A1` with tint `#EDF2FE`.
   - Expose it through semantic CSS variables in `index.css`, so the colour is not repeatedly hardcoded in separate components.
   - Use the token for both solid blue surfaces and pale blue icon/button backgrounds.

2. Update the actual mobile home components shown in your screenshot
   - `MobileHomeRedesign.tsx`
     - Up Next Call button solid background.
     - Text / Go button tint and icon colour.
     - Any remaining blue tint values in the Up Next card.
   - `MobileHomeBottomSections.tsx`
     - Schedule active Today tab.
     - Schedule “View all” link.
     - Upcoming lesson accent bars / time labels.
     - Add lesson link.
     - Quick Access primary tile background.
     - Quick Access blue icon tiles.
     - Pagination indicators.
   - `quickAccess/tileRegistry.ts`
     - Ensure Settings uses the blue tone, not grey.

3. Remove competing old blue values in this scope
   - Replace any remaining `#EEF3FF`, `#EEF2FB`, `#F5F8FF`, `#007AFF`, `#2952B3`, or `#2F63D3` used by the instructor mobile home’s Schedule / Quick Access / action buttons.
   - Keep unrelated screens alone unless they directly render on this same mobile home view.

4. Add stronger styling where component defaults are overriding the change
   - For the Today/Tomorrow segmented control and Quick Access primary tile, keep inline/style-level values or token-backed class values so shadcn/Tailwind defaults cannot override them.
   - Do not change layout, spacing, routes, handlers, data fetching, lesson logic, quick access ordering, edit behaviour, or navigation.

5. Verify on the exact viewport and route
   - Open `/instructor` at the mobile viewport shown in your screenshot.
   - Dismiss the “Lesson ended” modal so the home screen is visible.
   - Confirm visually and by computed colour that:
     - Call button solid blue = Settings tile solid blue = Today active tab solid blue.
     - Text/Go and blue quick-access icon tints use the matching pale blue.
   - Check no console/runtime errors are introduced.

Expected result: the visible Call, Settings, and Today blue accents on the instructor mobile home screen will all use the exact same blue source of truth and will no longer be affected by older hardcoded blue values or component defaults.