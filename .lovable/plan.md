

## Plan: Expand Geotab Telemetry + Video Replay Across All Views

This is a large feature set. I'll break it into manageable work streams.

### What's Being Added

From the previous conversation, these new Geotab data points need to be surfaced:
- **DTC Fault Codes** (via `FaultData` API)
- **Tyre Pressure** (`DiagnosticTirePressureId`)
- **Seatbelt Status** (`DiagnosticSeatbeltId`)
- **Brake Pedal Position** (`DiagnosticBrakePedalPositionId`)
- **Reverse Gear Detection** (`DiagnosticTransmissionCurrentGearId`)
- **Ambient Temperature** (`DiagnosticExternalTemperatureId`)
- **Posted Speed Limit vs Actual** (contextual speeding — e.g. "35 in a 30 zone")
- **Live Odometer & Engine Hours** (`DiagnosticOdometerReadingId`, `DiagnosticEngineHoursId`)
- **Video Replay** — playing back Geotab dashcam clips inline with trip data

These need to appear in **4 locations**: Geotab Hub (instructor), Vehicle Health page (instructor), Admin Geotab Fleet, and the instructor mobile app.

---

### Stream 1: Expand Edge Function — New Diagnostics

**File**: `supabase/functions/geotab-status-data/index.ts`

Add new entries to `DIAGNOSTIC_MAP`:
```
brakePedal, seatbelt, tyrePressure, ambientTemp, 
odometer, engineHours, reverseGear
```

**File**: `src/hooks/useGeotabStatusData.ts`

Expand `DiagnosticKey` type to include all new keys.

### Stream 2: DTC Fault Codes Edge Function

**New file**: `supabase/functions/geotab-fault-data/index.ts`

Calls Geotab `Get` with `typeName: "FaultData"` for a device + date range. Returns structured fault codes with descriptions, severity, and timestamps. This is a separate API from StatusData.

**New hook**: `src/hooks/useGeotabFaultData.ts`

### Stream 3: Video Replay Support

The dashcam gallery already downloads media via `geotab-media-download`. To support **inline video playback**:

**Update**: `src/components/instructor/dashcam/DashcamGalleryView.tsx`
- When a video clip is selected, attempt to stream it via the download edge function instead of just showing a thumbnail + download button
- Add an `<video>` element in the detail dialog that sources from the edge function URL
- Add a "Link to Trip" button that navigates to trip-replay with the clip's timestamp

**New component**: `src/components/instructor/dashcam/DashcamVideoPlayer.tsx`
- Handles loading state, error fallback, and controls
- Constructs the video source URL via `supabase.functions` invoke pattern

### Stream 4: New UI Components for Extra Diagnostics

**New file**: `src/components/instructor/geotab/GeotabExtendedDiagnosticsTab.tsx`
- Shows live gauges/cards for: Tyre Pressure, Seatbelt (on/off indicator), Brake Pedal %, Reverse Gear (engaged/not), Ambient Temp, Odometer, Engine Hours
- Uses `useGeotabStatusData` with the expanded diagnostic keys

**New file**: `src/components/instructor/geotab/GeotabFaultCodesTab.tsx`
- Lists active DTC codes with severity badges, descriptions, and timestamps
- Uses `useGeotabFaultData`

**New file**: `src/components/instructor/geotab/GeotabContextualSpeedTab.tsx`
- Shows speeding events with posted speed limit context (e.g. "52 km/h in a 48 km/h zone")
- Pulls from `telematics_alerts` where `speed_limit_kmh` is populated

### Stream 5: Integrate into Geotab Hub (Instructor)

**File**: `src/pages/InstructorGeotabHub.tsx`

Add 3 new tabs to the existing 11-tab layout:
- **Sensors** → `GeotabExtendedDiagnosticsTab`
- **Faults** → `GeotabFaultCodesTab` (with badge count for active faults)
- **Speeding** → `GeotabContextualSpeedTab`

Update the dashcam tab to use the new `DashcamVideoPlayer` for inline playback.

### Stream 6: Integrate into Vehicle Health Page (Instructor)

**File**: `src/pages/InstructorVehicleHealth.tsx`

The Vehicle Health page already has 8 tabs. Rather than adding more tabs, embed the new data into existing tabs:
- **Live tab**: Add tyre pressure, seatbelt, brake pedal, reverse gear indicators below the existing device cards
- **Fleet tab**: Show odometer and engine hours on each vehicle card
- **Service tab**: Show active DTC fault codes as alerts

### Stream 7: Integrate into Admin Geotab Fleet

**File**: `src/components/admin/AdminGeotabFleet.tsx`

Add new tabs alongside existing Devices/Trips/Dashcam:
- **Diagnostics** — fleet-wide sensor view (select instructor → show their extended diagnostics)
- **Faults** — fleet-wide active DTC codes across all devices
- **Behaviour** — reuse `GeotabDriverBehaviourTab` with instructor selector
- **Video** — dashcam with inline video player

### Stream 8: Database Migration

Add a `geotab_fault_codes` table to store polled DTC data:

```sql
CREATE TABLE public.geotab_fault_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES public.gps_devices(id) ON DELETE CASCADE,
  instructor_id UUID REFERENCES public.instructors(id),
  fault_code TEXT NOT NULL,
  description TEXT,
  severity TEXT DEFAULT 'medium',
  source TEXT DEFAULT 'geotab',
  detected_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.geotab_fault_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors see own faults" ON public.geotab_fault_codes
  FOR SELECT TO authenticated
  USING (instructor_id IN (
    SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Admins see all faults" ON public.geotab_fault_codes
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
```

### Summary of Files

| Action | File |
|--------|------|
| Edit | `supabase/functions/geotab-status-data/index.ts` — add 7 new diagnostic IDs |
| Create | `supabase/functions/geotab-fault-data/index.ts` — DTC fault code fetcher |
| Edit | `src/hooks/useGeotabStatusData.ts` — expand DiagnosticKey type |
| Create | `src/hooks/useGeotabFaultData.ts` |
| Create | `src/components/instructor/dashcam/DashcamVideoPlayer.tsx` |
| Edit | `src/components/instructor/dashcam/DashcamGalleryView.tsx` — inline video |
| Create | `src/components/instructor/geotab/GeotabExtendedDiagnosticsTab.tsx` |
| Create | `src/components/instructor/geotab/GeotabFaultCodesTab.tsx` |
| Create | `src/components/instructor/geotab/GeotabContextualSpeedTab.tsx` |
| Edit | `src/pages/InstructorGeotabHub.tsx` — add 3 tabs + video player |
| Edit | `src/pages/InstructorVehicleHealth.tsx` — embed new sensors into existing tabs |
| Edit | `src/components/admin/AdminGeotabFleet.tsx` — add Diagnostics, Faults, Behaviour, Video tabs |
| Migration | Create `geotab_fault_codes` table with RLS |

### Radius Note

All new components will check `tracking_provider === "geotab"` before rendering Geotab-specific features. Radius instructors will see a placeholder explaining that these features will be available when Radius integration is complete.

