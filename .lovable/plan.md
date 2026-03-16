

## Issue: Door Numbers Not Shown in Address Dropdown

### What's Happening
The HERE geocoding API (`geocode?qq=postalCode=...`) returns **street-level** results, not individual premises. So the dropdown shows entries like "High Street, Hedge End" without house numbers. The component already has a door number prompt that appears *after* selecting a street, but if the HERE results come back with empty `houseNumber` fields, the dropdown entries look incomplete.

### Solution
Two improvements:

**1. Switch to HERE's Browse endpoint for premise-level results**
The current endpoint (`geocode.search.hereapi.com/v1/geocode`) is designed for geocoding, not address enumeration. HERE's **Browse** endpoint (`browse.search.hereapi.com/v1/browse`) with `categories=700-7600` (addresses/buildings) and a location circle around the postcode centroid can return individual premises with house numbers.

Flow in `address-lookup/index.ts`:
- **Step 1**: Geocode the postcode to get lat/lng (current behaviour)
- **Step 2**: Use Browse API at that lat/lng with a small radius (~300m) and `categories=700-7600-7610` to get individual buildings/addresses
- Deduplicate and sort results by street then house number

**2. Ensure the door number prompt still works as fallback**
If Browse still returns some entries without house numbers (rural areas, new builds), the existing door number prompt after selection remains the safety net. No changes needed to the component — it already handles this correctly.

### Files to Change
- `supabase/functions/address-lookup/index.ts` — replace the single geocode call with a two-step geocode → browse flow for postcode mode

### No Component Changes Needed
The `PostcodeAddressLookup.tsx` component already maps `houseNumber` from the response and shows the door number prompt. Once the API returns premise-level data, the dropdown will naturally display house numbers.

