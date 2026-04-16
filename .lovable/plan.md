

## Plan: Move Session Start Panel above the map

### Problem
The `SessionStartPanel` (pupil selector + practice/test toggle) is rendered **below** the map, dashcam link, and status cards. On a 492px mobile viewport, it's completely off-screen and requires significant scrolling to reach. The user can't see it.

### Changes

**File: `src/pages/InstructorLiveSession.tsx`**

1. **Move the `SessionStartPanel` block** (lines 1096–1107) to render **above** the map — specifically right after the `GPSStatusHero` card (after line 1006) and before the Dashcam Portal link.

2. **Also move the `LessonRouteRecorder` block** (lines 1109–1115) to stay adjacent to the SessionStartPanel, keeping them grouped logically.

3. No changes to `SessionStartPanel.tsx` itself — the component already has the pupil selector dropdown and practice/test toggle working correctly.

### Result
When no session is active, the pupil selector and session type toggle will be immediately visible without scrolling, sitting between the device status card and the map.

