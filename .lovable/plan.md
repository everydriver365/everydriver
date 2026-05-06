## Add Source Badge to Live Map

Add a small floating pill on the fullscreen live map in `src/pages/InstructorLiveSession.tsx` that always shows which feed is currently driving the map.

### Change
- File: `src/pages/InstructorLiveSession.tsx`
- Insert a badge just above the existing `DeviceSelectorDropdown` (around line 1301), positioned `absolute top-4 right-4 z-30`.
- Label: `Source: Phone` when `isPhoneProvider` is true, otherwise `Source: Radius`.
- Style: rounded-full pill, `bg-black/60 backdrop-blur`, white 11px text — matches the existing floating UI on the map.

No logic changes; purely a visual indicator confirming the wiring already in place (map coords, poller gating, and start-gate all branch on `isPhoneProvider`).
