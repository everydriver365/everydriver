## Goal
Replace the static "OBD not connected" placeholder in the expanded Up next tile (Section 6 — Vehicle) with live data from the connected OBD device for this instructor's vehicle. No DB schema changes, no other screens touched.

## Data source
Use the existing `useVehicleHealth()` hook (already powering Vehicle Health screens). It returns `devices[]` from `gps_devices` with all the fields needed:
- `is_connected`, `last_seen_at`, `tracking_provider`
- `last_fuel_percent`, `last_battery_voltage`, `last_coolant_temp_c`
- `last_ecu_odometer_km`, `last_engine_hours`
- `last_tire_pressure_json` (PSI per corner — already imperial per project rules)
- `last_fault_codes[]` (with `code`, `description`, `severity`)
- `vehicle` (registration, make, model)

Verified live: instructor `c9843b58-…` has a Geotab device reporting fuel 47.84%, battery 90, coolant 85°C, odometer 42,982 km, 1 fault (P0B15), and tyre pressures 224–236.

## Device selection
Inside `UpNextExpanded`, pick the device to show in this priority:
1. A connected device whose `vehicle_id` matches the instructor's primary vehicle.
2. Otherwise, the most recently `last_seen_at` device with diagnostics (`last_diagnostics_at` not null).
3. Otherwise, fall back to the existing "OBD not connected" pill.

## UI changes (only inside Section 6 of `src/components/instructor/UpNextExpanded.tsx`)
Replace lines 720–737 with a connected-state card. Keep `SectionLabel`, `Divider`, paddings, fonts, and surrounding sections unchanged.

Connected card layout (single rounded-12 card, `BLUE_TINT` background, 10/12 padding, fontSize 12, two rows):

```text
[Car icon]  AB12 CDE · Ford Fiesta            ● Live
            Fuel 48% · Batt 12.5V · 85°C · 26,708 mi
            [P0B15 chip if fault, red tint]
```

Details:
- Convert km → miles using `* 0.621371` (project rule). Round to whole miles.
- Battery: prefer `last_battery_voltage` (e.g. "12.5V"); otherwise `last_battery_percent` ("90%").
- Coolant: only show if present (`°C`).
- Fuel: only show if `last_fuel_percent` not null.
- Tyre warning: if any value in `last_tire_pressure_json` is < 28 PSI or > 40 PSI, append a small "Tyre check" amber chip.
- Fault codes: render a single red-tint chip showing the count, e.g. `1 fault: P0B15` (tap → `/instructor/vehicle-health` via existing `useNavigate`). If 0 codes, omit.
- Live dot: green 6px circle if `is_connected`, otherwise grey + "Last seen Xm ago" using existing `formatDistanceToNow` style (already used elsewhere — import from `date-fns`).
- If no device matches, keep the existing grey "OBD not connected" pill (unchanged copy).

All colours via existing tokens (`BLUE_TINT`, `BLUE`, `MUTED`, `RED`, plus the established amber `#A66B00` already used by the notes card). No Tailwind classes — match the inline-style pattern of the rest of this file.

## Wiring
- Import `useVehicleHealth` at top of `UpNextExpanded.tsx`.
- Call once inside the component; derive `obdDevice` via the priority above (memoise inline with `useMemo`).
- No props added; no parent component (`MobileHomeRedesign`) changes required.

## Out of scope
- No changes to collapsed tile, map hero, ETA pill, avatar, other sections, schemas, or any other screen.
- No new edge functions; the hook already polls the existing `radius-poller`.
