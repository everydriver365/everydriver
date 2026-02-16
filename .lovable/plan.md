

# Update Available Slots Tab

## Changes

### 1. Rename Tab Label
In `src/pages/InstructorTestRequests.tsx`, change the "Available Slots" tab trigger text from "Available Slots" to "Available" and style it with green text (emerald-500) when active.

### 2. Remove Attribution Text
In `src/components/test-requests/AvailableTestSlots.tsx`, remove the footer paragraph that reads "Data sourced from TestBooking".

## Technical Details

### Files Modified
- `src/pages/InstructorTestRequests.tsx` -- rename tab trigger to "Available" with green styling
- `src/components/test-requests/AvailableTestSlots.tsx` -- remove the attribution `<p>` element at the bottom of the component

