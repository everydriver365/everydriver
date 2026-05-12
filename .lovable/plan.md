## Goal
Play a subtle notification sound when a new pupil message arrives, and let the instructor toggle/choose it from Settings → Notifications.

## Approach
Detect rising `unread` count via the existing `useUnreadMessagesCount` hook, play a short audio chime, and gate the chime behind a new persisted preference (default ON). Respect Quiet Hours and the existing "Pupil messages" category mute.

## Steps

1. **Add preference fields** to `instructor_notification_settings` (migration):
   - `message_sound_enabled boolean not null default true`
   - `message_sound_choice text not null default 'chime'` — values: `chime | ding | pop | none`
   - Update `useInstructorNotificationSettings` defaults, types, load + update payloads.

2. **Add chime assets**
   - Add three short (≤300 ms) royalty-free WAV/MP3 files in `public/sounds/`: `chime.mp3`, `ding.mp3`, `pop.mp3`.

3. **Create `useMessageSound` hook** (`src/hooks/useMessageSound.ts`)
   - Inputs: `instructorId`, current `unread` count.
   - Reads notification settings; on first user gesture caches an `HTMLAudioElement` per choice (browsers require gesture to unlock audio).
   - When `unread` increases vs prior render AND `sound_enabled` AND category not muted AND not in quiet hours AND `choice !== 'none'` → play at volume ~0.35.
   - Skips first run after mount (so it doesn't fire on initial load).
   - Throttle to once per 2s to avoid bursts.

4. **Wire it in** `MobileHomeRedesign.tsx` next to existing `useUnreadMessagesCount` call so the home page is the trigger point. (One-line addition.)

5. **Settings UI** in `NotificationsPage.tsx`
   - New card "Sound" with:
     - Toggle: "Play sound for new messages"
     - Select: Chime / Ding / Pop / None
     - "Preview" button that plays the chosen sound
   - Persist via existing dirty/save flow.

## Files
- new migration: `add message_sound_enabled, message_sound_choice columns`
- `src/hooks/useInstructorNotificationSettings.ts` — types + defaults + load/update
- `src/hooks/useMessageSound.ts` (new)
- `src/components/instructor/MobileHomeRedesign.tsx` — call hook
- `src/components/instructor/settings/pages/NotificationsPage.tsx` — Sound card
- `public/sounds/chime.mp3`, `ding.mp3`, `pop.mp3` (new)

## Notes
- Default ON with the gentlest "chime" choice.
- Respects existing Quiet Hours and "Pupil messages" mute.
- No schema change to `messages` table; we ride the existing realtime/refetch the unread hook already does.