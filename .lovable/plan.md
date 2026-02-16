

# Test Requests Feature

## Overview

A new "Test Requests" system where pupils and instructors can register their current driving test booking or request a test swap. Instructors and admins can then offer available tests to those who need them.

## Database Schema

### New table: `test_requests`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| pupil_id | uuid FK -> pupils(id) | Nullable (instructor may create on behalf) |
| instructor_id | uuid FK -> instructors(id) | The associated instructor |
| created_by_type | text | 'pupil', 'instructor', or 'admin' |
| request_type | text | 'have_test' (already booked) or 'want_test' (looking for one) |
| test_centre_id | uuid FK -> test_centres(id) | Nullable (manual entry allowed) |
| test_centre_name | text | For manual entry / display |
| test_date | date | Exact date if booked, or preferred start date |
| test_time | time | Exact time if booked, or preferred start time |
| date_range_end | date | Nullable -- end of preferred window (for want_test) |
| time_range_end | time | Nullable -- end of preferred time window |
| willing_to_pay_swap_fee | boolean | Default false -- the GBP 150 toggle |
| status | text | 'active', 'matched', 'cancelled' -- default 'active' |
| notes | text | Optional free-text |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### New table: `test_swap_offers`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| test_request_id | uuid FK -> test_requests(id) | The request being offered to |
| offered_by_instructor_id | uuid FK -> instructors(id) | Nullable |
| offered_by_admin | boolean | Default false |
| offered_test_date | date | The test date/time being offered |
| offered_test_time | time | |
| offered_test_centre_id | uuid FK -> test_centres(id) | |
| offered_test_centre_name | text | |
| message | text | Optional message |
| status | text | 'pending', 'accepted', 'declined' |
| created_at | timestamptz | |

### RLS Policies

- **test_requests**: Instructors can read/write rows where `instructor_id` matches their instructor record. Pupils can read/write their own rows via `pupil_id`.
- **test_swap_offers**: Instructors can read offers linked to their test_requests or created by them. Admins (via `has_role`) can read/write all.

## New Components

### 1. `src/pages/InstructorTestRequests.tsx`
Main page at route `/instructor/test-requests`. Contains:
- A list of the instructor's pupils' active test requests
- A form to add a new request (on behalf of a pupil or the instructor themselves)
- A "Swap Board" tab showing all active requests in their area that match available tests, with an "Offer Test" button

### 2. `src/components/test-requests/TestRequestForm.tsx`
Shared form component used by both instructor and pupil portals:
- **Request Type** toggle: "I have a test booked" vs "I'm looking for a test"
- **Test Centre** search (autocomplete from existing `test_centres` table) + manual input fallback
- **Date/Time** picker (exact for "have", range for "want")
- **Swap Fee toggle**: "I'm happy to pay GBP 150 to swap" with clear labelling
- **Pupil selector** (instructor-only, to pick which pupil)

### 3. `src/components/test-requests/TestRequestList.tsx`
Displays active requests with status badges, test centre name, date/time, and swap fee indicator.

### 4. `src/components/test-requests/SwapBoard.tsx`
Shows matching requests (people who "have" a test matching what someone "wants" and vice versa). Instructors and admins can click "Offer This Test" to create a `test_swap_offer`.

### 5. `src/components/test-requests/TestSwapOfferDialog.tsx`
Dialog for instructors/admins to send an offer with optional message.

## Integration Points

### Instructor Mobile App (tile)
Add a "Test Swap" tile to the `additionalTiles` arrays in:
- `AppStyleHomeView.tsx`
- `QuickActionTiles.tsx`
- `DashboardLayoutManager.tsx`

```
{ id: "test-requests", title: "Test Swap", icon: "Award", route: "/instructor/test-requests", display_order: 101.5 }
```

### Pupil Portal
Add a new menu item in `BrandedPupilPortal.tsx` navigation list:
```
{ id: 'test-requests', icon: RefreshCw, label: 'Test Swap', desc: 'Request or swap a driving test' }
```

Add a new `ActiveSection` type value `'test-requests'` and render the `TestRequestForm` + `TestRequestList` for the pupil's own requests.

### Instructor Desktop Dashboard
Add route in `App.tsx` and sidebar link in `InstructorPortalLayout.tsx`.

### Admin Portal
Add a "Test Swap Board" section in the admin portal where admins can view all active requests across all instructors and offer tests.

## Route

| Route | Component |
|-------|-----------|
| `/instructor/test-requests` | `InstructorTestRequests` |

## File Changes Summary

| File | Change |
|------|--------|
| **New** `src/pages/InstructorTestRequests.tsx` | Main instructor page |
| **New** `src/components/test-requests/TestRequestForm.tsx` | Shared form |
| **New** `src/components/test-requests/TestRequestList.tsx` | Request list |
| **New** `src/components/test-requests/SwapBoard.tsx` | Matching board |
| **New** `src/components/test-requests/TestSwapOfferDialog.tsx` | Offer dialog |
| `src/App.tsx` | Add route |
| `src/components/instructor/AppStyleHomeView.tsx` | Add tile |
| `src/components/instructor/QuickActionTiles.tsx` | Add tile |
| `src/components/instructor/DashboardLayoutManager.tsx` | Add tile |
| `src/components/layout/InstructorPortalLayout.tsx` | Add sidebar link |
| `src/pages/BrandedPupilPortal.tsx` | Add pupil section |
| `src/pages/AdminPortal.tsx` | Add admin swap board view |
| **Migration** | Create `test_requests` and `test_swap_offers` tables with RLS |

