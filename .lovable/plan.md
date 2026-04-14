

## Add Provider Selector to Tracking Page

Kenneth has both Geotab and Radius devices. Currently the page auto-selects one provider based on priority and hides the other. We need a visible toggle so he can switch between them.

### Approach

**Add a segmented control (Geotab | Radius)** at the top of the tracking page, above the existing device selector tile. Selecting a provider switches the active device, updates the map and status, and persists the choice to `instructors.preferred_tracking_provider`.

### Changes

**1. New component: `ProviderSelectorTile.tsx`**
- Queries `gps_devices` for the instructor to find which providers have active devices
- Only renders if 2+ providers are available
- Uses the existing `IOSSegmentedControl` component for a clean pill toggle
- Shows provider names with status indicators (e.g. last seen time)
- On change: updates `instructors.preferred_tracking_provider` in the database and calls `onProviderChange` callback

**2. Update `InstructorLiveSession.tsx`**
- Add the `ProviderSelectorTile` above `TrackerSelectorTile`
- When provider changes, re-fetch devices filtered to that provider and select the best one
- Reset realtime subscriptions (clear `deviceIdRef` and `lastSeenRef`) so the new device starts streaming

**3. Update `TrackerSelectorTile.tsx`**
- Remove the `activeProvider` filter (the parent now controls which provider's devices are shown by passing the selected device directly)
- Or keep it but accept the provider as a prop instead of deriving it internally

### Technical Details

- The `preferred_tracking_provider` column already exists on the `instructors` table -- no migration needed
- The segmented control uses the existing `IOSSegmentedControl` component for consistency
- Provider labels: "Geotab" and "Radius" (capitalised)
- The selector will only appear when the instructor has active devices from multiple providers

