

# Offline Mode Integration Plan

## What This Will Do

Wire up the existing offline infrastructure so the instructor app works without an internet connection. Schedules and pupil data will be cached locally, changes queued for sync, and a visible indicator will show connection and sync status.

## What the Instructor Will See

- A small **cloud/wifi icon** in the mobile header showing online/offline status and pending sync count
- When offline, the app continues to show cached schedule and pupil data instead of blank screens
- When back online, queued changes sync automatically
- A popover with sync details (last synced time, pending changes, manual refresh button)

## Implementation Steps

### 1. Add OfflineSyncIndicator to the Mobile Header
- Import and render the existing `OfflineSyncIndicator` component in `InstructorMobileHeader.tsx`
- Place it next to the settings icon area
- Pass the instructor ID from context so it can manage caching

### 2. Initialize Offline Caching on App Load
- In `InstructorMobileHome.tsx`, call the `useOfflineSync` hook to trigger initial caching of schedules and pupils when the app loads and the instructor is online
- This ensures data is available if the connection drops later

### 3. Add Offline Data Fallback to Key Pages
- Update the schedule list view (`NewMobileScheduleView`) to fall back to cached IndexedDB data when the network fetch fails or the device is offline
- Use the existing `useOfflineData` hook pattern for this

### 4. Service Worker Already Configured
- The PWA config in `vite.config.ts` already caches Supabase API responses with a NetworkFirst strategy -- no changes needed here

---

## Technical Details

**Files to modify:**
- `src/components/instructor/InstructorMobileHeader.tsx` -- add sync indicator icon
- `src/components/instructor/InstructorMobileHome.tsx` -- initialize offline caching via `useOfflineSync`

**Files to create:**
- None -- all components and hooks already exist

**Existing infrastructure being connected:**
- `src/lib/offlineStorage.ts` -- IndexedDB wrapper
- `src/hooks/useOfflineSync.ts` -- sync queue, schedule/pupil caching
- `src/hooks/useOfflineData.ts` -- offline-first data fetching
- `src/components/pwa/OfflineSyncIndicator.tsx` -- UI indicator
- Workbox runtime caching in `vite.config.ts`

