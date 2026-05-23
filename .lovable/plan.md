## Change

In `src/components/instructor/MobileBlueHeader.tsx`, gate the phone-divert button and the `AutoTrackingIndicator` behind the existing `isHomePage` prop so they only render on the instructor mobile home page. On all other pages (subpages and other tab roots) the right-hand cluster will show only Bell, Plus, Menu.

Bell, Plus, and Menu remain on every page. No other files touched, no logic changes to divert/tracking themselves.

## Snippet

```tsx
{isHomePage && (
  <>
    <button onClick={() => setDivertSheetOpen(true)} ...>
      <Phone ... />
    </button>
    <AutoTrackingIndicator instructorId={instructorId} />
  </>
)}
```

The `AICallDivertSheet` mount stays where it is (only opens when the button is pressed, so no impact on non-home pages).
