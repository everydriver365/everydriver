

## Plan: Add lift shadow to the DSM logo in the mobile header

Apply the same `shadow-premium` lift treatment used on tiles to the DSM logo image in the instructor mobile header so it visually matches the elevated tile language.

### Change

In `src/components/instructor/MobileBlueHeader.tsx`, wrap the `<img>` for the DSM logo in a small rounded container that carries the `shadow-premium` class, so the logo sits on a subtle white pill with the same soft 3-layer drop shadow as the tiles.

```tsx
<div
  className="shadow-premium flex items-center justify-center"
  style={{ background: "#FFFFFF", borderRadius: 10, padding: "4px 8px" }}
>
  <img src={dsmLogo} alt="DSM" className="h-7 w-auto object-contain" />
</div>
```

Behaviour:
- Logo size unchanged (`h-7`).
- White rounded pill (`radius 10`, `4px 8px` padding) hosts the shadow so the lift is visible against the `hsl(var(--dsm-bg))` header background.
- Back-button branch unchanged.
- Dark-mode: shadow utility already scoped — no extra work.

### File to edit

- `src/components/instructor/MobileBlueHeader.tsx` — wrap the logo `<img>` in a shadowed pill container.

### QA

Open `/instructor` at 390px and confirm the DSM logo in the top-left now has a visible soft drop shadow matching the tiles. Toggle dark mode to confirm it still reads cleanly.

