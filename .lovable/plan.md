

## Plan: Add Contextual Speeding Tab to Vehicle Health + Convert to MPH

### Current State
- `GeotabContextualSpeedTab` already exists and works — shows speeding events with posted speed limit context
- It's already integrated in the **Geotab Hub** and **Admin Fleet** pages
- It's **missing** from the **Vehicle Health** `LiveTelemetryTab`
- The component displays km/h but this is a UK driving school app — should show **mph**

### Changes

#### 1. Add "Speeding" sub-tab to LiveTelemetryTab

**File**: `src/components/instructor/vehicle-health/LiveTelemetryTab.tsx`

- Import `GeotabContextualSpeedTab`
- Add `"speeding"` to the `activeSubTab` type union
- Add a new `TabsTrigger` for "Speeding" (gated on `hasGeotab`)
- Add corresponding `TabsContent` rendering `<GeotabContextualSpeedTab />`

#### 2. Convert GeotabContextualSpeedTab to show mph

**File**: `src/components/instructor/geotab/GeotabContextualSpeedTab.tsx`

- Convert `speed_kmh`, `speed_limit_kmh`, and `speed_delta` to mph (× 0.621371) for display
- Change labels from "km/h" to "mph"
- E.g. "35 mph in a 30 mph zone" instead of "56 km/h in a 48 km/h zone"

### Files

| Action | File |
|--------|------|
| Edit | `src/components/instructor/vehicle-health/LiveTelemetryTab.tsx` — add Speeding tab |
| Edit | `src/components/instructor/geotab/GeotabContextualSpeedTab.tsx` — convert to mph |

