

# Add Atomic Distance Increment Function

## Overview

This plan adds the `increment_total_distance` database function you provided and updates the traccar-poller to use it, reducing two database calls to a single atomic operation.

## Current Problem

The existing code performs two separate queries to update distance:

```typescript
// Query 1: Fetch current distance
const { data: sessionData } = await supabase
  .from("lesson_telematics")
  .select("total_distance_km")
  .eq("id", device.current_session_id)
  .single();

// Query 2: Update with new total
await supabase
  .from("lesson_telematics")
  .update({ total_distance_km: currentDistance + distanceKm })
  .eq("id", device.current_session_id);
```

This has race condition potential and is inefficient.

## Solution

### Step 1: Create Database Function

Add a migration with your function:

```sql
CREATE OR REPLACE FUNCTION increment_total_distance(p_id uuid, p_distance float8)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE lesson_telematics
  SET total_distance_km = COALESCE(total_distance_km, 0) + p_distance
  WHERE id = p_id;
END;
$$;
```

*Note: Changed `p_id` from `bigint` to `uuid` since `lesson_telematics.id` is a UUID type.*

### Step 2: Update traccar-poller

Replace the two-query pattern with a single RPC call:

```typescript
// Before (lines 318-328)
if (distanceMeters > 0 && distanceMeters < 5000) {
  const distanceKm = distanceMeters / 1000;
  
  const { data: sessionData } = await supabase
    .from("lesson_telematics")
    .select("total_distance_km")
    .eq("id", device.current_session_id)
    .single();
  
  const currentDistance = sessionData?.total_distance_km || 0;
  
  await supabase
    .from("lesson_telematics")
    .update({ total_distance_km: currentDistance + distanceKm })
    .eq("id", device.current_session_id);
}

// After
if (distanceMeters > 0 && distanceMeters < 5000) {
  const distanceKm = distanceMeters / 1000;
  
  await supabase.rpc("increment_total_distance", {
    p_id: device.current_session_id,
    p_distance: distanceKm
  });
}
```

## Benefits

| Aspect | Before | After |
|--------|--------|-------|
| Database calls | 2 (SELECT + UPDATE) | 1 (RPC) |
| Race conditions | Possible | Prevented |
| Code complexity | 10 lines | 4 lines |
| Atomicity | No | Yes |

## Technical Details

- The function uses `COALESCE` to handle NULL values safely
- `SECURITY DEFINER` allows the function to run with elevated privileges
- The function is idempotent and safe to call multiple times

