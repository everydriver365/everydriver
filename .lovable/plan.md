

## Fix: Postcode Lookup Returns Only 3 Addresses Instead of All

### Root Cause
Google Places API is fundamentally not designed to enumerate all addresses in a UK postcode. Autocomplete + reverse geocode will never return the full 27 addresses for SO30 2TD. This is an API limitation, not a code bug.

### Solution
Switch the `PostcodeAddressLookup` component back to using the **HERE API** via the existing `address-lookup` edge function, which is purpose-built for postcode-to-address-list lookups and already returns up to 20 results per postcode. The `HERE_API_KEY` secret is still configured.

### Changes

**1. Update `src/components/booking/PostcodeAddressLookup.tsx`**
- Change the `lookupAddresses` function to call `address-lookup` instead of `postcode-address-lookup`
- Map the HERE response (which already returns `street`, `houseNumber`, `city`, `county`, `district`, `postcode`) directly into `AddressOption` — no placeId needed
- Remove the `google-places-details` call in `handleSelectAddress` since HERE returns complete address data upfront
- Remove the `sessionToken` state (no longer needed)
- Keep the door number prompt, manual entry fallback, and all UI behaviour unchanged

**2. Update `supabase/functions/address-lookup/index.ts`**
- Increase the `limit` parameter from 20 to 50 to capture larger postcodes
- Update CORS headers to match the standard pattern (add `x-supabase-client-platform` etc.)

**3. No other changes needed**
- The `address-lookup` function already has `verify_jwt = false` in config.toml (or we'll verify and add it if missing)
- The Google Places functions remain available for the admin `GoogleAddressAutocomplete` component

### Why This Works
HERE's geocoding API is designed for exactly this use case — given a UK postcode, return all known addresses. Google Places is designed for search/autocomplete of individual addresses, not enumeration.

