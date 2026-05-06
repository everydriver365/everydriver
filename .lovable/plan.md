Remove the auto-pause/resume overlay from the live tracking session.

Currently, after ~5 seconds of zero speed, the bottom panel switches into a "Paused" state and shows a Resume button. You don't want that — tracking should just keep running continuously.

Changes:

1. `src/pages/InstructorLiveSession.tsx`
   - Always pass `paused={false}` (and drop `onResume`) to `FloatingSessionTimer` so the panel never enters paused mode.
   - Remove the now-unused `stoppedSinceMs`, `manuallyResumedAt`, `isPaused`, `handleResumeFromPaused`, and the per-second tick effect that drove them.

2. No change needed to `FloatingSessionTimer` itself — it already hides the overlay and Resume button when `paused` is false. Leaving the prop in place keeps the option open for the future without changing current behaviour.

Result: the live map keeps tracking continuously, with no Paused overlay or Resume button, even when stopped at lights or in traffic.