

## Plan: Google Autocomplete + Save Button for Address Fields

### Current State
- **Home Address**: Uses `GoogleAddressAutocomplete` but auto-saves immediately on selection (no save button)
- **Pickup Address**: Uses plain `InlineEditField` (no autocomplete at all)

### Changes

**File: `src/components/pupil-portal/PupilPortalProfileEdit.tsx`**

1. **Pickup Address** — Replace the `InlineEditField` with `GoogleAddressAutocomplete` + a Save button, matching the home address pattern. Add local state `pickupAddressValue` and a `handleSavePickupAddress` function that calls `updateField("pickup_address", ...)`.

2. **Home Address** — Add a Save button next to the existing `GoogleAddressAutocomplete`. Track whether the value has been modified (dirty state) and show the save button only when changes are pending. On save, call `updateField("address", addressValue)`.

3. **Both fields** will follow the same UX pattern:
   - Type to search → Google suggestions appear → select one → value populates
   - A "Save" button appears when the value differs from the saved value
   - Clicking Save persists to the database via `update_pupil_profile` RPC
   - Toast confirms success

### No backend changes needed — all fields already exist on the `pupils` table and are in the `update_pupil_profile` allowed fields list.

