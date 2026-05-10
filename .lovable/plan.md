## Why Ken's tracker isn't visible

Ken D actually has **two** trackers in the database:

| Device | Provider | Active | Last seen | Heartbeat |
|---|---|---|---|---|
| Charlotte (`861778063583081`) | Radius | ✅ | 06:59 today (~3h ago) | 07:06 today |
| Kenneth's Geotab | Geotab | ❌ | 15 Apr | 15 Apr |

The GPS panel on the Profile → GPS tab only renders a single "Connected / Offline" pill with this rule:

```ts
isConnected = (now - last_seen_at) < 120s
```

Because Charlotte last reported 3 hours ago (vehicle parked overnight) and Geotab is `is_active=false`, **both devices fail that 120s test → the panel just says "Offline" with nothing else**, so it looks like there's no tracker at all.

The smarter `useGPSConnectionStatus` hook already exists and uses a 4-state model (`active` / `recent` / `stationary` / `offline`) that correctly classifies a parked-but-fitted Radius device as **"Stationary"** (heartbeat recent, no movement). The settings panel just isn't using it.

## Plan

Replace the single Connection Status card on the **Profile → GPS** tab with a **list of every fitted device** for the instructor, each with proper status, so a fitted-but-stationary or temporarily-offline tracker is still clearly visible.

### 1. Fetch all devices, not just the latest

In `InstructorDetailsEditor.tsx` (the GPS-only view + the GPS tab), replace the single-row `gps_devices` query (`.limit(1).maybeSingle()`) with a list query:

```ts
.from("gps_devices")
.select("id, device_name, device_identifier, tracking_provider, is_active, last_seen_at, last_heartbeat_at, vehicle_id")
.eq("instructor_id", instructorId)
.order("is_active", { ascending: false })
.order("last_seen_at", { ascending: false });
```

### 2. Use the existing 4-state status logic

Extract the `getStatus()` helper from `useGPSConnectionStatus.ts` into a tiny shared util (`src/lib/gpsDeviceStatus.ts`) so both the dashboard hook and the settings panel agree. States:

- **Active** — moved in last 60s (green)
- **Recent** — moved in last 5 min (green)
- **Stationary** — heartbeat in last 2 min, no movement (blue) → this is what Ken's parked Charlotte should show when running
- **Offline** — no heartbeat & no movement (grey)

### 3. Render one card per device

For every row returned, show:

- Device name + provider badge (Radius / Geotab / GPSGate / Quartix / Phone)
- Status pill (Active / Recent / Stationary / Offline) with matching colour
- "Last update: 3 hours ago" (existing `formatDistanceToNow`)
- A small note when `is_active = false`: "Disabled by admin"
- Linked vehicle name (from `instructor_vehicles` join) when `vehicle_id` is set

If the device is offline but `is_active = true` and last seen within the last 24h, append the helper line: *"Tracker fitted — waiting for the vehicle to wake up."* This is the key UX fix that prevents users thinking the tracker has vanished.

### 4. Empty state

Only show "No trackers fitted yet — contact admin to add one" when the query returns **zero rows**. Today's UI shows that message implicitly any time `last_seen_at` is older than 2 minutes, which is wrong.

### 5. Keep the Phone/Hardware/Off device selector

The selector added in the previous turn stays exactly as-is; it sits **below** the new device list.

### 6. Test Connection button

Keep the existing `radius-poller` button; after it runs, re-fetch the device list (not just the single row) so a freshly-woken Radius tracker pops up immediately.

## Out of scope

- No DB changes — `gps_devices` already has every field we need.
- No admin panel changes — adding/removing devices stays in `AdminTrackersManager`.
- No mobile layout changes (per project rule).
- No edits to other consumers of `useGPSConnectionStatus` (FleetLiveMap, AccountHub, etc.); they already work correctly.

## Files touched

- `src/components/instructor/InstructorDetailsEditor.tsx` — replace single-status card with the new device list inside both the `defaultTab === "gps"` block and the `<TabsContent value="gps">` block.
- `src/lib/gpsDeviceStatus.ts` *(new)* — shared `getDeviceStatus(lastSeen, heartbeat)` returning `"active" | "recent" | "stationary" | "offline"`.
- `src/hooks/useGPSConnectionStatus.ts` — switch its inline `getStatus` to import from the new util (no behaviour change).
