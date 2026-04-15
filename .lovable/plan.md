

## Fix: Google Calendar Colors Not Syncing

### Root Cause
The edge function (`google-calendar-service/index.ts`) only maps colors when an event has an explicit `colorId` (1-11). Most Google Calendar events use the **calendar's default color** and don't have a `colorId` set — so they all store `null` in the `color` column. The DB confirms every event currently has `color: null`.

### Solution

**Edit `supabase/functions/google-calendar-service/index.ts`** in the `fetchExternalEvents` action:

1. **Fetch the calendar's metadata** (GET `/calendars/{id}`) before fetching events — this returns `backgroundColor` (e.g. `#039be5`) which is the calendar's default color.
2. **Use `backgroundColor` as fallback** when an event has no `colorId`:
   ```
   color: item.colorId ? (googleColorMap[item.colorId] || calendarDefaultColor) : calendarDefaultColor
   ```
3. Also handle the `event.colorId` values that might not be in the hardcoded map (Google sometimes returns extended IDs) by falling back to the calendar default.

### What changes
- One file: `supabase/functions/google-calendar-service/index.ts`
- ~5 lines added (fetch calendar metadata + update color fallback logic)
- After deploying, the next sync will populate `color` for all events
- The `MultiDayScheduleView` already reads `evt.color` and falls back to `#039be5` — so once colors are stored, they'll render automatically

### No other changes needed
The frontend (`MultiDayScheduleView.tsx`) already handles event colors correctly at line 363-364. The issue is purely that the backend stores `null`.

