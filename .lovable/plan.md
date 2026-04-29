## Goal

Remove the blue greeting hero card (the "WEDNESDAY / Hi Ken / 1 lesson · First 12:00:00 · £45" tile with the DH avatar) that sits directly under the DSM header on the instructor mobile home page (`/instructor`).

## What I found

I searched the codebase exhaustively for the strings "WEDNESDAY", "First 12:00:00", "Hi Ken" and the surrounding markup. The only matching greeting in code is the **plain-text** greeting in `src/components/instructor/InstructorMobileHome.tsx` (lines 451–478):

```tsx
{/* 1. Quiet greeting */}
<div style={{ padding: "6px 20px 20px" }}>
  <h1>
    Hi {firstName}
    · {format(new Date(), "EEEE")}
  </h1>
  <p>Here's what needs you today</p>
</div>
```

This is the only piece of code rendering "Hi {firstName}" on the instructor home. The full blue card with avatar + lesson stats shown in your screenshot does not match any committed component — it appears to be a styled wrapper or a recently-introduced variant I can't find from the screenshot alone.

## Plan

1. **Remove the greeting block** at lines 451–478 of `src/components/instructor/InstructorMobileHome.tsx` entirely so nothing renders above the `WarmHomeTiles` "Action needed" tile.
2. **Verify in preview** after removal — if the blue card with avatar/£45/First 12:00:00 is still visible, it's coming from a component I haven't identified yet. In that case I will:
   - Inspect the live DOM via the browser tools to read the rendered class names / inline styles
   - Trace those styles back to the component file and remove that as well

## Out of scope

- No changes to `WarmHomeTiles` (Action needed, Up next today, Week at a glance rings)
- No changes to `MorningBriefingCard`, `ActivityTilesGrid`, or any tile below the greeting
- No design-system token changes
