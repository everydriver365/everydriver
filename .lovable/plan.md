
# Fix: `quartix-route` Edge Function — `rawHops.map is not a function`

## Problem
The trip replay page at `/instructor/trip-replay/:id` fails with "Failed to load trip data". The `quartix-route` edge function crashes on line 97-99 because `routeJson.Data` is not an array -- it's likely an object with a nested structure (e.g., `Data.Hops` or `Data.Route`), unlike the `vehicles/trips` and `vehicles/live` endpoints which return `Data` as a flat array.

## Root Cause
Line 97 assumes `Data` is always an array:
```typescript
const rawHops = routeJson?.Data || [];
const route = rawHops.map(...)  // crashes if Data is an object
```

## Solution

### File: `supabase/functions/quartix-route/index.ts`

1. **Add debug logging** to capture the actual Quartix response structure (keys of `Data`, type, etc.)

2. **Handle multiple possible response formats** for `Data`:
   - If `Data` is already an array, use it directly (current assumption)
   - If `Data` is an object, look for nested arrays in common Quartix property names: `Data.Hops`, `Data.Route`, `Data.Points`, or iterate object values for the first array found
   - If `Data` is null/undefined, return empty route gracefully instead of crashing

3. **Add `Array.isArray` guard** before calling `.map()` to prevent the TypeError

Updated logic (replacing lines 96-98):
```typescript
const routeJson = await routeRes.json();
console.log("[QuartixRoute] Response keys:", JSON.stringify(Object.keys(routeJson || {})));
console.log("[QuartixRoute] Data type:", typeof routeJson?.Data, 
  Array.isArray(routeJson?.Data) ? "array" : "not-array",
  routeJson?.Data ? JSON.stringify(Object.keys(routeJson.Data)).substring(0, 200) : "null");

// Extract hops array - handle multiple possible response structures
let rawHops: any[] = [];
const data = routeJson?.Data;

if (Array.isArray(data)) {
  rawHops = data;
} else if (data && typeof data === "object") {
  // Try known nested properties
  const nested = data.Hops || data.Route || data.Points || data.Items;
  if (Array.isArray(nested)) {
    rawHops = nested;
  } else {
    // Last resort: find the first array value in the object
    for (const val of Object.values(data)) {
      if (Array.isArray(val) && val.length > 0) {
        rawHops = val;
        break;
      }
    }
  }
}

if (rawHops.length === 0) {
  console.log("[QuartixRoute] No hops found. Full response sample:", 
    JSON.stringify(routeJson).substring(0, 500));
}
```

This will:
- Fix the crash immediately by guarding against non-array `Data`
- Log the actual response structure so we can see exactly what Quartix returns
- Automatically extract hops from nested structures
- Return an empty route gracefully if no data found (the client already handles this case)
