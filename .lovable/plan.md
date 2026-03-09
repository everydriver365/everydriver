

## Remove "Requires Approval" for Pupil Portal Bookings

The current logic treats all bookings as "pending approval" when `allow_self_booking` is not explicitly enabled in the instructor settings (which is the default). Since we already decided to let pupils book directly from the portal regardless of that setting, bookings should auto-confirm.

### Change
In `src/components/pupil-portal/SelfBookingCalendar.tsx`:

1. Set `bookingStatus` to `'confirmed'` always (line ~153)
2. Remove all `requiresApproval` conditional UI — the "Requires approval" badge, dialog text variations, and "Request Booking" button labels
3. Always show "Confirm Booking" and "Your lesson has been confirmed" messaging

This is a single-file change affecting ~6 locations in the component.

