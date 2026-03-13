

## Auto-Search Addresses When Postcode is Entered in Booking Flow

### Problem
When a user types a postcode in the booking form, nothing happens — the postcode and address are separate disconnected fields. The user has to manually type into the Google address autocomplete field. The form can collapse before they get a chance to enter an address.

### Solution
When the user enters a valid UK postcode, automatically look up addresses at that postcode using the existing `address-lookup` edge function (which already supports postcode-based lookup via HERE API), and show a dropdown of matching addresses. Selecting an address populates the address field.

### Changes

| File | Change |
|------|--------|
| **`src/components/booking/PostcodeAddressLookup.tsx`** | **Create** — New composite component that combines a postcode input with address dropdown. When a valid postcode is entered, calls `address-lookup` edge function, shows results in a selectable dropdown list. On selection, fires `onAddressSelect(address)` and `onPostcodeChange(postcode)`. Falls back to manual Google autocomplete entry if no results found. |
| **`src/components/booking/MobileBookingView.tsx`** | Replace the separate postcode `BookingFormField` + `GoogleAddressAutocomplete` address field with the new `PostcodeAddressLookup` component. Wire `onAddressSelect` → `setPupilAddress`, `onPostcodeChange` → `setPupilPostcode`. |
| **`src/pages/BookingSummary.tsx`** | Same change for the desktop booking flow — replace the postcode + address fields with `PostcodeAddressLookup`. |

### PostcodeAddressLookup Behavior
1. User types postcode → validated against UK postcode regex
2. On valid postcode (on blur or after debounce), calls `address-lookup` edge function with `{ postcode }`
3. Shows dropdown with returned addresses (street + house number display)
4. User selects an address → populates address field, collapses dropdown
5. "Enter manually" option at bottom of dropdown opens the existing Google autocomplete as fallback
6. If no addresses found, shows message and auto-opens manual entry

