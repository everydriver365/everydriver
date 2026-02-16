# Scrape Available Test Slots from TestBooking

## Overview

Scrape driving test slot availability from `https://testbooking.onrender.com/available-slots` using Firecrawl and display the results as a new tab in the Test Swap page.

## Prerequisites

- Link the existing Firecrawl connector to this project (already available in the workspace)

## Changes

### 1. Connect Firecrawl

Link the Firecrawl connection so the API key is available as an environment variable in backend functions.

### 2. Create Backend Function: `scrape-test-slots`

A new backend function at `supabase/functions/scrape-test-slots/index.ts` that:

- Calls Firecrawl's scrape API on `https://testbooking.onrender.com/available-slots`
- Uses markdown format to extract the page content
- Parses the scraped content to extract structured slot data (test centre, date, time)
- Returns the parsed slots as JSON

### 3. Create Frontend API Helper

Add `src/lib/api/firecrawl.ts` with a simple helper to call the backend function and return scraped slots.

### 4. Create `AvailableTestSlots` Component

A new component at `src/components/test-requests/AvailableTestSlots.tsx` that:

- Calls the scrape function on mount (with a "Refresh" button)
- Shows a loading spinner while scraping
- Displays the available slots as cards with test centre, date, and time
  &nbsp;

### 5. Add New Tab to Test Swap Page

Update `src/pages/InstructorTestRequests.tsx` to add a third tab called "Available Slots" alongside "My Requests" and "Swap Board", rendering the new `AvailableTestSlots` component.

## Technical Details

### Backend Function Structure

```text
supabase/functions/scrape-test-slots/index.ts
  - CORS headers
  - Reads FIRECRAWL_API_KEY from environment
  - Calls Firecrawl v1 scrape API with markdown format
  - Parses the markdown response to extract slot data
  - Returns JSON array of { centre, date, time }
```

### Tab Layout Update

```text
Tabs:
  [My Requests] [Swap Board] [Available Slots]
                                    ^-- NEW
```

### Files Created

- `supabase/functions/scrape-test-slots/index.ts` -- backend scraping function
- `src/lib/api/firecrawl.ts` -- frontend API helper
- `src/components/test-requests/AvailableTestSlots.tsx` -- display component

### Files Modified

- `src/pages/InstructorTestRequests.tsx` -- add third tab