
The premium polish (layered shadow, hairline border, tabular nums, SF Pro stack, spring animations) is applied via shared primitives:

**Already covered everywhere these are used:**
- `InstructorCard` — used across instructor pages
- `IOSTile` + `IOSTileGroup` — canonical tile, used on most instructor sub-pages
- `PremiumStatTile` + animated counters — only on `HomeTodaySchedule`

**NOT yet covered (still using older styles):**
1. `WaitingRoomPromoTile.tsx` — hand-rolled inline styles, hardcoded shadow `0 12px 28px...`, radius 14
2. `DesktopNavigationCard.tsx` — uses old `shadow-lift` / `shadow-lift-hover` / `rounded-2xl`
3. `QuickStatsChips.tsx` — plain `bg-card border border-border rounded-full`, no premium shadow, no tabular-nums class
4. `QuietDayEmpty.tsx` — `border border-border/40 rounded-2xl`, no premium shadow
5. `InstructorPageHeader.tsx` — fine as a header, but title isn't tabular and no hairline divider underneath
6. Any page-level cards built ad-hoc with raw `bg-card rounded-2xl shadow-*` instead of `InstructorCard`/`IOSTile`

**Plan to make it truly universal:**
1. Update `WaitingRoomPromoTile` → use `IOSTile` primitive (delete duplicated styling)
2. Update `DesktopNavigationCard` → swap `shadow-lift*` for `shadow-premium`/`shadow-premium-lg`, radius 16, 0.5px border
3. Update `QuickStatsChips` → add `shadow-premium`, `tabular-nums` class, 0.5px border
4. Update `QuietDayEmpty` outer card → `shadow-premium`, radius 16, 0.5px border
5. Add `tabular-nums` + tighter tracking to `InstructorPageHeader` title
6. Grep for ad-hoc `shadow-lift` / `rounded-2xl bg-card` usages in `src/pages/instructor*` and `src/components/instructor/**` and migrate to primitives or new shadow utilities

Result: every tile, chip, header, and card across the instructor app shares the same premium language.
