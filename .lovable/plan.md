

## Messaging system audit results

### What's working
All messaging tables exist in the database: `conversations`, `messages`, `admin_conversations`, `admin_messages`, `parent_conversations`, `parent_messages`, `instructor_direct_messages`, `whatsapp_conversations`, `whatsapp_messages`, `live_chat_sessions`, `live_chat_messages`.

The core messaging flows are wired up:
- **Pupil <-> Instructor**: `useMessaging` hook queries `conversations` + `messages` tables correctly. `PupilChat` and `ChatWindow` components handle both sides. Realtime subscriptions are in place.
- **Admin <-> Instructor**: `admin_conversations` + `admin_messages` tables exist, `AdminChatWindow` component handles this. Unread counts are tracked.
- **Parent <-> Instructor**: `parent_conversations` + `parent_messages` tables exist, `ParentChat` component handles the parent side with realtime.
- **Instructor <-> Instructor (DMs)**: `instructor_direct_messages` table + `InstructorDirectChat` component with realtime.
- **Visitor/WhatsApp**: `whatsapp_conversations` + `whatsapp_messages` with AI toggle, delivery status, and SMS forwarding via edge function.
- **Live Chat**: `live_chat_sessions` + `live_chat_messages` with visitor/AI/instructor flow.

### Bugs found (causing 400 errors right now)

1. **`instructors.postcode` does not exist** — The `useOfflinePrefetch.ts` (line 59) queries `postcode` on the `instructors` table, but the column is actually called `home_postcode`. This causes a 400 error on every page load.

2. **`pupils.experience_level` does not exist** — Two files reference this non-existent column (the actual column is `previous_experience`):
   - `useOfflinePrefetch.ts` (line 47)
   - `useOfflineSync.ts` (line 262)

These are not messaging-breaking bugs per se, but they fire on every dashboard load and pollute error logs.

### Fixes

**File: `src/hooks/useOfflinePrefetch.ts`**
- Line 47: Replace `experience_level` with `previous_experience` in the pupils select
- Line 59: Replace `postcode` with `home_postcode` in the instructors select

**File: `src/hooks/useOfflineSync.ts`**
- Line 262: Replace `experience_level` with `previous_experience` in the pupils select

### Summary
The messaging system is fully wired up across all roles. The only active bugs are two incorrect column names in the offline caching hooks causing 400 errors on page load. The core send/receive/realtime flows for all messaging channels are correctly implemented.

