

# Add Greggs Category & Drive-Through Labels

## Changes

### 1. Frontend — `src/pages/InstructorFindNearby.tsx`
- Add a new **Greggs** tile to the `categories` array (e.g. `{ id: "greggs", label: "Greggs", icon: Coffee, color: "text-sky-700", bg: "bg-sky-600/12" }`).
- For **Greggs** and **Drive Through** results, add a "Drive Through" badge on result cards where the place name contains "drive through" or "drive-thru" (case-insensitive check on `place.name`). This is the best we can do since Google Places doesn't return a structured drive-through flag — the name/address often indicates it.

### 2. Edge Function — `supabase/functions/google-places-nearby/index.ts`
- Add `greggs: { keyword: "Greggs" }` to the `categoryMap`.
- Update `"drive-through"` keyword to `"drive through food Greggs"` so Greggs locations also appear in drive-through results, **or** keep it as `"drive through food"` since Greggs drive-throughs will naturally appear. Better approach: keep drive-through as-is since adding "Greggs" would skew results. Greggs drive-throughs will show in the Greggs tile with a label.

### 3. Drive-Through Label Logic
In the results list rendering, when `activeCategory` is `"greggs"` or `"drive-through"`, check if `place.name.toLowerCase()` includes `"drive"` or `"thru"` and show a small badge: `🚗 Drive Through`. This gives users a quick visual indicator.

### Summary
- 1 new category tile (Greggs)
- 1 new backend mapping
- Drive-through label badge on Greggs & Drive Through result cards

