
# Fix GPSgate Instructor Username Matching

## Problem Identified
The poller only matches instructors who have a numeric `gpsgate_user_id` set. However, the UI allows entering a `gpsgate_username` (which you did - the UUID `d0208b56-7d25-4cd6-a828-9fedba7a29c2`). The poller ignores the username field, resulting in "0 instructors with GPSgate IDs".

## Solution
Update the `gpsgate-poller` edge function to:
1. Also fetch instructors with `gpsgate_username` (not just `gpsgate_user_id`)
2. Match the username against GPSgate users to auto-discover the numeric User ID
3. Persist the discovered User ID back to the database for future runs
4. Process the instructor's GPS data once matched

## Code Changes

### File: `supabase/functions/gpsgate-poller/index.ts`

**Change 1**: Update the instructor query (around line 473-477)
```typescript
// Current (broken):
.not("gpsgate_user_id", "is", null);

// Fixed:
.or("gpsgate_user_id.not.is.null,gpsgate_username.not.is.null");
```

**Change 2**: Add username-based matching logic (around line 480-490)
```typescript
// Build lookup by GPSgate user ID for instructors
const instructorsByGpsGateId = new Map<number, InstructorGPS>();
for (const i of instructorsWithGPS || []) {
  // If instructor has numeric ID, use it directly
  if (i.gpsgate_user_id) {
    instructorsByGpsGateId.set(i.gpsgate_user_id, i as InstructorGPS);
  } else if (i.gpsgate_username) {
    // Auto-discover numeric ID from username
    const normalizedUsername = normalizeText(i.gpsgate_username);
    const discoveredUserId = usernameToUserId.get(normalizedUsername);
    if (discoveredUserId) {
      instructorsByGpsGateId.set(discoveredUserId, i as InstructorGPS);
      // Persist discovered ID to database
      supabase
        .from("instructors")
        .update({ gpsgate_user_id: discoveredUserId })
        .eq("id", i.id);
      console.log(`[GPSgate-Poller] Auto-linked instructor ${i.id} username ${i.gpsgate_username} -> GPSgate user ${discoveredUserId}`);
    } else {
      console.log(`[GPSgate-Poller] Instructor ${i.id} username ${i.gpsgate_username} not found in GPSgate`);
    }
  }
}
```

## Expected Result After Fix

When you click "Test Connection" or the poller runs:
1. Poller finds your instructor record with `gpsgate_username = 'd0208b56-7d25-4cd6-a828-9fedba7a29c2'`
2. Matches it against GPSgate users to find the numeric User ID
3. Updates your instructor record with the discovered `gpsgate_user_id`
4. Fetches your latest GPS position from GPSgate
5. Updates `traccar_devices` table with your position (enabling "Connected" status)

## Implementation Steps

1. Update edge function query to include instructors with username only
2. Add username-to-ID resolution logic before the instructor processing loop
3. Persist auto-discovered IDs back to the database
4. Deploy updated edge function
