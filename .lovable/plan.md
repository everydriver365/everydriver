

# Fix Rork Database Access — Add Missing Anon RLS Policies (Batch 2)

## Root Cause

Rork connects with the Supabase **anon key** and no authenticated session. Tables without an explicit `anon SELECT` policy return **empty arrays** silently — no errors, just no data. This is why features appear "broken" even though the code is correct.

### Already covered (20 tables)
`scheduled_lessons`, `pupils`, `payment_history`, `mileage_logs`, `instructor_expenses`, `instructor_todos`, `clock_entries`, `lesson_telematics`, `telematics_alerts`, `telematics_gps_points`, `live_pupil_positions`, `conversations`, `messages`, `gps_devices`, `geotab_driver_events`, `geotab_fuel_usage`, `geotab_