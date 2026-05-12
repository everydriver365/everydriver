# Replace second action-row button with "Here" (arrival text)

## Where
`src/components/instructor/UpNextExpanded.tsx`, the comms row inside the Actions block (lines ~570–627). The row currently is:

`[ Call (red) ] [ Text (blue) ] [ Navigate (blue) ]`

The second button (Text) is replaced.

## Change
Swap the **Text** button for a **Here** button that uses the existing `sendSMS()` helper to open the user's SMS app with a pre-filled arrival message to `pupilPhone`.

- Label: `Here`
- Icon: `BellRing` (from lucide-react — already an available icon, add to imports)
- Same blue style as the current Text button (`#EEF3FF` bg, `#1A52A0` text, 38px height, flex 1, 12px radius)
- Disabled (50% opacity, not-allowed) when `pupilPhone` is falsy, matching Call button behavior
- Pre-filled message:
  `"Hi {firstName}, I've arrived for your driving lesson — see you in a moment."`
  (uses existing `firstName` derived at line 426)
- Tap behavior: calls `sendSMS(msg)` which already triggers `sms:{phone}?body=...` and opens Messages

## Out of scope
- No changes to handlers, navigation, on-the-way / running-late / arrived flows
- No edits to the Call or Navigate buttons (positions 1 and 3 stay identical)
- No new libraries; `BellRing` is part of the lucide-react icon set already in use

## Note on wording
You said "second call button" but the action row only has one Call button. I'm interpreting "second" as the second button in the comms row (currently "Text"). If you actually meant a different button, tell me which one to replace and I'll move it.
