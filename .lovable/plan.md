

## Fix: Skip the intermediate screen when booking

**Problem**: Tapping "View Available Slots" on the home screen navigates to the schedule section, which shows the upcoming lessons list with *another* "View Available Slots" button. The booking calendar is hidden behind a second click.

**Solution**: Add an `initialShowBooking` prop to `PupilPortalSchedule` so the countdown button can open the booking calendar directly.

### Changes

1. **`src/components/pupil-portal/PupilPortalSchedule.tsx`** — Add `initialShowBooking?: boolean` prop, initialize `showBooking` state from it
2. **`src/pages/BrandedPupilPortal.tsx`** — Pass `initialShowBooking={true}` when navigating from the countdown's "View Available Slots" button (track via a state flag like `bookingRequested`), and reset it when leaving the schedule section

