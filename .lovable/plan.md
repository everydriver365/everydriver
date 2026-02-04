

## Create Locations Page

A dedicated page to manage all your saved locations (test centres, schools, pupil homes, meeting points) with a clean interface for viewing, adding, editing, and navigating to them.

---

### Features

1. **View all saved locations** - List grouped by category with search/filter
2. **Add new locations** - Reuse existing postcode lookup dialog  
3. **Edit locations** - Update name, category, address, notes
4. **Navigate** - Tap to open in Google Maps / Apple Maps
5. **Quick actions** - Toggle favourite, delete with confirmation
6. **Map preview** - Optional mini-map showing location

---

### Page Design

```text
+----------------------------------+
|  <- Back     Locations    [+ Add]|
+----------------------------------+
|  [Search locations...]           |
+----------------------------------+
|                                  |
|  TEST CENTRES                    |
|  +----------------------------+  |
|  | [icon] Tolworth Test    ★  |  |
|  |   KT6 7NF · Kingston      |  |
|  |             [Nav] [Edit]   |  |
|  +----------------------------+  |
|                                  |
|  SCHOOLS                         |
|  +----------------------------+  |
|  | [icon] Holy Cross Primary  |  |
|  |   KT6 5EJ · Surbiton       |  |
|  |             [Nav] [Edit]   |  |
|  +----------------------------+  |
|                                  |
|  PUPIL HOMES                     |
|  +----------------------------+  |
|  | [icon] John Smith          |  |
|  |   SW15 5PU · Putney        |  |
|  |             [Nav] [Edit]   |  |
|  +----------------------------+  |
|                                  |
+----------------------------------+
```

---

### Implementation

**1. Create New Page** (`src/pages/InstructorLocations.tsx`)
- Uses `InstructorPortalLayout` for consistent header/navigation
- Fetches locations from `favourite_locations` table
- Groups by category with collapsible sections
- Search bar to filter locations
- Reuses `AddFavouriteLocationDialog` for adding new locations
- Creates new `EditFavouriteLocationDialog` for editing

**2. Add Route** (`src/App.tsx`)
- Add route: `/instructor/locations` → `<InstructorLocations />`

**3. Create Edit Dialog** (`src/components/instructor/EditFavouriteLocationDialog.tsx`)
- Similar to Add dialog but pre-populated with existing data
- Updates database on save

**4. Navigation Actions**
- Tapping "Navigate" opens Google Maps (Android) or Apple Maps (iOS)
- Same pattern used in Find My Car page

---

### Technical Details

**Database Query:**
```typescript
const { data } = await supabase
  .from("favourite_locations")
  .select("*")
  .eq("instructor_id", instructorId)
  .order("category")
  .order("is_favorite", { ascending: false })
  .order("name");
```

**Grouping by Category:**
```typescript
const groupedLocations = locations.reduce((acc, loc) => {
  const cat = loc.category || 'other';
  if (!acc[cat]) acc[cat] = [];
  acc[cat].push(loc);
  return acc;
}, {} as Record<string, FavouriteLocation[]>);
```

**Navigation to External Maps:**
```typescript
const openNavigation = (lat: number, lng: number, name: string) => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  const appleUrl = `maps://maps.apple.com/?daddr=${lat},${lng}`;
  
  if (isIOS) {
    window.location.href = appleUrl;
  } else {
    window.open(googleUrl, "_blank");
  }
};
```

---

### Files to Create/Edit

| File | Action |
|------|--------|
| `src/pages/InstructorLocations.tsx` | Create (new page) |
| `src/components/instructor/EditFavouriteLocationDialog.tsx` | Create (edit dialog) |
| `src/App.tsx` | Edit (add route) |

