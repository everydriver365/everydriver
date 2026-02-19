

# Fix Fault Code Display and Add Reset Capability

## Problem
The fault codes show "9 active faults" but each one displays as "Unknown fault" with generic codes (b1, b2, etc.) because the Geotab FaultData API returns nested objects that aren't being parsed correctly. Also, there's no way to dismiss/reset faults.

## Root Cause
The poller extracts fault data like this:
```
code: fault.code || fault.id          --> gets internal IDs like "b1"
description: fault.name || ...        --> fault.name doesn't exist, falls through to "Unknown fault"
severity: fault.failureModeId?.name   --> failureModeId is an object ref, .name isn't populated
source: fault.controller?.name        --> controller is a minimal object, .name isn't populated
```

Geotab's FaultData returns objects with **reference IDs** for `diagnostic`, `failureMode`, and `controller` -- the names aren't included in the Get response unless you separately fetch them. The actual DTC code must be derived from the `diagnostic.code` and `controller.id`.

## Solution

### 1. Poller: Better fault code extraction

Update the FaultData parsing in `geotab-poller/index.ts` to:
- Derive the OBD-II DTC prefix (P/B/C/U) from the controller ID
- Build the full DTC code from the diagnostic code (e.g. "P0301")
- Use `fault.diagnostic?.name` for description (Geotab often populates this)
- Use `fault.faultLampState` and `fault.severity` for severity level
- Use `fault.faultState` for active/inactive status
- Filter to only include active faults (state = "Active" or "Pending")
- Add the `fault.dateTime` so users know when it was detected

### 2. Poller: Clear faults when none are active

Currently, faults are only written when present -- they're never cleared. Add logic to set `last_fault_codes` to an empty array `[]` when no faults are found for a device, so stale faults don't persist forever.

### 3. Frontend: Show DTC code prominently

Update both `EnhancedDeviceStatusCard` and `CheckEngineBanner` to:
- Display the DTC code (e.g. "P0301") as a bold label
- Show the description next to it
- Show when the fault was first detected
- Add a "Clear All" button that resets `last_fault_codes` to `[]` in the database (manual acknowledgement, not an ECU reset)

### 4. Frontend: Add manual fault reset

Add a "Clear Faults" button on the Vehicle Health page that:
- Clears the `last_fault_codes` column to `[]` for the device
- Shows a toast confirming faults were cleared
- Includes a note that this only clears the display -- if the car still has active faults, they'll reappear on the next poll cycle

## Technical Details

### Files Modified

| File | Change |
|------|--------|
| `supabase/functions/geotab-poller/index.ts` | Fix FaultData parsing: derive DTC codes, use correct nested fields, clear stale faults |
| `src/components/instructor/vehicle-health/EnhancedDeviceStatusCard.tsx` | Show DTC code prominently, add "Clear Faults" button |
| `src/components/instructor/CheckEngineBanner.tsx` | Show DTC code in expanded fault list |
| `src/hooks/useVehicleHealth.ts` | Add `clearFaultCodes(deviceId)` function |

### Geotab FaultData field mapping (corrected)

```text
DTC Code    = prefix(fault.controller?.id) + hex(fault.diagnostic?.code)
Description = fault.diagnostic?.name || "Unknown"
Severity    = fault.severity || fault.faultLampState || "Unknown"  
Source       = fault.controller?.name || fault.diagnostic?.source || "ECU"
Detected At = fault.dateTime
Active       = fault.faultState !== "Inactive"
```

### DTC Prefix Logic
- ControllerObdPowertrainId / ControllerObdWwhPowertrainId = "P"
- ControllerObdBodyId / ControllerObdWwhBodyId = "B"  
- ControllerObdChassisId / ControllerObdWwhChassisId = "C"
- ControllerObdNetworkId / ControllerObdWwhNetworkId = "U"
- Fallback = "DTC"

