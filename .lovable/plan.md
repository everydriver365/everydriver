

## Remove "No recent updates" banner from live tracking page

The banner at lines 811-839 in `InstructorLiveSession.tsx` shows when `!isConnected` is true, displaying "No recent GPS updates" (or "Reconnecting..." during retry). This entire banner block will be removed.

### File Changed
- `src/pages/InstructorLiveSession.tsx` — Remove the stale data banner block (lines 810-840), which includes the "No recent GPS updates" message and reconnect UI.

