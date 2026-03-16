

## Switch Booking Postcode Lookup to Google Places

### Current State
- The booking flow's `PostcodeAddressLookup` component uses the HERE API (`address-lookup` edge function) for postcode-based address searches
- Google Places edge functions already exist: `google-places-autocomplete` and `google-places-details`, with the `GOOGLE_PLACES_API_KEY` secret already configured
- The `GoogleAddressAutocomplete` component exists but is used only in admin flows

### Plan

**1. Update the `address-lookup` edge function** to add a Google Places mode for postcode searches:
- When `postcode` is provided, use the Google Places Autocomplete API with the postcode as input (restricted to UK, type `address`)
- Return predictions as address options with `placeId`, `label`, `street`, `houseNumber`, etc.
- Keep the existing HERE modes as fallback or remove them

Actually, a cleaner approach: **Modify `PostcodeAddressLookup` directly** to call the existing Google Places edge functions instead of the `address-lookup` function.

**Step 1 — Update `PostcodeAddressLookup.tsx`**:
- Replace the `lookupAddresses` function to call `google-places-autocomplete` with the postcode as input
- Store predictions with their `placeId`
- When user selects an address from the dropdown, call `google-places-details` to get full address components (street number, street, city, postcode)
- Map the Google response into the existing `AddressOption` shape so the rest of the component (door number prompt, display) works unchanged

**Step 2 — No edge function changes needed**: The existing `google-places-autocomplete` and `google-places-details` functions already handle everything. The autocomplete function accepts an `input` string and returns predictions; the details function accepts a `placeId` and returns parsed address components.

### Key Details

- The `AddressOption` interface gains a `placeId` field for tracking which prediction was selected
- The autocomplete call uses the postcode as the `input` parameter — Google will return addresses matching that postcode
- Session tokens are used to group autocomplete + details calls for billing efficiency (already implemented in the edge functions)
- The 150ms viewport settling delay and mobile-friendly behavior are preserved
- Manual entry fallback remains unchanged

