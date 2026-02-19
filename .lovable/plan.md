
# Fix: Available Tab Not Updating After Adding a Test Request

## Problem
When you add a new test request, only the "My Requests" tab refreshes. The "Swap Board" and "Available" tabs stay stale because they use different data query keys that are not being refreshed.

## Solution
Update the form submission to also refresh the data used by the other tabs.

## Technical Detail
In `src/components/test-requests/TestRequestForm.tsx`, after a successful save, add cache invalidations for the "Swap Board" query (`test-requests-board`) and the "Available" tab's matched slots query (`matched-slots`). This is a one-line addition -- broadening the invalidation to cover all three tabs.
