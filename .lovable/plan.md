

## Plan: Add GPSgate Tracker Search to Account Linking

### Problem
The GPS Tracker Setup page has a "GPSgate Account Link" section that requires you to manually enter a numeric User ID. This is frustrating because:
1. You don't know your GPSgate User ID off the top of your head
2. There's already a "Find Tracker in GPSgate" component that works well - it just isn't being used here

### Solution
Integrate the existing `GPSTrackerLookup` component into the `GPSgateUserIdSettings` card, so you can search and select from available GPSgate trackers instead of typing a number manually.

---

### What Will Change

**Before:**
- Manual numeric input field for GPSgate User ID
- Have to know/find your ID somewhere else

**After:**
- "Find in GPSgate" button that searches all trackers
- Shows list of available trackers with names/usernames
- Tap to select and link in one step
- Still allows manual ID entry as fallback

---

### Technical Changes

**File: `src/components/instructor/GPSgateUserIdSettings.tsx`**

1. **Import GPSTrackerLookup component**
   ```typescript
   import { GPSTrackerLookup } from "./GPSTrackerLookup";
   ```

2. **Add state for showing tracker search**
   ```typescript
   const [showSearch, setShowSearch] = useState(!savedUserId);
   ```

3. **Add handler for when a tracker is selected**
   ```typescript
   const handleTrackerSelected = async (userId: number, username: string, name: string) => {
     setGpsGateUserId(userId.toString());
     // Auto-save the selected tracker
     await handleVerifyAndSave();
   };
   ```

4. **Add GPSTrackerLookup component to the UI**
   - Show below the alert when not linked
   - Pass empty search query (shows all trackers)
   - On selection, auto-verify and link

5. **Keep manual entry as secondary option**
   - Add "Or enter manually" toggle/section
   - Existing input field remains available

---

### Updated UI Flow

1. Open GPS Tracker Setup page
2. See "GPSgate Account Link" card
3. Click "Find Tracker in GPSgate" button
4. See list of all available trackers (tracker iOS, Roller Skate, etc.)
5. Tap on "tracker iOS" (your phone)
6. Automatically linked - shows green "Linked" badge

---

### Benefits
- No need to manually find/enter numeric IDs
- See all available trackers at once
- Clear names to identify which is your phone vs hardware trackers
- One-tap linking instead of type-and-click

