

# Add Connection-Aware Status and Marker Color

## Overview
Replace the simple "Live"/"Connecting" status with a proper connection check based on a 30-second threshold. The marker will turn grey when offline, red when overspeeding, and green when normal. The status badge will show "Connected" or "Offline" instead of the generic status text.

## Changes

### Modify `src/components/instructor/GoogleLiveTrackingMap.tsx`

**1. Add a `now` state + 1-second ticker (replaces the existing `agoText` timer)**
- Add `const [now, setNow] = useState(Date.now())` state
- Replace the existing `useEffect` at lines 93-98 with a single 1-second interval that updates `now`
- Derive `agoText` from `now` instead of using `formatAgo`

**2. Add connection threshold constant**
- `CONNECTION_THRESHOLD_SECONDS = 30` near the top of the component

**3. Compute derived values from `now` and `device`**
- `lastSeenMs` from `device.last_seen_at`
- `ageSeconds` from `now - lastSeenMs`
- `isConnected = ageSeconds <= 30`
- `markerColor`: grey if offline, red if overspeed, green if normal
- `connectionLabel`: "Connected" or "Offline"
- `agoText`: formatted from `ageSeconds`

**4. Update marker icon (line ~217-224)**
- Use `markerColor` instead of `overspeed ? "#ef4444" : "#22c55e"`
- Add `isConnected` and `markerColor` to the useEffect dependency array

**5. Update status badge (line ~336-341)**
- Replace `status` with `connectionLabel` for the badge text
- Use green variant when connected, secondary/amber when offline
- Keep the existing `status` state only for loading/error messages (shown in the loading overlay)

**6. Summary of line-level edits:**
- Lines 67: Add `now` state, keep `agoText` as derived
- Lines 73-78: Keep `overspeed` useMemo as-is (already correct)
- Lines 92-98: Replace timer -- single interval updating `now`; derive `agoText` inline
- Lines 216-224: Use `markerColor` variable for fill color, add dependencies
- Lines 336-341: Badge shows `connectionLabel`, variant based on `isConnected`

