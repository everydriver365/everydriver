
Root cause: the current checkout postcode lookup is using Google Places Autocomplete as if it were a postcode-to-address-list service, but Google Autocomplete does not reliably return individual premises for a bare UK postcode.

What I found:
- `src/components/booking/PostcodeAddressLookup.tsx` sends only the postcode to `google-places-autocomplete` and expects a ready-made address list.
- `supabase/functions/google-places-autocomplete/index.ts` either uses `types=address` for normal input or no `types` filter for postcodes.
- Even with that change, Google often treats a postcode as a geocode/area lookup, not a “show me every property in this postcode” lookup.
- So the UI ends up with either zero predictions or non-premise results, which is why you see “no addresses found”.

Why this is happening:
- A UK postcode is not enough for Google Autocomplete to consistently return house-by-house addresses.
- The current flow has no fallback step to turn a postcode into a location and then fetch nearby premises.
- In other words, the integration changed provider, but not the lookup strategy.

Plan to fix:
1. Update the backend lookup strategy for postcode searches:
   - First detect postcode input.
   - For postcodes, use a postcode-friendly Google search flow instead of plain autocomplete-only behavior.
   - Prefer `geocode`-style lookup for the postcode, then use that result to fetch nearby address candidates.

2. Return better address candidates to the checkout:
   - Normalize Google results into the existing `AddressOption` shape.
   - Filter out overly broad results like just the postcode or town-only matches.
   - Deduplicate and sort the list before returning it.

3. Keep the current checkout UI pattern:
   - Preserve the existing “Find Address” button.
   - Keep the dropdown and manual entry fallback.
   - Keep the door/property name prompt after selection.

4. Add debugging so this doesn’t stay opaque:
   - Log the postcode input, Google status, and number/type of results returned.
   - This will let us confirm whether Google is returning zero results, broad geocodes, or malformed data.

Technical details:
- Files likely involved:
  - `supabase/functions/google-places-autocomplete/index.ts`
  - `src/components/booking/PostcodeAddressLookup.tsx`
- Most likely implementation direction:
  - If input matches UK postcode regex, do not rely on autocomplete alone.
  - Use a postcode geocode step, then a nearby/address discovery step.
  - Only fall back to raw autocomplete for non-postcode address typing.
- No database changes are needed.

Expected outcome:
- Entering a valid postcode should show a dropdown of selectable addresses instead of “no addresses found”.
- If Google still cannot provide enough granularity for a specific postcode, the fallback will remain manual entry rather than a broken empty state.
