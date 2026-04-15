

## Speed Up Live Map Updates

### Current Pipeline & Latencies
```text
Radius API → radius-poller (pg_cron ~5s) → gps_devices table → Client poll (2s) + Realtime → Map
                                                                 ↑
                                                         Vehicle Health also triggers
                                                         radius-poller directly (10s/30s)
```

Worst-case end-to-end: **~7s** (5s cron gap + 2s client poll gap).

### Proposed Change: Client-triggered polling on the tracking page

Instead of relying solely on pg_cron, have `InstructorLiveSession.tsx` directly invoke the `radius-poller` edge function every **2 seconds** while on the tracking page (the same pattern Vehicle Health already uses). This collapses the pipeline:

```text
Client triggers radius-poller (2s) → gps_devices updated → Realtime fires instantly → Map
```

Worst-case drops to **~2-3s**.

### Implementation

**1. Add direct poller trigger to `InstructorLiveSession.tsx`**
- When a session is active or the page is open, call `supabase.functions.invoke("radius-poller")` every 2 seconds
- Stop on unmount or when no device is selected
- This replaces reliance on the background cron for live tracking scenarios

**2. Keep existing Realtime subscription as primary update path**
- The Realtime `UPDATE` channel on `gps_devices` already fires instantly when the poller writes — this becomes the main update mechanism
- Reduce the fallback `setInterval(pollDevice)` from 2s to 5s (it's just a safety net now)

**3. No backend changes needed**
- `radius-poller` already handles concurrent invocations safely
- pg_cron continues running for background updates when the page isn't open

### Impact
- Live map updates go from ~5-7s to ~2-3s
- No new edge functions or database changes
- Minimal extra load — one additional edge function call per 2s per active instructor viewing the tracking page

