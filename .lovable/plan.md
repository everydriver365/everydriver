

## Fix: Postcode Address Lookup — No Search Button + Form Jumps on Mobile

### Problem
Two issues in the booking flow's `PostcodeAddressLookup` component:

1. **No visible "Find Address" button** — the lookup only triggers on postcode blur or Enter key. On mobile, users don't know to blur or press Enter; they expect a clear "Find Address" button.

2. **Form jumps / "closes" on postcode blur** — when the mobile keyboard dismisses (blur), the address lookup fires asynchronously. The resulting state changes (loading spinner → dropdown appearing) combined with the viewport resize from keyboard dismissal cause a scroll jump. The `handleFieldBlur('postcode', ...)` also fires validation which can flash an error then clear it, adding to the visual instability.

### Root Cause
In `PostcodeAddressLookup.tsx`:
- `handlePostcodeBlur` (line 115-118) triggers both `onBlurPostcode()` (validation) and `lookupAddresses()` simultaneously
- On mobile, blur fires when the keyboard closes, causing a cascade: viewport resize → validation error flash → loading state → dropdown render → layout shift
- There's no explicit "Find Address" button, so the only discovery mechanism is the invisible blur trigger

### Solution

**File: `src/components/booking/PostcodeAddressLookup.tsx`**

1. **Add a "Find Address" button** next to the postcode input — a visible, tappable button that triggers `lookupAddresses()`. This is the primary way users should trigger the search.

2. **Remove auto-lookup on blur** — `handlePostcodeBlur` should only call `onBlurPostcode?.()` for validation, NOT trigger `lookupAddresses()`. The lookup should only happen when the user clicks "Find Address" or presses Enter.

3. **Prevent scroll jump** — add a small delay before showing the dropdown to let the mobile keyboard fully dismiss and the viewport settle. Use `requestAnimationFrame` or a short `setTimeout` (~150ms) after results arrive before setting `showDropdown(true)`.

4. **Show loading state on the button** — when lookup is in progress, show a spinner on the "Find Address" button so users know something is happening.

### Layout Change
The postcode field becomes a row: `[postcode input] [Find Address button]` — the button sits beside the input, styled as a compact secondary button with a Search icon.

### Files to Modify
- `src/components/booking/PostcodeAddressLookup.tsx` — all changes are here; no changes needed to parent components

