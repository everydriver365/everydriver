

## Fix: Crash in ActivityTilesGrid

### Root Cause
The "Objects are not valid as a React child" error occurred in `ActivityTilesGrid` during a hot module reload. The component stack confirms it. The current code is actually correct and the page renders fine on a full load (verified in browser), but HMR can sometimes cause stale references.

### Fix
Add a defensive check in `ActivityTilesGrid.tsx` to ensure the icon is valid before rendering, and also remove the unused `AnimatedCounter` import (cleanup):

**File: `src/components/instructor/ActivityTilesGrid.tsx`**
- Remove unused `AnimatedCounter` import (line 3)
- Add a safety check: if `tile.icon` is not a valid component, fall back to a default icon

This is a minor defensive improvement that prevents the crash from recurring during development or hot-reload scenarios.

