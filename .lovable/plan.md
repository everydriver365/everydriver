

## Add Geotab Device for Kenneth Dufosse

### Overview
Insert a new GPS device record for Kenneth linking his Geotab unit (ID: `GAUU4BSZ9SK8`) to his instructor profile. No code changes are needed -- the existing geotab-poller will automatically pick up this device and start syncing position data.

### What Will Happen

1. **Insert a new row** into the `gps_devices` table with:
   - Instructor: Ken D (ID: `c9843b58-6edb-4b97-8238-65d725e30aea`)
   - Tracking provider: `geotab`
   - Geotab device ID: `GAUU4BSZ9SK8`
   - Device identifier: `geotab-GAUU4BSZ9SK8`
   - Device name: "Kenneth's Geotab"
   - Active: yes

2. **Automatic sync begins** -- the existing `geotab-poller` edge function (running every 10 seconds via cron) will detect this device and start fetching live position, speed, heading, ignition status, and dashcam media from the Geotab API.

3. **No code changes required** -- all infrastructure (poller, UI, realtime subscriptions) already supports Geotab devices.

### Technical Details

Single SQL INSERT into `gps_devices`:

```sql
INSERT INTO gps_devices (
  instructor_id,
  tracking_provider,
  geotab_device_id,
  device_identifier,
  device_name,
  is_active
) VALUES (
  'c9843b58-6edb-4b97-8238-65d725e30aea',
  'geotab',
  'GAUU4BSZ9SK8',
  'geotab-GAUU4BSZ9SK8',
  'Kenneth''s Geotab',
  true
);
```

