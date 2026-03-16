
Root cause: the booking form is public, but the new Google-based address functions are not configured for public access.

What I found:
- `src/components/booking/PostcodeAddressLookup.tsx` now calls:
  - `postcode-address-lookup`
  - `google-places-details`
- The booking flow is used in public pages (`BookingSummary.tsx`, `MobileBookingView.tsx`), so these calls must work for anonymous visitors.
- `supabase/functions/postcode-address-lookup/index.ts` exists, but there are no runtime logs for it at all.
- `supabase/config.toml` includes `verify_jwt = false` for many public-facing functions, but it does not include:
  - `postcode-address-lookup`
  - `google-places-autocomplete`
  - `google-places-details`

Why you’re seeing “no addresses found”:
- Anonymous users on the booking page are likely being blocked before the function logic even runs.
- Because `postcode-address-lookup` is not marked public in the backend config, the request likely fails at the platform layer.
- In the component, any function failure falls into the generic error path and shows the same outcome as “no addresses found”.

Solution:
1. Mark the Google address lookup functions as public in backend config
   - Add `verify_jwt = false` for:
     - `postcode-address-lookup`
     - `google-places-autocomplete`
     - `google-places-details`
   - This matches how the rest of the public booking/payment functions are configured.

2. Keep the Google postcode lookup flow
   - No need to replace the postcode logic yet.
   - The current `postcode-address-lookup` strategy is reasonable enough to test once anonymous access is fixed.

3. Improve error handling in the booking component
   - Distinguish between:
     - “No addresses found”
     - “Lookup unavailable”
   - That way API/auth/config failures don’t look like empty search results.

4. Re-test the public booking page
   - Confirm a valid UK postcode triggers:
     - `postcode-address-lookup`
     - then `google-places-details` after selection
   - Check that function logs now appear.

Expected outcome:
- The postcode lookup should start returning addresses for public visitors instead of immediately failing into the empty-state path.
- If some postcodes still return sparse results, that would be a separate Google data-quality issue, but right now the first problem is access/configuration.

Technical details:
- Files to update:
  - `supabase/config.toml`
  - `src/components/booking/PostcodeAddressLookup.tsx`
- No database changes are needed.
- No new secrets are needed because `GOOGLE_PLACES_API_KEY` is already configured.
