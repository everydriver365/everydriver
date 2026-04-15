

# Extract OBD-II Data from Radius Export Stream

## What's happening

Your Radius device ("Charlotte") **is** an OBD unit and the Export Stream sends `telemetry`, `counters`, and `io` objects with every update — but the `radius-poller` edge function currently only extracts **two fields**: `telemetry.odometer` and `telemetry.ignition`. All other OBD data is being discarded.

The raw payload (truncated in logs at 500 chars) includes keys like `telemetry`, `counters`, and `io` that likely contain fuel level, coolant temperature, battery voltage, engine hours, and possibly DTC fault codes — depending on what the vehicle's ECU exposes through the OBD-II port.

## Plan

### Step 1 — Log full OBD payload (diagnostic deploy)
Add temporary detailed logging to the `radius-poller` to capture the full `telemetry`, `counters`, and `io` objects:
```js
console.log("[OBD] telemetry:", JSON.stringify(item.telemetry));
console.log("[OBD] counters:", JSON.stringify(item.counters));
console.log("[OBD] io:", JSON.stringify(item.io));
```
This tells us exactly which OBD PIDs your device reports.

### Step 2 — Extract OBD fields in the poller
Based on common KT Export Stream field names, extend the `NormalisedPosition` type and extraction logic to capture:

| Field | Likely KT path | DB column |
|-------|---------------|-----------|
| Fuel level % | `telemetry.fuel` or `io.fuel_level` | `last_fuel_percent` |
| Coolant temp °C | `telemetry.coolant_temp` or `io.coolant` | `last_coolant_temp_c` |
| Battery voltage | `telemetry.battery` or `telemetry.ext_voltage` | `last_battery_voltage` |
| Engine hours | `telemetry.engine_hours` or `counters.engine_hours` | `last_engine_hours` |
| DTC fault codes | `telemetry.dtc` or `io.dtc_codes` | `last_fault_codes` |

### Step 3 — Write OBD data to `gps_devices`
Update the DB write block (line ~541) to include the new fields when they're present:
```js
...(fuel != null ? { last_fuel_percent: fuel } : {}),
...(coolant != null ? { last_coolant_temp_c: coolant } : {}),
...(voltage != null ? { last_battery_voltage: voltage } : {}),
```

### Step 4 — Update TelematicsTile for GPS-only fallback
When OBD data is still null (e.g. vehicle ECU doesn't expose certain PIDs), show GPS-relevant metrics (device battery %, speed, odometer) instead of blank dashes.

## Approach
I'll deploy Step 1 first, check the logs to see the exact field names from your device, then wire up Steps 2-4 with the correct paths. This avoids guessing field names.

