Add the 18 tiles missing from the Quick Access grid back into `QUICK_ACCESS` in `src/components/instructor/MobileHomeDSM2026.tsx`, grouped next to their siblings.

## Tiles to restore

**Lessons cluster** (after Schedule / Course planner)
- Plan ahead → `/instructor/diary` (Lightbulb)
- Log test result → `/instructor/test-results` (ClipboardCheck)

**Pupils cluster** (after Pupils)
- Messages → `/instructor/messages` (MessageSquare)
- Waiting room → `/instructor/waiting-room` (Users)

**Money cluster** (after Reporting)
- Earnings → `/instructor/month-end` (FileBarChart)
- Weekly report → `/instructor/weekly-report` (BarChart3)
- Tasks due → `/instructor/outstanding-tasks` (ClipboardCheck)
- End of day → `/instructor/end-of-day` (Moon)

**Vehicle / location cluster** (after Vehicle / GPS tracking)
- Track lesson → `/instructor/tracking` (MapPin)
- Sat nav → `/instructor/satnav` (Navigation)
- Find my car → `/instructor/find-my-car` (Car)
- Find fuel → `/instructor/fuel` (Fuel) — the one flagged earlier
- Find nearby → `/instructor/find-nearby` (MapPin)
- Locations → `/instructor/locations` (MapPinned)

**Network cluster** (before Support)
- Nearby ADIs → `/instructor/nearby-friends` (Users)
- Find colleague → `/instructor/fleet-map?mode=colleagues` (Users)
- Platform updates → `/instructor/platform-updates` (Megaphone)

**Admin cluster** (near Plan & billing)
- Your plan → `/instructor/plans` (Crown)

## Implementation

- Single edit to `QUICK_ACCESS` array in `MobileHomeDSM2026.tsx`.
- Add the Lucide imports that aren't already present (`Lightbulb`, `ClipboardCheck`, `MessageSquare`, `FileBarChart`, `BarChart3`, `Moon`, `Navigation`, `Car`, `Fuel`, `MapPinned`, `Megaphone`, `Crown`). The existing `Icon3D` mapping already auto-upgrades these to 3D PNGs (fuel, car, compass, map-pin, lightbulb, bar-chart, etc.), so no new asset work is needed.
- Use existing `BLUE_BG` / `NAVY_BG` / `RED_BG` / `GREY_BG` tone constants, matching tone groups (vehicle = BLUE, money = NAVY/BLUE, network = GREY, admin/settings = GREY).
- No changes to routes, `tileRegistry.ts`, `Icon3D.tsx`, or `InstructorQuickAccessAll.tsx` (it already iterates `QUICK_ACCESS`).

After this, the "Find fuel" tile and all other previously-missing Quick Access tiles will reappear on `/instructor/quick-access/all` and in the home Quick Access search.
