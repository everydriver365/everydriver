

## Fix: Skip door number prompt when address already has one

### Problem
When a user selects an address from the Ideal Postcodes results, the component **always** shows the "Door Number / Property Name" prompt (line 152: `setShowDoorPrompt(true)`), even when the address already includes a house number or building name from the PAF data.

### Solution
In `handleSelectAddress` (line 148), check if the selected address already has a `houseNumber` or a `buildingName`. If it does, skip the door prompt and finalize the address immediately.

### File: `src/components/booking/PostcodeAddressLookup.tsx`

**Changes to `AddressOption` interface** (line 9-17):
- Add optional `buildingName` and `subBuildingName` fields to match what the edge function returns

**Changes to `handleSelectAddress`** (line 148-158):
- If `addr.houseNumber` or `addr.buildingName` or `addr.subBuildingName` is present, set the full address and skip `showDoorPrompt`
- Only show the door prompt when none of these are populated

**Changes to address mapping** (line 86-94):
- Map `buildingName` and `subBuildingName` from the API response

### Logic
```
if (addr.houseNumber || addr.buildingName || addr.subBuildingName) {
  // Address is complete — use label directly, no door prompt
  onAddressChange(addr.label);
  setShowDoorPrompt(false);
} else {
  // No premise identifier — ask for door number
  setShowDoorPrompt(true);
}
```

