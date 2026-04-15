

## Deep-link to Radius Dashcam Portal

Replace the broken Geotab-based dashcam gallery with a clean launcher card that opens the Radius/Velocity Fleet portal in a new browser tab. The existing gallery code references a deleted `geotab-media-download` edge function and will never work — this replaces it with something immediately useful.

### What changes

**`src/components/instructor/dashcam/DashcamGalleryView.tsx`** — Full rewrite
- Remove all Geotab media fetching, filtering, grid, and dialog code
- Replace with a single iOS-styled launcher card:
  - Camera icon + "View Dashcam Footage" title
  - Subtitle explaining footage is viewed on the Radius portal
  - "Open Dashcam Portal" button that opens `https://velocity.radiustelematics.com` in a new tab
  - Secondary help text: "Log in with your Radius account credentials"
- Keep the component signature (`instructorId`, `showAllInstructors`) so the parent page doesn't need changes

**`src/components/instructor/dashcam/DashcamVideoPlayer.tsx`** — Delete
- Dead code — references the deleted `geotab-media-download` edge function

**`src/pages/instructor/DashcamGallery.tsx`** — Minor restyle
- Match the iOS design system (white card, `#F2F2F7` background, system font)

### Deep-link URL
`https://velocity.radiustelematics.com` — this is the Radius Vision / Velocity Fleet web portal where instructors already have accounts to view their dashcam footage. Opens in a new tab via `window.open()`.

### No backend changes needed
- No new tables, edge functions, or API calls
- The `dashcam_media` table stays in the DB (no migration) in case a video API becomes available later

