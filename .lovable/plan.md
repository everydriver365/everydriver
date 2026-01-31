
# Fix Device Connection Status for Stationary Vehicles

## Problem
The "Device not connected" warning appears even when the GPS tracker is actively communicating, because `last_seen_at` only updates when processing NEW position data. When stationary, the Traccar server returns the same position repeatedly, which gets skipped, causing the timestamp to become stale.

## Current Behavior
```text
Traccar Server                traccar-poller                    Database
     │                              │                               │
     │ ──position(id=190)──────────▶│                               │
     │                              │ Skip: already processed       │
     │                              │ (last_seen_at NOT updated)    │
     │ ──position(id=190)──────────▶│                               │
     │                              │ Skip: already processed       │
     │                              │ (last_seen_at NOT updated)    │
     │                              │                               │
     │                              │     After 10+ seconds:        │
     │                              │     UI shows "Not Connected"  │
```

## Solution
Update `last_seen_at` even when skipping duplicate positions. This indicates "device is communicating" separately from "device has new position data."

## Files to Modify

### 1. supabase/functions/traccar-poller/index.ts

Add logic to update `last_seen_at` when the device is found but position is skipped:

**Before (lines 282-297):**
```typescript
// Check if we've already processed this position
if (device.last_traccar_position_id && pos.id <= device.last_traccar_position_id) {
  console.log(`[Traccar-Poller] Position ${pos.id} already processed for device ${uniqueId}`);
  skipped++;
  continue;
}

// Alternative: check by fixTime
if (device.last_traccar_fix_time) {
  const lastFixTime = new Date(device.last_traccar_fix_time).getTime();
  const currentFixTime = new Date(pos.fixTime).getTime();
  if (currentFixTime <= lastFixTime) {
    skipped++;
    continue;
  }
}
```

**After:**
```typescript
// Check if we've already processed this position
if (device.last_traccar_position_id && pos.id <= device.last_traccar_position_id) {
  console.log(`[Traccar-Poller] Position ${pos.id} already processed for device ${uniqueId}`);
  
  // Still update last_seen_at to indicate device is communicating
  await supabase
    .from("traccar_devices")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", device.id);
  
  skipped++;
  continue;
}

// Alternative: check by fixTime
if (device.last_traccar_fix_time) {
  const lastFixTime = new Date(device.last_traccar_fix_time).getTime();
  const currentFixTime = new Date(pos.fixTime).getTime();
  if (currentFixTime <= lastFixTime) {
    // Still update last_seen_at to indicate device is communicating
    await supabase
      .from("traccar_devices")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", device.id);
    
    skipped++;
    continue;
  }
}
```

## Result

After this change:
- `last_seen_at` updates every time the poller runs (every 10 seconds via frontend polling)
- The 10-second timeout in the UI will correctly show "connected" as long as the poller is running
- The device will only show "not connected" if the Traccar server stops returning positions entirely

## Technical Notes

- This is a minimal change that doesn't affect position processing logic
- The device update is lightweight (single field update)
- Maintains the distinction: `last_seen_at` = "when we last heard from device", `last_traccar_fix_time` = "when device last moved"
