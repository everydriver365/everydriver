

## Nearby Instructor Friends — Map & Messaging

### Overview
Add a new "Nearby ADIs" tile to the instructor home screen that opens a dedicated page showing friends (other instructors) on a live map with the ability to send direct messages between instructors.

### What's Needed

**1. Database: `instructor_friends` table**
- Columns: `id`, `requester_id` (references instructors), `recipient_id` (references instructors), `status` (enum: pending/accepted/declined), `created_at`, `updated_at`
- Unique constraint on (requester_id, recipient_id)
- RLS: authenticated instructors can see/manage their own friend records

**2. Database: `instructor_direct_messages` table**
- Columns: `id`, `sender_id`, `recipient_id`, `content`, `read_at`, `created_at`
- RLS: sender or recipient can read; sender can insert
- Enable realtime for live chat

**3. Edge Function: `get-nearby-instructors`**
- Accepts the calling instructor's ID
- Reads their GPS position from `gps_devices` (live lat/lng)
- Queries all accepted friends' GPS positions
- Returns friend name, lat/lng, heading, distance — only for friends whose GPS is active and recent (last 30 mins)
- Security: only returns data for accepted friends

**4. New Page: `/instructor/nearby-friends`**
- Google Maps full-screen view centered on the instructor's position
- Friend markers (avatar pins) showing each nearby friend's live location
- Tapping a marker opens a bottom sheet with: name, distance, and "Send Message" button
- Friend management: add friend by search (name/postcode), accept/decline requests, friend list

**5. New Components**
- `NearbyFriendsMap.tsx` — Google Maps with instructor friend markers
- `FriendRequestSheet.tsx` — send/accept/decline friend requests
- `InstructorDirectChat.tsx` — 1:1 chat window between instructors (reuses existing chat patterns)
- `useNearbyFriends.ts` — hook polling `get-nearby-instructors` every 30s
- `useInstructorFriends.ts` — hook for CRUD on friend requests
- `useInstructorDirectMessages.ts` — hook for realtime DMs

**6. Tile Integration**
- Add "Nearby ADIs" tile to `SwipeableQuickAccess`, `AppStyleHomeView`, `HomeQuickActions`, and `QuickActionsFAB`
- Icon: `Users` (lucide) with a map pin accent
- Route: `/instructor/nearby-friends`

**7. Route**
- Add `/instructor/nearby-friends` to `App.tsx`

### How Location Works
- Uses the instructor's existing `gps_devices` table (Geotab hardware) for live positions — no new GPS tracking needed
- Only shows friends who have active GPS devices with recent updates
- Calculates distance client-side using Haversine formula from the edge function

### Security
- GPS positions only shared between accepted friends
- Friend requests require explicit acceptance
- DMs only between accepted friends (enforced via RLS)
- No location data exposed to non-friends

### Files Summary

| Action | File |
|--------|------|
| Create (migration) | `instructor_friends` + `instructor_direct_messages` tables |
| Create | `supabase/functions/get-nearby-instructors/index.ts` |
| Create | `src/pages/InstructorNearbyFriends.tsx` |
| Create | `src/components/instructor/NearbyFriendsMap.tsx` |
| Create | `src/components/instructor/FriendRequestSheet.tsx` |
| Create | `src/components/instructor/InstructorDirectChat.tsx` |
| Create | `src/hooks/useNearbyFriends.ts` |
| Create | `src/hooks/useInstructorFriends.ts` |
| Create | `src/hooks/useInstructorDirectMessages.ts` |
| Modify | `src/App.tsx` — add route |
| Modify | `src/components/instructor/SwipeableQuickAccess.tsx` — add tile |
| Modify | `src/components/instructor/AppStyleHomeView.tsx` — add tile |
| Modify | `src/components/instructor/QuickActionsFAB.tsx` — add action |

