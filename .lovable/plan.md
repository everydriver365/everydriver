
## Show Fault Code Meanings

### Problem
Currently, fault codes from Geotab are stored with raw values like `"b9"` and `"Unknown fault"` as the description. The Geotab API returns minimal metadata, so we need to properly format the DTC codes and provide human-readable descriptions.

### Solution

**1. Improve fault code formatting in the poller** (`supabase/functions/geotab-poller/index.ts`)

Update the FaultData processing (lines 330-340) to:
- Map the Geotab `controller.name` to the standard OBD-II prefix: **P** (Powertrain), **B** (Body), **C** (Chassis), **U** (Network/Communication)
- Format the raw code as a proper 4-digit hex DTC (e.g., raw `"b9"` becomes `"P00B9"`)
- Add a lookup table of ~60 common OBD-II fault codes with plain-English descriptions (e.g., `P0301` = "Cylinder 1 misfire detected")
- Fall back to the Geotab-provided name if the code isn't in our lookup table, and only show "Unknown fault" as a last resort

**2. Update the UI to display code + meaning together**

In both `CheckEngineBanner.tsx` and `EnhancedDeviceStatusCard.tsx`:
- The fault code badge already shows (added previously) -- no change needed there
- The description text already renders `fault.description` -- once the poller writes better descriptions, these will show automatically

### Technical Details

**Edge function change** (`supabase/functions/geotab-poller/index.ts`):

Add a DTC lookup map and formatting helper before the fault processing loop:

```typescript
// Common OBD-II DTC descriptions
const DTC_DESCRIPTIONS: Record<string, string> = {
  "P0100": "Mass air flow sensor circuit malfunction",
  "P0101": "Mass air flow sensor range/performance",
  "P0171": "System too lean (Bank 1)",
  "P0172": "System too rich (Bank 1)",
  "P0300": "Random/multiple cylinder misfire",
  "P0301": "Cylinder 1 misfire detected",
  "P0420": "Catalyst system efficiency below threshold",
  "P0442": "Evaporative emission system leak (small)",
  "P0455": "Evaporative emission system leak (large)",
  "P0500": "Vehicle speed sensor malfunction",
  // ... ~50 more common codes
};

function formatDTC(rawCode: string, controllerName: string): string {
  const prefix = controllerName?.toLowerCase().includes("body") ? "B"
    : controllerName?.toLowerCase().includes("chassis") ? "C"
    : controllerName?.toLowerCase().includes("network") ? "U"
    : "P"; // default Powertrain
  const hex = parseInt(rawCode, 16);
  if (isNaN(hex)) return rawCode.toUpperCase();
  return prefix + hex.toString(16).toUpperCase().padStart(4, "0");
}
```

Then update the fault mapping:

```typescript
const dtcCode = formatDTC(fault.code || fault.id, fault.controller?.name);
deviceFaults.get(faultDeviceId)!.push({
  code: dtcCode,
  description: DTC_DESCRIPTIONS[dtcCode] 
    || fault.name 
    || fault.diagnostic?.name 
    || "Unrecognised fault - consult mechanic",
  severity: fault.failureModeId?.name || fault.severity || "Unknown",
  source: fault.controller?.name || fault.source || "ECU",
});
```

**No UI changes needed** -- both `CheckEngineBanner` and `EnhancedDeviceStatusCard` already render `fault.code` as a badge and `fault.description` as text. Once the poller writes properly formatted codes and descriptions, the UI will display them automatically.

### Files to modify
- `supabase/functions/geotab-poller/index.ts` -- Add DTC formatter, lookup table, and update fault processing
