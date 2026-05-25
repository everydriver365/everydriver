# Google-Maps-style reskin for the live tracking screen

Visual reskin only. No turn-by-turn, no ETA, no routing — we're not a sat-nav. We keep what the screen already does (show the instructor's car moving on a map during a live lesson) and just give it the polished navigation-app *look*.

## Target screen

`src/pages/InstructorLiveSession.tsx` — the existing live tracking page used in the instructor mobile/Despia/TestFlight build.

## What we add (pure overlay, no native code)

```text
┌──────────────────────────────────────┐
│  🟢 LIVE · 00:42:13       [Pupil ▾] │  ← teal status banner (replaces sat-nav banner)
│  Sarah Jones · Lesson in progress    │
├──────────────────────────────────────┤
│                                      │
│            [ MAP ]                   │
│         car arrow + path             │
│                                  ⊙   │  ← floating compass
│                                  🔍  │  ← recenter
│                                  🔇  │  ← mute alerts
│                                  ⚠   │  ← hazard / SOS
│                                      │
│  ┌──┬──┐                             │
│  │30│28│ ← speed-limit + current     │
│  └──┴──┘                             │
├──────────────────────────────────────┤
│  Distance 4.2 mi · Time 42 min       │  ← white bottom sheet
│              [ End Lesson ]          │  ← red pill (replaces Exit)
└──────────────────────────────────────┘
```

## What we drop from the reference

- ❌ Turn arrow / "0.2 mi Tipner W" — no routing
- ❌ Lane-guidance arrows — no routing
- ❌ "5 min · 13:03" arrival ETA — no destination
- ❌ Alt-route fork button — no routing

## What we keep from the reference (visual language only)

- ✅ **Teal banner** top — repurposed as the live-lesson status card (timer + pupil name)
- ✅ **Floating circular white buttons** down the right edge — compass, recenter, mute, hazard/SOS
- ✅ **Speed-limit + current-speed pill** bottom-left — already have the data from `phoneSpeedLimit.ts` + Capacitor geolocation
- ✅ **White rounded bottom sheet** with trip stats + primary red action button
- ✅ **Blue route polyline** + chevron car marker, tilted camera that follows heading
- ✅ Cleaner map style (POIs/transit hidden, like the reference)

## Files touched

1. `src/pages/InstructorLiveSession.tsx` — swap the existing top bar / controls / bottom controls for the new overlay components. Keep all the GPS, polling, and session logic untouched.
2. New `src/components/instructor/live-map/LiveStatusBanner.tsx` — teal top card (timer + pupil).
3. New `src/components/instructor/live-map/MapControlStack.tsx` — right-edge floating buttons.
4. New `src/components/instructor/live-map/SpeedBadge.tsx` — limit + current-speed pill.
5. New `src/components/instructor/live-map/LiveBottomSheet.tsx` — distance / duration / End Lesson.
6. `src/index.css` — add `--live-teal: 178 60% 22%` token (semantic, used only inside these components).

All colours via HSL tokens, all radii follow `mem://style/instructor-radius-scale-2026` (pills 999px, sheets 16px, buttons 12px).

## Despia / TestFlight compatibility

100% web layer — no Capacitor plugins added, no native build changes. Ships as soon as it's published; appears in TestFlight on next Despia reload (no Xcode rebuild needed).

## What we explicitly do NOT change

- Tracking logic, GPS polling cadence, snap-to-road, session start/end
- Database, RLS, edge functions
- Any other portal screen
- Mobile layout policy on screens other than this one

## Out of scope (future, ask if you want them)

- Voice prompts
- 3D building tilt detail
- Background GPS (already separately covered by the Capacitor bridge for the recorder)
