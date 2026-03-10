

## Problem
The Address field in the admin instructor profile uses `InlineEditField` which renders a plain `<Input>`. It needs Google Address Autocomplete support.

## Solution
Add an `"address"` type to `InlineEditField` that renders `GoogleAddressAutocomplete` instead of a plain input when editing.

### Changes

**1. `src/components/ui/InlineEditField.tsx`**
- Add `"address"` to the `type` union
- Add optional `onPostcodeChange` prop
- When `type === "address"` and editing, render `GoogleAddressAutocomplete` instead of `<Input>`
- Wire `onChange` to `setEditValue` and `onPostcodeChange` through

**2. `src/components/admin/AdminInstructorProfile.tsx`**
- Change the Address `InlineEditField` to use `type="address"`
- Pass `onPostcodeChange` to auto-update the postcode field when an address is selected from Google

This is a minimal change — the `InlineEditField` gains one new type variant, and the single call site adds the type prop.

