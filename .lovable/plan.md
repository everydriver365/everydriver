

## Add Dashcam Portal Links in Four Places

Add a "View Dashcam Footage" link/button that opens `https://www.kinesisfleetpro.com/#/login;next=%2Fstatus` in four locations.

### 1. Settings — New tile in "Tracking & Routes" category

**File: `src/pages/InstructorSettings.tsx`**
- Add a new tile to the `allTiles` array in the `tracking` category:
  - `id: "dashcam-portal"`, title: "Dashcam Portal", description: "View footage on Kinesis Fleet Pro", icon: `Camera`, category: `"tracking"`
- In the tile content renderer, add a special case for `"dashcam-portal"` that renders the external link button (similar to how other tiles render custom content), opening the Kinesis URL in a new tab

### 2. Home quick actions grid — New tile

**File: `src/components/instructor/HomeQuickActions.tsx`**
- Add a new action entry: `{ id: "dashcam", label: "Dashcam", subtitle: "View footage", icon: Camera, iconColor: "text-slate-600" }` with an `onClick` handler that opens the Kinesis URL via `window.open`
- Import `Camera` from lucide-react

### 3. Tracking page — Button below Fleet Map link

**File: `src/pages/InstructorLiveSession.tsx`**
- Add a button after the "Fleet Map" button (around line 959) styled the same way, with a Camera icon and "Dashcam Portal" label that opens the Kinesis URL in a new tab
- Import `Camera` from lucide-react

### 4. Recent Sessions list — Button at bottom

**File: `src/components/instructor/tracking/RecentSessionsList.tsx`**
- Add a small "View Dashcam Footage" link/button at the bottom of the recent sessions list that opens the Kinesis URL externally
- Import `Camera` and `ExternalLink` from lucide-react

### No backend changes needed

