

## Add Home Address + Separate Pickup Location to Booking Flow

### What Changes
Currently the booking form has a single "Pickup Address" field with Google autocomplete. This will be restructured to:

1. **Home Address** (Google verified) — always required
2. **"Is your pickup location different?"** checkbox
3. If checked: **Pickup Address** (Google verified) + optional **what3words** field
4. Both addresses passed through to the pupil record and scheduled lessons

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/BookingSummary.tsx` | Add new state: `pickupAddress`, `pickupPostcode`, `pickupWhat3words`, `differentPickup` (boolean). Update `isPupilDetailsComplete` validation. Change `pupilAddress` label to "Home Address". Pass pickup fields to `ensureBookingCreated` and all payment handlers. Update desktop "Your Details" form section (lines 1507-1567). |
| `src/components/booking/MobileBookingView.tsx` | Add new props for pickup fields. Update the mobile "Your Details" form (lines 519-577): rename address to "Home Address", add checkbox + conditional pickup address/what3words fields. |
| `supabase/functions/create-booking/index.ts` | Add optional `pickupAddress`, `pickupPostcode`, `pickupWhat3words` to the Zod schema. Store `address` as home address, `pickup_address`/`pickup_postcode`/`what3words` as pickup location on the pupil record. Use pickup address (or fallback to home) for `pickup_location` on scheduled lessons. |

### UI Layout (Mobile)

```text
┌─────────────────────────────┐
│ Full Name *                 │
│ Email *                     │
│ Phone *        Postcode *   │
│ Home Address * (Google ✓)   │
│                             │
│ ☐ Pickup location differs   │
│                             │
│ (if checked:)               │
│ Pickup Address (Google ✓)   │
│ what3words (optional)       │
│   ///word.word.word          │
└─────────────────────────────┘
```

### Data Flow

- **Home address** → `pupils.address` + `pupils.postcode`
- **Pickup address** (if different) → `pupils.pickup_address` + `pupils.pickup_postcode` + `pupils.what3words`
- **Scheduled lessons** → `pickup_location` uses pickup address if set, otherwise home address
- If pickup is NOT different, `pickup_address`/`pickup_postcode` stored as `null` (home address is implied)

### Key Details
- The `pupils` table already has `pickup_address`, `pickup_postcode`, and `what3words` columns — no migration needed
- The `GoogleAddressAutocomplete` component is already imported and used in both files
- The what3words field is a simple text input (format: `///word.word.word`)
- All existing payment handler functions that pass `pupilAddress` for billing will continue using the home address

