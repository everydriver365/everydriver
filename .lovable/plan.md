

## Make Device Selector Always Visible

### Problem

The `DeviceSelectorDropdown` component has a guard on line 59: `if (devices.length <= 1) return null;` — it hides itself when there's only one active device. If Kenneth's devices are not all marked `is_active = true`, or the query returns only one, the dropdown won't render.

### Fix

1. **Change the guard** in `DeviceSelectorDropdown.tsx` from `devices.length <= 1` to `devices.length === 0` — always show the dropdown when there's at least one device, so the user can see what's selected and switch if more devices appear.

2. **Verify active devices** — Check the database to confirm Kenneth has multiple active devices. If one is marked inactive, the query filters it out.

### Files changed

- `src/components/instructor/tracking/DeviceSelectorDropdown.tsx` — change hide condition from `<= 1` to `=== 0`

