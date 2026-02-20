

# Add "Open Geotab Live Map" Button to Tracking Page

## What This Does

Adds a small floating button on the live tracking page (`InstructorLiveSession.tsx`) that opens Geotab's own built-in live map in a new browser tab. This lets you compare your custom sat-nav view side-by-side with Geotab's native map for testing and debugging purposes.

## Changes

### File: `src/pages/InstructorLiveSession.tsx`

- Add an "Open Geotab Map" button to the floating controls area (near the existing header/controls)
- The button opens `https://my.geotab.com` in a new tab using `window.open()`
- Styled as a small icon button with a tooltip, using the `ExternalLink` icon from lucide-react
- Only shown when the instructor has a Geotab device (uses existing device data to check `tracking_provider === "geotab"`)

### Visual Placement

- Small floating button positioned in the top-right area of the map, near existing controls
- Uses a ghost/outline variant so it doesn't compete with the main UI
- Labeled "Geotab Live" with an external link icon

### No backend or database changes needed

The button simply opens a URL in a new tab. The user will need to be logged into their Geotab account in their browser for the map to load.

