

## Enrich Tracking Page with Radius Data

### The Reality

The Radius app (Kinesis / Velocity Fleet) cannot be embedded or auto-logged-into — this was already discussed. Their portal requires separate credentials and doesn't support SSO or iframe embedding.

However, the real problem is that **we're throwing away data the Radius API already sends us**. The KT Export Stream includes odometer, driver behaviour events, fuel data, and more — but the poller only stores speed, heading, road name, and ignition. The `gps_devices` table already has columns for `last_ecu_odometer_km`, `last_fuel_percent`, `last_battery_voltage`, `last_coolant_temp_c`, and `last_engine_hours` — they're just never populated for Radius devices.

### Plan

**1. Capture more data in the radius-poller edge function**
- Extract `telemetry.odometer` / `telemetry.odo_counter` and store it in `last_ecu_odometer_km`
- Extract `telemetry.battery` / `telemetry.ext_voltage` and store in `last_battery_voltage`
- Extract any fuel/temperature data if the KT stream provides it
- Log the full telemetry object once to discover exactly what fields Charlotte's tracker sends

**2. Enrich the GPSStatusHero card**
- Add odometer reading (daily distance driven = current odometer minus `daily_start_ecu_odometer_km`)
- Add ignition status indicator (engine on/off icon)
- Show vehicle registration if available

**3. Add a "View in Radius Portal" convenience link**
- Small external link button when provider is "radius"
- Opens `https://www.velocityfleet.com/app/telematics/livemap` in a new tab
- User logs in manually — but it's one tap away

**4. Fix the failing legacy fallback (bonus)**
- The Radius account is currently blocked from too many failed login attempts. The poller should skip legacy credential login when the Export Stream is the primary source, to stop hammering the login endpoint and getting blocked.

### Technical Details

- The `radius-poller` already parses `telemetry.odometer` but doesn't write it to `gps_devices` — just needs one line in the update query
- No database migration needed — all columns already exist
- The GPSStatusHero will get 2-3 new optional props (odometer, ignition) with graceful fallback
- The portal link is a simple `<a>` with `target="_blank"`

