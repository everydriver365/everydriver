
## Enable Automatic GPS Reconnection

This plan will make GPS connection more reliable by automatically reconnecting when the signal drops and reducing false "offline" warnings when the vehicle is parked.

---

### What You'll Get

1. **Auto-reconnect everywhere** - The home screen will now automatically try to reconnect if GPS drops
2. **Fewer false alarms** - The system will distinguish between "truly offline" and "parked/stationary"  
3. **Heartbeat tracking** - Even when not moving, the system will know the tracker is responding

---

### Changes Overview

**Database**
- Add a `last_heartbeat_at` column to track when we last heard from the device (separate from position updates)

**Backend Function (gpsgate-poller)**
- Update the heartbeat timestamp on EVERY poll, even when skipping position updates
- This means a parked vehicle will still show as "connected"

**Home Screen**
- Add auto-reconnect capability (currently only on Live Session page)
- Show reconnection status when attempting to restore connection

**Connection Status Logic**
- Relax the "active" threshold from 30 seconds to 60 seconds
- Use heartbeat time for connectivity, position time for freshness
- New "stationary" state for parked vehicles with live connection

---

### Technical Details

#### 1. Database Migration
```sql
ALTER TABLE gps_devices 
ADD COLUMN last_heartbeat_at TIMESTAMPTZ;
```

#### 2. Edge Function Update
When the poller decides to skip a position update (no movement), it will still update `last_heartbeat_at`:
```typescript
if (!hasMoved && !hasNewerTimestamp) {
  // Still update heartbeat to show device is responding
  await supabase.from("gps_devices")
    .update({ last_heartbeat_at: now.toISOString() })
    .eq("id", device.id);
}
```

#### 3. Connection Status Hook
Modify `useGPSConnectionStatus.ts` to:
- Read both `last_heartbeat_at` and `last_seen_at`
- Return `isStationary` boolean when heartbeat is fresh but position is stale
- Base "connected" status on heartbeat (2 min threshold)

#### 4. Home Screen Integration
Add `useGPSAutoReconnect` to `InstructorMobileHome.tsx` with visual feedback when reconnecting.

---

### Expected Outcome
- Connection will stay "green" when parked
- Automatic retry attempts when truly offline
- Less flickering between connected/offline states
- Clearer indication of what's actually happening
