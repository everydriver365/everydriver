

# Replace All Address Inputs with Google Address Lookup

## Summary

Three files still use non-Google address entry. This plan replaces them all with the existing `GoogleAddressAutocomplete` component, which uses the Google Places API via the `google-places-autocomplete` and `google-places-details` edge functions already deployed.

## What Changes

### 1. AddLessonSheet.tsx (Instructor Add Lesson)

Currently uses HERE API (`address-lookup` edge function) with a two-step flow: type postcode, then pick from a dropdown. This will be replaced with `GoogleAddressAutocomplete` for both:
- **Existing pupil pickup address** (lines ~420-458) -- replace the PostcodeAutocomplete + address dropdown with a single `GoogleAddressAutocomplete` field
- **New pupil address** (lines ~529-567) -- same replacement

Remove: `address-lookup` invocations, `addressOptions` state, `loadingAddresses`, `fetchAddresses`, `handleAddressSelect` logic, and the `PostcodeAutocomplete` import (if no longer used).

### 2. BespokeBookingModal.tsx (Admin Bespoke Booking)

Currently uses HERE API for both postcode lookup and address autocomplete. Replace:
- **Address field** (lines ~337-375) -- swap the manual `<Input>` with HERE autocomplete for a `GoogleAddressAutocomplete` that auto-fills the postcode field when an address is selected
- **Postcode lookup button** (lines ~378-388) -- remove the manual lookup button; the postcode auto-populates from the Google address selection

Remove: `lookupPostcode`, `handleAddressAutocomplete`, `selectAddress`, `addressSuggestions`, `showSuggestions`, `debounceRef`, and the HERE function invocations.

### 3. StepLocation.tsx (Instructor Onboarding)

Currently a plain `<Input>` for postcode. Replace with `PostcodeAutocomplete` component (which uses postcodes.io and is the correct tool for postcode-only entry with suggestions). This is a postcode field, not a full address, so `PostcodeAutocomplete` is the right fit.

## Technical Details

- **No new edge functions needed** -- `google-places-autocomplete` and `google-places-details` are already deployed with the `GOOGLE_PLACES_API_KEY` secret configured
- **No new dependencies** -- `GoogleAddressAutocomplete` component already exists at `src/components/admin/GoogleAddressAutocomplete.tsx`
- **Postcode auto-fill** -- The `GoogleAddressAutocomplete` component supports `onPostcodeChange` callback which will be used to auto-populate postcode fields when an address is selected
- The `address-lookup` edge function (HERE API) can remain deployed for now since it may be used elsewhere, but these three files will no longer call it

## Files Modified

| File | Change |
|------|--------|
| `src/components/instructor/AddLessonSheet.tsx` | Replace HERE address lookup with `GoogleAddressAutocomplete` for both pickup and new pupil address fields |
| `src/components/admin/BespokeBookingModal.tsx` | Replace HERE address + postcode lookup with `GoogleAddressAutocomplete` |
| `src/pages/instructor-app/onboarding/steps/StepLocation.tsx` | Replace plain Input with `PostcodeAutocomplete` for postcode suggestions |

