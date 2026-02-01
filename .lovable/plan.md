
# Add Live Map with Next Lesson to Pupils Page

## Overview
Add an interactive map card between the stats row and the search/filter section on the instructor pupils page. The map will display the next upcoming lesson's pickup location with pupil initials, time, and a "Navigate" button - matching the reference design.

---

## Visual Design

The new map card will appear like this:

```text
┌────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────────┐  │
│  │                                                  │  │
│  │         [Map showing pickup location]            │  │
│  │                                                  │  │
│  │            ┌───────────────────┐                 │  │
│  │            │ SJ │ 09:00        │                 │  │
│  │            │    │ Today        │                 │  │
│  │            └───────────────────┘                 │  │
│  │                                                  │  │
│  │                            ┌─────────────────┐   │  │
│  │                            │ ➤ Navigate      │   │  │
│  │                            └─────────────────┘   │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

**Key Features:**
- Rounded card with map preview
- Custom marker showing pupil initials + lesson time
- Location name displayed on hover/popup
- "Navigate" button in bottom-right corner
- Only shows when there's an upcoming lesson with a valid postcode

---

## Implementation Details

### New Component: `UpcomingLessonMap`

**File:** `src/components/instructor/UpcomingLessonMap.tsx`

This component will:
1. Accept the instructor ID as a prop
2. Fetch the next scheduled lesson with pickup postcode
3. Geocode the postcode using postcodes.io API
4. Display an interactive Leaflet map with:
   - Custom marker showing pupil initials + lesson time
   - Popup with full details on click
   - "Navigate" button that opens native maps app
5. Handle loading and "no upcoming lessons" states gracefully

### Page Integration

**File:** `src/pages/InstructorPupils.tsx`

- Import the new `UpcomingLessonMap` component
- Add it between the stats row and the search/filter section
- Pass the `instructorId` prop

---

## Technical Approach

### Data Fetching
```typescript
// Fetch next upcoming lesson
const { data } = await supabase
  .from("scheduled_lessons")
  .select("id, lesson_date, start_time, pickup_postcode, pupils(name)")
  .eq("instructor_id", instructorId)
  .eq("status", "scheduled")
  .gte("lesson_date", today)
  .order("lesson_date", { ascending: true })
  .order("start_time", { ascending: true })
  .limit(1)
  .single();
```

### Geocoding
```typescript
// Convert postcode to coordinates
const response = await fetch(
  `https://api.postcodes.io/postcodes/${postcode}`
);
const { result } = await response.json();
// result.latitude, result.longitude
```

### Map Marker
- Custom `L.DivIcon` with pupil initials in a circular badge
- Time displayed in a tooltip-style overlay
- Uses the existing map tile configuration from `mapConfig.ts`

### Navigation
- Opens Apple Maps on iOS, Google Maps on Android
- Uses coordinates for precise navigation

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/instructor/UpcomingLessonMap.tsx` | Create | New map component for upcoming lesson display |
| `src/pages/InstructorPupils.tsx` | Modify | Import and add the map component between stats and search |

---

## Edge Cases Handled

1. **No upcoming lessons** - Map card is hidden entirely
2. **Invalid/missing postcode** - Map card is hidden
3. **Geocoding failure** - Map card is hidden with console warning
4. **Today vs Tomorrow vs Future** - Shows "Today", "Tomorrow", or date
5. **Loading state** - Shows skeleton loader while fetching
