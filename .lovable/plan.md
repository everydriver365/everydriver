

## Add Manual Email & Phone Entry to Send Payment Link

### What changes
In the **Send Link** view of `TakePaymentModal.tsx`, add the ability to manually type a phone number and/or email address instead of relying solely on the selected pupil's contact details.

### How it works

**File: `src/components/instructor/TakePaymentModal.tsx`**

1. **New state** — add `manualPhone` and `manualEmail` string states
2. **Make pupil selector optional** — add a "None (manual entry)" option so the instructor can send a link to someone not in their pupil list
3. **Show manual input fields** — below the pupil selector, show:
   - A phone number input (pre-filled from selected pupil if available, editable)
   - An email input (pre-filled from selected pupil if available, editable)
4. **Update send method checkboxes** — enable SMS if `manualPhone` has a value (not just pupil.phone), enable Email if `manualEmail` has a value
5. **Auto-populate on pupil select** — when a pupil is selected, copy their phone/email into the manual fields; when "None" is selected, clear them
6. **Update `handleSendLink`** — pass the manual phone/email values to the edge function body so it uses those instead of looking up the pupil record. Also handle the case where no pupil is selected (generate a generic payment link without `?pupil=` param)
7. **Reset** manual fields in `handleClose` and "Send Another"

### UI layout (mobile-first, 390px)
```
┌─────────────────────────┐
│ Select Pupil (optional) │  ← dropdown with "None" option
├─────────────────────────┤
│ Phone number            │  ← text input, auto-filled from pupil
├─────────────────────────┤
│ Email address           │  ← text input, auto-filled from pupil
├─────────────────────────┤
│ Send via: ☑ SMS ☑ Email │  ← enabled based on manual fields
├─────────────────────────┤
│ [ Send Payment Link ]   │
└─────────────────────────┘
```

### Edge function update
**File: `supabase/functions/send-payment-reminder/index.ts`** — accept optional `manualPhone` and `manualEmail` fields in the request body, using them as overrides when sending the link (falling back to the pupil record if not provided).

