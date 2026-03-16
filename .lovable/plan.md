

## Integrate Ideal Postcodes for Full UK Address Lookup

### Problem
HERE API's Browse endpoint doesn't return individual premises with door numbers for UK postcodes. Ideal Postcodes uses Royal Mail PAF data and returns every registered address.

### Plan

**1. Add `IDEAL_POSTCODES_API_KEY` secret**
- Use the `add_secret` tool to request the API key from the user
- Ideal Postcodes provides keys at https://ideal-postcodes.co.uk

**2. Update `supabase/functions/address-lookup/index.ts`**
- Replace the HERE API postcode lookup with Ideal Postcodes API
- Endpoint: `GET https://api.ideal-postcodes.co.uk/v1/postcodes/{postcode}?api_key={key}`
- Map response fields: `line_1`, `line_2`, `line_3`, `post_town`, `county`, `postcode` → current `AddressOption` shape (`label`, `street`, `houseNumber`, `city`, `county`, `postcode`, `district`)
- Keep the HERE autocomplete mode (Mode 2) for free-text address search unchanged
- Sort results by `building_number` then `building_name`

**3. No changes to `PostcodeAddressLookup.tsx`**
- The component already maps `houseNumber`, `street`, `city`, etc. from the edge function response
- Door number prompt and manual entry fallback remain as-is

### API Response Mapping
Ideal Postcodes returns fields like:
```
building_number → houseNumber
thoroughfare → street
post_town → city
county → county
district (from dependent_locality or double_dependent_locality)
line_1 + line_2 + line_3 + post_town → label
```

Each result is a unique premise (flat, house, business) — exactly what's needed.

### Files Changed
- `supabase/functions/address-lookup/index.ts` — replace HERE postcode logic with Ideal Postcodes call

