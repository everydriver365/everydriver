

## Auto-fill Pupil Details + Manual Entry Checkbox

### Changes
Modify the "Send Link" view in `TakePaymentModal.tsx` to add a checkbox that clears the contact fields for manual entry.

**File: `src/components/instructor/TakePaymentModal.tsx`**

1. Add state `clearForManual` (boolean) to track if user wants to override auto-filled values

2. Update `handlePupilSelectForLink`:
   - Only auto-fill phone/email if `!clearForManual`
   - If `clearForManual` is checked, keep fields empty even when pupil changes

3. Add checkbox below pupil selector:
   - Label: "Clear fields for manual entry"
   - When checked: immediately clears `manualPhone` and `manualEmail`, prevents future auto-fill
   - When unchecked: re-fills from selected pupil if one exists

4. Layout (mobile-first):
```
┌─────────────────────────┐
│ Select Pupil (optional) │
├─────────────────────────┤
│ ☑ Clear for manual entry│  ← new checkbox
├─────────────────────────┤
│ Phone number            │  ← editable, auto-filled or empty
├─────────────────────────┤
│ Email address           │
├─────────────────────────┤
│ Send via: ☑ SMS ☑ Email │
├─────────────────────────┤
│ [ Send Payment Link ]   │
└─────────────────────────┘
```

5. Reset `clearForManual` to false in `handleClose` and "Send Another"

