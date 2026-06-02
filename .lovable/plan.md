## Add Video access to the Geotab tile

Add a quick "Video" shortcut on the mobile Vehicle Health (Geotab) tile so instructors can jump straight into the ProPlus dashcam clips without going through the Overview → Video sub-tab.

### What changes

`src/components/instructor/VehicleHealthGeotabTile.tsx`
- Add a small secondary action row at the bottom of the tile with a single "Video" pill (camera icon + label + latest clip count).
- The main tile body still navigates to `/instructor/vehicle-health?tab=geotab` (Overview). The new pill stops propagation and navigates to `/instructor/vehicle-health?tab=geotab&sub=video` instead.
- Pill only renders when `dashcam_media` has at least one clip for this instructor; otherwise the tile keeps its current single-action layout (no empty state — matches the live-data-only rule).

`src/hooks/useGeotabHealth.ts`
- Extend the returned shape with `recentClips: number` (count of `dashcam_media` rows in the last 7 days for this instructor). Single extra count query; no schema changes.

`src/components/instructor/vehicle-health/GeotabTab.tsx`
- Read `sub` from the URL query on mount and, if `sub === "video"`, default the inner sub-tab to Video. Keeps deep-linking consistent with the new pill.

### Out of scope
- Desktop tile (mobile-only change per memory rule).
- Any new edge function / video playback work — the existing Video sub-tab already renders `dashcam_media` thumbnails and playback.
- No DB migrations, no styling-system changes (reuses DSM tokens already on the tile).
