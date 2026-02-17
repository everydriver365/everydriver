

# Add Collapsible "Test Requests" Tile to Instructor Home Page

## Summary
Add a new collapsible tile below the Messages tile on the instructor mobile home page. The tile shows test request activity -- alerting the instructor when slots become available at centres they (or their pupils) have requested. The tile is always visible, even without active requests.

## Changes

### 1. Create New Component: `TestRequestsTile`

**New file: `src/components/instructor/TestRequestsTile.tsx`**

A collapsible tile matching the iOS Wallet style used by Vehicle Health and Agenda tiles:

- **Header**: Navy gradient with "Test Requests" label, collapsible via ChevronDown toggle, notification badge showing count of available matching slots
- **Collapsed state**: Just the header with badge count
- **Expanded state**:
  - If the instructor/pupils have active "want_test" requests, show a summary of which centres are being watched and how many matching slots exist
  - A test centre selector (reusing the same `Select` pattern from `AvailableTestSlots`) to browse and reserve slots
  - Slot cards with date, time, and a "Reserve" button (reusing the reserve logic from `AvailableTestSlots`)
- **No requests state**: Show a prompt like "No active test requests. Create one from Test Swap to get alerts." with a link to `/instructor/test-requests`
- **Always rendered**: The tile appears regardless of whether requests exist

Data sources:
- Query `test_requests` table for active "want_test" requests by this instructor (and their pupils)
- Query `test_slot_reservations` for matching scraped slots
- Use `fetchTestCentres` / `fetchSlotsForCentre` from `@/lib/api/firecrawl` for browsing available slots
- Use `useTestSwapNotifications` hook data to show the badge count

### 2. Update `InstructorMobileHome.tsx`

- Import `TestRequestsTile`
- Place it after the Messages button block (after line 462), before the `px-4` content div
- Pass `instructorId` as prop

## Technical Details

### TestRequestsTile Component Structure

```text
+------------------------------------------+
| [gradient header]                        |
| Test Requests          [badge] [chevron] |
| "2 slots match your requests"           |
+------------------------------------------+
| (when expanded)                          |
| Watched Centres: Lee on the Solent       |
|                                          |
| [Select a test centre... v] [Refresh]   |
|                                          |
| Slot 1: 25/02/2026  09:00  [Reserve]   |
| Slot 2: 26/02/2026  10:30  [Reserve]   |
|                                          |
| [View all in Test Swap ->]              |
+------------------------------------------+
```

### Data Flow
- On mount, fetch instructor's active `want_test` requests to determine watched centres
- Query `test_slot_reservations` for matching scraped slots (badge count)
- When expanded, allow browsing all centres via the existing `fetchTestCentres`/`fetchSlotsForCentre` API
- Reserve button inserts into `test_slot_reservations` and logs admin action (same as `AvailableTestSlots`)

### Files Summary

| File | Action |
|------|--------|
| `src/components/instructor/TestRequestsTile.tsx` | New - collapsible test requests tile |
| `src/components/instructor/InstructorMobileHome.tsx` | Edit - import and place tile after Messages |

