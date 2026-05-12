# Replace second Call button with "Here" (text pupil)

In `src/components/instructor/UpNextExpanded.tsx`, the expanded tile's Actions section currently shows three Row 1 buttons: red **Call**, blue **Text**, blue **Navigate**. Since the unexpanded tile already has its own Call button, this red Call (lines 572–592) is the duplicate the user wants replaced.

## Change

Replace the red **Call** button with a **Here** button:

- Label: `Here`
- Icon: `MapPin` from lucide-react
- Style: same dimensions (flex 1.4, height 38, radius 12). Switch palette from red to the same green family used by **On My Way** (`#E8F8ED` bg / `#1A7A3C` text / `0.5px solid rgba(26,122,60,0.15)` border) so it reads as a positive arrival cue, not destructive.
- Disabled state: when `!pupilPhone`, same opacity/cursor treatment as before.
- onClick → calls existing `sendSMS(...)` helper with:
  `Hi {firstName}, I'm outside whenever you're ready 👋`
  Then shows a `toast.success("Text sent — pupil notified you're here")`.

## Out of scope

- No change to the Text, Navigate, On My Way, Running Late, Prep, or Arrived buttons.
- No change to the unexpanded tile's Call button.
- No change to handlers, routing, or state.
- No new dependencies.
