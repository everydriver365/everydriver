

## Add Postcode Lookup and Address Autocomplete to the Add Lesson Sheet

### What Changes

The "Pickup Address" field in the Add Lesson sheet on the schedule page will be upgraded from a plain text input to a two-step address lookup:

1. **Postcode field** -- Uses the existing `PostcodeAutocomplete` component for type-ahead postcode search (powered by postcodes.io).
2. **Address dropdown** -- Once a postcode is selected, calls the existing `address-lookup` backend function (HERE API) to fetch addresses at that postcode, letting the instructor pick one from a dropdown.

The selected address auto-fills the pickup address field. Manual typing remains possible as a fallback.

### User Experience

1. Instructor taps "Pickup Address" area.
2. A postcode input appears with autocomplete suggestions (existing component).
3. After selecting a postcode, a dropdown of addresses at that postcode loads.
4. Selecting an address fills the pickup address and postcode fields.
5. The instructor can still manually type/edit the address if preferred.

---

### Technical Details

**File: `src/components/instructor/AddLessonSheet.tsx`**

- Add a new `pickupPostcode` state variable.
- Replace the plain `<Input>` for pickup address (lines 358-365) with:
  - The existing `PostcodeAutocomplete` component for postcode entry.
  - A new address selector that calls `supabase.functions.invoke('address-lookup', { body: { postcode } })` when a postcode is selected.
  - A `<Select>` dropdown populated with the returned addresses.
  - The selected address populates `pickupAddress`; the postcode populates `pickupPostcode`.
- When an existing pupil is selected and auto-fills the address, also extract/set the postcode separately.
- Pass `pickup_postcode` alongside `pickup_location` when inserting the scheduled lesson.

**No new components or backend functions needed** -- everything reuses existing infrastructure (`PostcodeAutocomplete`, `address-lookup` edge function).

