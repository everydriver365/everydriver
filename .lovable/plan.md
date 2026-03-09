

## Wire Up Live Slot Offers in the Pupil Portal

**Problem**: The `SlotOfferNotification` component exists but is never rendered anywhere — slot offers from instructors are invisible to pupils.

### Changes

1. **`src/pages/BrandedPupilPortal.tsx`**
   - Import `SlotOfferNotification`
   - Render it on the home screen (after the greeting, before the check-in card) so pending offers are immediately visible
   - Pass `pupilId={pupil.id}` and wire `onAccept` to refresh schedule data

2. **`src/components/pupil-portal/SlotOfferNotification.tsx`**
   - Add a Supabase realtime subscription on the `slot_offers` table filtered by `pupil_id`, so new offers appear instantly without needing a page refresh
   - Clean up the subscription on unmount

This requires no database changes — the `slot_offers` table and its data flow already exist. The component just needs to be mounted and given a realtime channel.

