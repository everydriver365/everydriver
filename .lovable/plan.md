

## Plan: Add Search Box and Rename to Every Driver GPS Gate

### Overview
Two changes needed:
1. Add a text search box so you can type to filter the list of trackers
2. Rename all user-facing "GPSgate" references to "Every Driver GPS Gate"

---

### Changes

#### 1. Add Search Box to Tracker Lookup
**File: `src/components/instructor/GPSTrackerLookup.tsx`**

Currently, the component has a `searchQuery` prop passed from the parent but no input field for the user to type in. We'll add:

- A text input field for typing a search query
- Real-time filtering of the tracker list as you type
- The search will filter locally after loading all trackers (faster UX)

**UI Flow:**
1. Click "Find Tracker in Every Driver GPS Gate"
2. All trackers load into a list
3. Type in the search box to filter by name/username
4. Tap to select

#### 2. Rename GPSgate → Every Driver GPS Gate
Update user-facing text in these files:

| File | Changes |
|------|---------|
| `GPSTrackerLookup.tsx` | Button text, toast messages, error messages |
| `GPSgateUserIdSettings.tsx` | Card title, description, labels, alert text |
| `InstructorSettings.tsx` | Settings tile description |
| `GPSgateTripsTabContent.tsx` | Empty state message |

---

### Technical Details

**GPSTrackerLookup.tsx changes:**
```tsx
// Add local state for search filter
const [filterText, setFilterText] = useState("");

// Filter candidates locally
const filteredCandidates = candidates.filter(c => {
  const searchLower = filterText.toLowerCase();
  return (
    c.name?.toLowerCase().includes(searchLower) ||
    c.username?.toLowerCase().includes(searchLower) ||
    c.id.toString().includes(filterText)
  );
});

// Add input field above the tracker list
<Input
  placeholder="Search trackers..."
  value={filterText}
  onChange={(e) => setFilterText(e.target.value)}
/>
```

**Text replacements:**
- "GPSgate" → "Every Driver GPS Gate" (titles, descriptions)
- "Find Tracker in GPSgate" → "Find Tracker"
- Toast messages updated to use new branding

---

### Files to Modify

1. **`src/components/instructor/GPSTrackerLookup.tsx`**
   - Add search input field with filter state
   - Rename button and messages

2. **`src/components/instructor/GPSgateUserIdSettings.tsx`**
   - Rename card title to "Every Driver GPS Gate Account Link"
   - Update description and alert text

3. **`src/pages/InstructorSettings.tsx`** (line 685)
   - Change "Link your GPSgate Tracker app" → "Link your Every Driver GPS Gate account"

4. **`src/components/instructor/GPSgateTripsTabContent.tsx`** (line 241)
   - Change "Trips from your GPSgate tracker" → "Trips from your Every Driver GPS Gate tracker"

