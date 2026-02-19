

# Add Geotab Engine Diagnostics to Vehicle Health

## What You'll Get

The Vehicle Health tab will show real engine data from your Geotab device:

- **Fuel Level** (%) with visual gauge
- **Battery Voltage** (12V system) with low-voltage warning
- **Engine Coolant Temperature** with overheat warning
- **Engine Hours** (total runtime)
- **ECU Odometer** (accurate mileage from the car's computer, not GPS estimates)
- **Tire Pressure** (if your vehicle supports it)
- **Active Fault Codes** (check engine light / DTCs) with severity and description

## How It Works

Geotab exposes this data through two APIs: `StatusData` (gauges/sensors) and `FaultData` (engine warnings). We'll batch these into the existing `ExecuteMultiCall` so it costs zero extra API calls against the rate limit.

## Implementation

### 1. Database: Add columns to `gps_devices`

New columns on the existing table:
- `last_fuel_percent` (numeric) -- fuel tank level
- `last_battery_voltage` (numeric) -- 12V battery
- `last_coolant_temp_c` (numeric) -- engine coolant celsius
- `last_engine_hours` (numeric) -- total engine hours
- `last_ecu_odometer_km` (numeric) -- ECU-reported odometer
- `last_tire_pressure_json` (jsonb) -- per-tire readings if available
- `last_fault_codes` (jsonb) -- array of active DTCs: `[{code, description, severity, source}]`
- `last_diagnostics_at` (timestamptz) -- when diagnostics were last updated

### 2. Geotab Poller: Fetch StatusData + FaultData

Add two more calls to the existing `ExecuteMultiCall` batch:

- **StatusData** with `DiagnosticSearch` filters for: `DiagnosticFuelLevelId`, `DiagnosticStateOfChargeId` (battery voltage), `DiagnosticEngineCoolantTemperatureId`, `DiagnosticEngineHoursAdjustmentId`, `DiagnosticOdometerAdjustmentId`, `DiagnosticTirePressureFrontLeftId` (and other tires)
- **FaultData** with `search.fromDate` set to last 24 hours to catch active faults

Write the parsed values into the new `gps_devices` columns.

### 3. Frontend: Update data model and UI

**`useVehicleHealth.ts`**: Add new fields to `GPSDeviceHealth` interface and SELECT query.

**`EnhancedDeviceStatusCard.tsx`**: Replace the placeholder `null` values with real data:
- Fuel level gauge with color coding (red < 15%, amber < 30%)
- Battery voltage display (warning below 12.0V)
- Coolant temperature (warning above 100C)
- ECU odometer in miles with today's distance calculation
- Engine hours formatted as "XXXh XXm"
- Active fault codes section with severity badges (red/amber/info)

**`VehicleHealthStrip.tsx`** (dashboard widget): Add fuel level to the 4-metric grid, replacing the generic "Last Seen" tile when fuel data is available.

### 4. Files Modified

| File | Change |
|------|--------|
| New migration SQL | Add 8 diagnostic columns to `gps_devices` |
| `supabase/functions/geotab-poller/index.ts` | Add StatusData + FaultData to ExecuteMultiCall batch, write results to DB |
| `src/hooks/useVehicleHealth.ts` | Add new fields to interface and query |
| `src/components/instructor/vehicle-health/EnhancedDeviceStatusCard.tsx` | Display fuel, voltage, coolant, odometer, engine hours, fault codes |
| `src/components/instructor/VehicleHealthStrip.tsx` | Show fuel level in dashboard strip |

### 5. Rate Limit Impact

The poller currently makes 1 HTTP request per poll (ExecuteMultiCall with N+1 methods). Adding StatusData and FaultData adds just 2 more methods to the same batch call -- still 1 HTTP request total, well within the 10 calls/minute limit.

