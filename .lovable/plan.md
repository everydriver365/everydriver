

# Remove All Traccar References

Traccar was never properly integrated — the edge functions fail, no `traccar_devices` table exists, and the actual GPS tracking runs entirely through **Quartix sync** and the `gps_devices` table. This plan removes all Traccar-specific code and renames remaining references to generic "GPS Tracking" terminology.

---

## What Will Be Removed

### Edge Functions (delete entirely)
- `supabase/functions/traccar-poller/` — non-functional, references missing tables
- `supabase/functions/traccar-webhook/` — unused webhook handler

### Components
- `src/components/admin/TraccarStatusPanel.tsx` — rename to `GPSStatusPanel` and remove all "Traccar" text labels

### CSS/Marker Classes
- Rename CSS classes like `.traccar-car-marker` and `.traccar-marker-icon` in `LiveTrackingMap.tsx` to generic names (e.g., `.gps-car-marker`)

---

## What Will Be Renamed (Traccar to GPS/Tracking)

### Routes in `App.tsx`
- `/instructor/traccar` stays as the path (to avoid breaking bookmarks) but all visible "Traccar" labels removed
- `/instructor/settings/traccar` same approach

### Navigation & UI Labels (text changes only)
| File | Change |
|------|--------|
| `InstructorBottomNav.tsx` | Path already generic ("Track") — no change needed |
| `CommandPalette.tsx` | Remove "traccar" from keywords |
| `HomeQuickActions.tsx` | Route stays, label already "Track Live" |
| `QuickActionsFAB.tsx` | Route stays, label already "Track Live" |
| `FloatingSessionBar.tsx` | Route reference stays |
| `InstructorMenu.tsx` | Change gateKey from "traccar" to "tracking" |
| `TodayRouteMiniMap.tsx` | Route reference stays |
| `InstructorSettings.tsx` | Change tile id from "traccar" to "gps-device", remove "Traccar" text |
| `AdminSettingsGrid.tsx` | Import renamed component |
| `TraccarStatusPanel.tsx` | Rename file, change title to "Live GPS Tracking" |

### Hooks & Types
- `useGPSConnectionStatus.ts` — remove the `useTraccarConnectionStatus` alias export
- `useVehicleHealth.ts` — remove the `TraccarDeviceHealth` alias, use `GPSDeviceHealth` directly
- Update all files importing `TraccarDeviceHealth` to use `GPSDeviceHealth`

### Pages
- `InstructorGPSSetup.tsx` — rename `InstructorTraccarSetup` function to `InstructorGPSSetup`, rename internal `TraccarDevice` interface to `GPSDevice`
- `InstructorLiveSession.tsx` — update route references in navigate calls from "traccar" to "tracking" (or keep path but remove label text)
- `InstructorVehicleHealth.tsx` — update imports to `GPSDeviceHealth`

### Component Files
- `LiveTrackingMap.tsx` — rename `TraccarLiveMapProps` to `LiveMapProps`, rename CSS classes
- `DeviceStatusCard.tsx` — update `TraccarDeviceHealth` import
- `LinkDeviceDialog.tsx` — update `TraccarDeviceHealth` import
- `LiveTelemetryTab.tsx` — update `TraccarDeviceHealth` import
- `EnhancedDeviceStatusCard.tsx` — update `TraccarDeviceHealth` import

---

## Technical Details

- **No database changes needed** — there are no `traccar_*` tables; everything uses `gps_devices`
- **No Quartix changes** — the working Quartix sync remains completely untouched
- **Edge functions** `traccar-poller` and `traccar-webhook` will be deleted from deployment
- **Route paths** like `/instructor/traccar` will be updated to `/instructor/tracking` across all navigation references for consistency
- Approximately **25 files** will be touched, mostly for find-and-replace of type names and labels

