
## Add mini-map + admin/pupil message awareness to the iOS Next Up tile

**Target**: `src/components/instructor/IOSNativeHomeView.tsx` → `IOSNextLessonCard` (the mobile "Next Up" tile shown on `/instructor` home, ios-native layout). No other layouts will be touched (per mobile update policy this is the active mobile layout the user is looking at).

### What to add (inside the expanded section only — keep collapsed view compact)

1. **Mini-map of pickup location**
   - Reuse the existing `PostcodeMapPreview` component (already used elsewhere, geocodes via `geocode-postcode` edge fn).
   - Render only when `nextLesson.pickupPostcode` exists, inside the expanded panel above the Live ETA row.
   - Tap-to-navigate: opens Google/Apple Maps directions to the postcode.
   - Styled to match dark gradient tile (rounded-2xl, white/10 border).

2. **Admin message indicator (pupil-related)**
   - New hook `useAdminUnreadForPupil(instructorId, pupilId)` querying `admin_messages` joined to `admin_conversations` for that instructor, filtered by messages whose body mentions the pupil's name OR by a future `pupil_id` column. For now: count any unread `admin_messages` where `sender_type='admin'` and `read_at IS NULL` for this instructor's conversation, AND `content ILIKE '%<pupil first name>%'`.
   - Show as a second message row in the expanded section: orange envelope, "X note(s) from admin about {pupilName}".
   - Tap → navigate to `/instructor/admin-chat` (or wherever admin chat lives).
   - Realtime invalidation via `useRealtimeSubscription("admin_messages", ...)`.

3. **Collapsed badge**
   - Combine pupil + admin unread into the existing red badge on the avatar so the user sees attention is needed without expanding.

### Files to change
- `src/components/instructor/IOSNativeHomeView.tsx` — render `PostcodeMapPreview`, render admin row, sum badge counts.
- `src/hooks/useAdminUnreadForPupil.ts` *(new)* — query + realtime.

### Out of scope
- No DB migrations (we filter client-side by name match — good enough until an explicit `pupil_id` column is added on `admin_messages`).
- No changes to other home layouts (lock-screen, clean, compact, best-mate, mission-control) — per mobile update policy.
- No changes to marketing pages.

### Visual sketch (expanded tile)
```text
┌─────────────────────────────┐
│ Avatar(2)  NEXT UP · in 25m │
│            Sarah Mitchell   │
├─────────────────────────────┤
│  [ mini-map @ SO22 6XX  ↗ ] │  ← NEW
│  Live ETA · ~12 min  • light│
│  💬 2 unread from Sarah   › │
│  ✉️  1 admin note re Sarah › │  ← NEW
│  [ Start Lesson ]           │
└─────────────────────────────┘
```
