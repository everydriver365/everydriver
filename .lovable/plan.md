

## Plan: Auto-Detect Running Late + Alert with ETA Message + Voice Command

### How it works

When the instructor has a lesson coming up, the system compares the **live traffic ETA** (already fetched by `useTrafficETA`) against the **time remaining until the lesson starts**. If the ETA exceeds the time remaining (i.e., they won't make it on time), an alert banner appears on the Next Up tile offering to send the pupil a message with the calculated ETA arrival time. This also integrates with voice commands.

### Changes

**1. New hook: `src/hooks/useRunningLateDetection.ts`**
- Accepts `etaMinutes`, `minutesUntil`, `pupilName`, `pupilPhone`, and `pickupPostcode`.
- Returns `{ isRunningLate, lateByMinutes, suggestedMessage }`.
- Logic: `isRunningLate = etaMinutes > 0 && etaMinutes > minutesUntil` (with a 2-min buffer to avoid false positives).
- `lateByMinutes = etaMinutes - minutesUntil`.
- `suggestedMessage` = pre-formatted SMS like "Hi {name}, I'm running about {X} mins late. My ETA is {time}. Sorry for the delay!"

**2. Update `src/components/instructor/NextUpTile.tsx`**
- Import and use the new hook.
- When `isRunningLate` is true, render an **amber/orange alert banner** between the pill badges and the expanded content:
  - Shows: warning icon + "You may arrive ~X min late" text.
  - A "Send ETA" button that opens the SMS app with the pre-formatted message.
  - A dismiss button to hide the alert for this session.
- The banner is always visible (not just when expanded), ensuring the instructor notices it.
- Add haptic feedback when the alert first appears.

**3. Update `src/components/instructor/VoiceControlButton.tsx`**
- Add a new `onSendLateETA` prop and a `isRunningLate` prop.
- Add voice command patterns: `["running late", "send eta", "tell them I'm late", "send late message"]`.
- When triggered: calls `onSendLateETA()` which sends the pre-formatted SMS, and speaks confirmation "Late message sent".

**4. Wire up in `src/components/instructor/InstructorMobileHome.tsx`**
- Pass the running-late state and send-ETA handler from `NextUpTile`'s context to `VoiceControlButton` (if it's rendered on the home page). If `VoiceControlButton` isn't currently on the home page, add it as a floating button.

### No database changes required
All logic uses existing `useTrafficETA` data and native SMS via `sms:` links.

