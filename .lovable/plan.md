

## Geotab Data Audit — Issues Found

### Issue 1: CRITICAL — Poller crashes every poll cycle
**Error**: `ReferenceError: impactsInserted is not defined` (line 799/928)

The `impactsInserted` and `pushSent` variables are declared on lines 697-698 **inside** the `if (shouldSyncMedia)` block (line 694). But they're referenced on line 820 (log statement) and line 928 (response JSON) **outside** that block. When media sync is skipped (which is most polls — it only runs once per minute), these variables don't exist, causing the crash.

**Fix**: Move the impact detection block (lines 696-820) **before** the `if (shouldSyncMedia)` block. Impact detection should run every poll cycle, not just during media sync.

### Issue 2: Tire pressure values displayed raw (Pascals, not kPa)
The Geotab poller logs show values like `224000`, `236000`, `232000` for tire pressures. Geotab returns tire pressure in **Pascals**. The UI label says "kPa" but displays the raw value without dividing by 1000 — so it shows `224000 kPa` instead of `224 kPa` (or ~32 PSI).

**Fix in poller** (lines 556-559): Divide by 1000 when storing, or **fix in UI** (lines 287-301 of `EnhancedDeviceStatusCard.tsx`): Convert Pa → kPa or PSI for display. PSI is more familiar to UK users (divide by 6894.76).

### Issue 3: Fuel level percentage calculation may double-count
Line 531: `diagnosticsUpdate.last_fuel_percent = Math.round((rawFuel <= 1 ? rawFuel * 100 : rawFuel) * 100) / 100`

The logs show `DiagnosticFuelLevelId: 47.8362` — this is already a percentage (0-100 scale). The code checks if `rawFuel <= 1` to multiply by 100, but 47.8 is > 1 so it passes through correctly. This is fine for the current data, but edge cases at exactly 1.0 would be wrongly treated as a fraction.

### Issue 4: Odometer stored wrong — Geotab returns meters, not what code assumes
Line 550-551 comments say "Geotab returns odometer in meters" and divides by 1000. But the raw value logged is `25161236.136...`. If that's meters, the odometer would be 25,161 km (15,636 miles) — this looks plausible for a driving school car. This appears correct.

### Issue 5: Engine hours calculation
Line 547: Divides by 3600 (seconds → hours). Raw value is `2483768.276` = 689.9 hours. This seems reasonable. Correct.

### Issue 6: Battery voltage mapped from State of Charge
Line 536: `last_battery_voltage = Math.round(diags["DiagnosticStateOfChargeId"] * 100) / 100` — this sets voltage to the State of Charge percentage (90), not actual voltage. Line 539-541 overrides this if `DiagnosticBatteryVoltageId` exists. Since the logs don't show `DiagnosticBatteryVoltageId`, the UI would show `90.0V` as the battery voltage, which is wrong.

**Fix**: Don't set `last_battery_voltage` from StateOfCharge. Only set it from `DiagnosticBatteryVoltageId`.

### Summary of fixes

| # | Issue | File | Change |
|---|-------|------|--------|
| 1 | Poller crash — `impactsInserted` scoping | `geotab-poller/index.ts` | Move impact detection block outside `if (shouldSyncMedia)` |
| 2 | Tire pressure displayed in Pa not kPa | `geotab-poller/index.ts` | Divide raw values by 1000 when storing |
| 3 | Battery voltage = SoC percentage | `geotab-poller/index.ts` | Remove line 536, only set voltage from `DiagnosticBatteryVoltageId` |
| 4 | UI tire pressure label | `EnhancedDeviceStatusCard.tsx` | Change label to "PSI" and convert, since UK drivers use PSI |

### Desktop vs Mobile
Both mobile and desktop render the same components (`LiveTelemetryTab`, `EnhancedDeviceStatusCard`). The data issues above affect both equally — they're backend/data problems, not layout problems.

