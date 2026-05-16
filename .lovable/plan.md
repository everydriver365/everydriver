## Plan

1. **Fix the search guard in `useCourseDiscovery`**
   - Keep the current full-postcode geocoding path for valid postcodes.
   - If geocoding returns no location, extract the postcode district/outcode from the typed value.
   - If the outcode is valid, run the search anyway using the outcode as `searchedPostcode`, so matching placeholder instructors can appear.
   - Only show “Postcode not found” when no valid UK outcode can be extracted.

2. **Make placeholder matching independent of full geocoding**
   - Update the filtering logic so placeholder instructors can show when `searchedPostcode` exists, even if `userLocation` is unavailable.
   - Keep real instructors radius-based and only include them when coordinates exist.
   - Preserve the existing rule: placeholders only appear when there are no real instructor course results.

3. **Validate the WD17 case**
   - Test the deployed `geocode-postcode` function with `WD17 3XX`/`WD173XX`.
   - Confirm the database has WD17 manual and automatic placeholder instructors with active courses.
   - Verify the hook logic will produce enquiry-only WD17 fallback course cards rather than a not-found state.

## Technical detail

The backend function is already returning WD17 coordinates, and the database has WD17 placeholder instructors. The remaining issue is frontend state: several filters currently depend on `userLocation`, so if the browser/search path ever lacks coordinates, the placeholder fallback still gets blocked. The fix is to make postcode-district placeholders depend on `searchedPostcode`, not `userLocation`.