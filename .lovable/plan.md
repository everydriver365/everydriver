## Why the previous changes didn't show up

The instructor mobile home screen (`/instructor`) does **not** use `InstructorMobileHeader` or `MobileBlueHeader`. Both files I edited in earlier turns are unused on this route:

- `InstructorPortalLayout.tsx` line 726 explicitly skips `MobileBlueHeader` when `isHomePage` is true.
- The home view `MobileHomeDSM2026.tsx` renders its own `HeroHeader` inline (the dark navy bar in your screenshot with WDS logo, "Ken", Phone, Bell, Menu).

That's why the car icon never appeared — it was being added to a header that isn't on screen.

There is no SOS icon in this header either; the SOS button lives elsewhere (in the older `InstructorMobileHeader` variant), so it has also never been visible on the DSM 2026 home.

## The fix

Add the Car icon to the real header — the `HeroHeader` component inside `src/components/instructor/MobileHomeDSM2026.tsx`.

1. Import `Car` from `lucide-react` (already imports `Phone`, `Bell`, `Menu`).
2. In the right-side button row (around line 812-816), insert a new `HeroButton` using `Car` between the `Phone` and `Bell` buttons:
   ```
   <HeroButton Icon={Phone} onPress={onPhone} />
   <HeroButton Icon={Car} onPress={onLiveTrack} />
   <HeroButton Icon={Bell} ... />
   <HeroButton Icon={Menu} ... />
   ```
3. Add an `onLiveTrack` prop to the `HeroHeader` props type (alongside `onPhone`, `onBell`, `onMenu`).
4. In the parent (line 317-330) wire it up: `onLiveTrack={() => navigate("/instructor/live")}`.

## Cleanup (optional but recommended)

Revert the unused `Car` icon additions from `InstructorMobileHeader.tsx` and `MobileBlueHeader.tsx` so future edits don't compound the confusion. Leave the hamburger "Live Track" menu item if you still want it as a secondary entry point.

## Files touched

- `src/components/instructor/MobileHomeDSM2026.tsx` — add Car button + prop wiring.
- (optional) revert prior Car additions in `MobileBlueHeader.tsx` and the SOS-row addition in `InstructorMobileHeader.tsx`.
