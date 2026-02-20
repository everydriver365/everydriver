

## Fix Battery Indicator

### Problem
The battery indicator always shows "--" because the Geotab poller never writes to `last_battery_percent` or the `gps_battery_history` table. The car's 12V battery data IS being fetched from Geotab (via `DiagnosticStateOfChargeId`) and stored in `last_battery_voltage`, but the UI reads from the wrong column.

### Solution

**1. Map Geotab battery data to the correct fields in the poller**

In `supabase/functions/geotab-poller/index.ts`:
- Use `DiagnosticStateOfChargeId` (State of Charge %) to populate `last_battery_percent` as well (it's a percentage, not voltage)
- Also fetch the actual 12V battery voltage using `DiagnosticBatteryVoltageId` for `last_battery_voltage`
- After updating `gps_devices`, insert a row into `gps_battery_history` with the current battery percent for historical tracking

**2. Add `DiagnosticBatteryVoltageId` to the Geotab diagnostic fetch**

The poller currently fetches several diagnostics but may not include the true battery voltage diagnostic. We'll add it to the diagnostics list so we get both:
- State of Charge (%) -> `last_battery_percent`
- Battery Voltage (V) -> `last_battery_voltage`

**3. Write battery history records**

After each poll, if `last_battery_percent` has a value, insert a record into `gps_battery_history` so the Battery History chart has data to display.

### Technical Details

**Edge function change** (`supabase/functions/geotab-poller/index.ts`):

```
// In the diagnostics mapping section:
if (diags["DiagnosticStateOfChargeId"] != null) {
  // State of Charge is a percentage (0-100), not voltage
  diagnosticsUpdate.last_battery_percent = Math.round(diags["DiagnosticStateOfChargeId"]);
  diagnosticsUpdate.last_battery_voltage = Math.round(diags["DiagnosticStateOfChargeId"] * 100) / 100;
}

// Add true 12V voltage if available
if (diags["DiagnosticBatteryVoltageId"] != null) {
  diagnosticsUpdate.last_battery_voltage = Math.round(diags["DiagnosticBatteryVoltageId"] * 100) / 100;
}
```

After the device update, insert battery history:
```
// Write battery history if we have a percent value
const batteryPct = diagnosticsUpdate.last_battery_percent;
if (batteryPct != null) {
  await supabase.from("gps_battery_history").insert({
    device_id: device.id,
    battery_percent: batteryPct,
  });
}
```

Also ensure `DiagnosticBatteryVoltageId` is included in the list of diagnostics requested from the Geotab API.

**No UI changes needed** -- the existing components already read `last_battery_percent` and query `gps_battery_history` correctly. Once data flows, everything will work.
