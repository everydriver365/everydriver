
## Locations Page Enhancements

Upgrading the Locations page with premium visual polish, inline map previews, GPS quick-add, category navigation pills, a favourites quick-access section, GlassCard styling with category accent colours, and optional pupil linking.

---

### Features to Implement

| Feature | Description |
|---------|-------------|
| Map Preview | Expandable inline mini-map when tapping a location card |
| GPS Quick-Add | Button to save current GPS position as a new location |
| Category Pills | Horizontal scrolling filter chips instead of vertical collapsibles |
| Favourites Section | Dedicated top section showing starred locations |
| GlassCard Styling | Premium glass-morphism cards with category accent colours |
| Pupil Linking | Associate "Pupil Home" locations with specific pupils |

---

### Visual Design

```text
+----------------------------------+
|  <- Back     Locations    [+ Add]|
+----------------------------------+
|  [GPS icon] Use Current Location |
+----------------------------------+
|  [Search locations...]           |
+----------------------------------+
|  [All] [Test] [School] [Home] >> |  <- Scrollable pills
+----------------------------------+
|                                  |
|  FAVOURITES (2)                  |
|  +----------------------------+  |
|  | [Glass Card - Teal glow]   |  |
|  | Building2  Tolworth Test ★ |  |
|  |   KT6 7NF                  |  |
|  |  [Mini Map Preview]        |  |  <- Expandable
|  +----------------------------+  |
|                                  |
|  ALL LOCATIONS                   |
|  +----------------------------+  |
|  | [Glass Card - Emerald]     |  |
|  | School  Holy Cross Primary |  |
|  |   KT6 5EJ                  |  |
|  +----------------------------+  |
|  +----------------------------+  |
|  | [Glass Card - Amber]       |  |
|  | Home  John Smith           |  |
|  |   SW15 5PU · Linked: John  |  |  <- Pupil link shown
|  +----------------------------+  |
|                                  |
+----------------------------------+
```

---

### Implementation Details

**1. GPS Quick-Add Button**
- Add button below header: "Use Current Location"
- On tap, request geolocation permission
- Get current coords, reverse geocode to postcode
- Pre-populate Add Location dialog with coords/postcode

**2. Category Pill Navigation**
- Horizontal scrolling row of filter chips
- Options: All, Test Centres, Schools, Pupil Homes, Meeting Points, Other
- Uses existing `GlassChip` component from `GlassCard.tsx`
- Selecting a pill filters the displayed locations

**3. Favourites Quick-Access Section**
- Dedicated section at top showing only `is_favorite = true` locations
- Always visible (not affected by category filter)
- Shows count badge

**4. GlassCard Styling with Category Accents**
- Replace `Card` with `GlassCard` component
- Category-specific accent colours:
  - Test Centres: Teal (`text-teal-500`, `bg-teal-500/10`)
  - Schools: Emerald (`text-emerald-500`, `bg-emerald-500/10`)
  - Pupil Homes: Amber (`text-amber-500`, `bg-amber-500/10`)
  - Meeting Points: Violet (`text-violet-500`, `bg-violet-500/10`)
  - Other: Primary colour

**5. Inline Map Preview**
- Expandable map on each location card
- Uses existing `PostcodeMapPreview` component (accepts lat/lng)
- Create new variant that accepts coords directly (not just postcode)
- Tapping map opens external navigation

**6. Pupil Linking (for Pupil Home category)**
- Add `pupil_id` column to `favourite_locations` table (nullable, foreign key to pupils)
- When category is "pupil_home", show pupil selector dropdown
- Display linked pupil name on the card
- Filter pupils by instructor_id

---

### Technical Changes

**Database Migration**
```sql
ALTER TABLE favourite_locations
ADD COLUMN pupil_id uuid REFERENCES pupils(id) ON DELETE SET NULL;
```

**New Component: `CoordsMapPreview.tsx`**
- Similar to `PostcodeMapPreview` but accepts lat/lng directly
- No geocoding needed since coords are already stored

**Modified Files**

| File | Changes |
|------|---------|
| `src/pages/InstructorLocations.tsx` | Add GPS button, category pills, favourites section, GlassCard styling, expand/collapse map |
| `src/components/instructor/CoordsMapPreview.tsx` | New - Map preview using coordinates |
| `src/components/instructor/AddFavouriteLocationDialog.tsx` | Add pupil selector for "pupil_home" category, GPS pre-fill support |
| `src/components/instructor/EditFavouriteLocationDialog.tsx` | Add pupil selector for "pupil_home" category |

---

### Category Accent Colours

```typescript
const categoryAccents: Record<string, { 
  text: string; 
  bg: string; 
  glow: string 
}> = {
  test_centre: { 
    text: "text-teal-500", 
    bg: "bg-teal-500/10", 
    glow: "ring-teal-500/20" 
  },
  school: { 
    text: "text-emerald-500", 
    bg: "bg-emerald-500/10", 
    glow: "ring-emerald-500/20" 
  },
  pupil_home: { 
    text: "text-amber-500", 
    bg: "bg-amber-500/10", 
    glow: "ring-amber-500/20" 
  },
  meeting_point: { 
    text: "text-violet-500", 
    bg: "bg-violet-500/10", 
    glow: "ring-violet-500/20" 
  },
  other: { 
    text: "text-primary", 
    bg: "bg-primary/10", 
    glow: "ring-primary/20" 
  },
};
```

---

### GPS Quick-Add Flow

```typescript
const handleUseCurrentLocation = () => {
  if (!navigator.geolocation) {
    toast.error("Geolocation not supported");
    return;
  }
  
  setGpsLoading(true);
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      // Reverse geocode to get postcode
      const response = await fetch(
        `https://api.postcodes.io/postcodes?lon=${longitude}&lat=${latitude}`
      );
      const data = await response.json();
      const postcode = data.result?.[0]?.postcode;
      
      // Open add dialog with pre-filled data
      setPrefilledCoords({ lat: latitude, lng: longitude });
      setPrefilledPostcode(postcode);
      setAddDialogOpen(true);
      setGpsLoading(false);
    },
    (error) => {
      toast.error("Could not get location");
      setGpsLoading(false);
    }
  );
};
```

---

### Files Summary

| File | Action |
|------|--------|
| `src/pages/InstructorLocations.tsx` | Major update - all UI enhancements |
| `src/components/instructor/CoordsMapPreview.tsx` | Create new |
| `src/components/instructor/AddFavouriteLocationDialog.tsx` | Update - GPS prefill, pupil selector |
| `src/components/instructor/EditFavouriteLocationDialog.tsx` | Update - pupil selector |
| Database migration | Add `pupil_id` column |
