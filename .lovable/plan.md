## Instructor mobile home — improvements

Scoped to `src/components/instructor/MobileHomeDSM2026.tsx` and its child cards/hooks. No DB changes, no business-logic changes outside what's already wired. All data stays live (Google Calendar busy source, scheduled_lessons CRM data, etc.).

---

### 1. Pull-to-refresh + skeletons

- Wrap the page in a lightweight pull-to-refresh container (touch-driven, native feel — no library; ~80 lines).
- On release past threshold: trigger a refetch of every React Query key on the page in parallel (next lesson, day lessons, weekly stats, payments, attention counts, all 4 panel-list hooks, upcoming events).
- Show a small spinner pinned under the safe-area while refreshing.
- First-paint: replace the current "0/—" placeholders with shimmer skeletons in TodayStrip, NeedsAttentionCard counts, ScheduleCard rows, QuickAccessCard tiles, UpcomingEventsCard rows (reusing the existing iOS shimmer pattern from `mem://style/ios-consistency-patterns`).

### 2. Hero next-lesson card upgrades

Four sub-features, all on the existing `NextLessonCard`:

- **Live countdown + arrival window** — replace static "14:30" with "in 42 min" that ticks every 30s; pill colour goes green (>15 min buffer), amber (5–15), red (<5 or late).
- **Live ETA + traffic** — call Google Maps Routes API (already a connected connector) from current geolocation to the pickup `pickup_lat/lng`, refreshed every 60s while the card is visible. Cache result per lesson id for 60s. Show "23 min drive · leave by 14:07". If location denied, fall back silently to the countdown only.
- **One-tap actions row** — Call · WhatsApp · Navigate · On the way, rendered as 4 equal pill buttons under the lesson details. Wires existing pupil phone/whatsapp helpers and opens native maps.
- **Swipe between lessons** — horizontal swipe on the card peeks at the next 1–2 lessons of today (snap, paged). Dots indicator under the card. Only enabled when `dayLessons.length > 1`.

### 3. Schedule card upgrades

- **Day switcher chips** — Today / Tomorrow / Wed / Thu / Fri above the list. Tapping a chip changes the fetched day (uses existing `useDayLessons(instructorId, day)`).
- **Compact timeline toggle** — small icon top-right to switch between current stacked rows and a vertical hour-rail timeline (07:00 → 21:00, lessons as coloured blocks, gaps visible). Choice persisted to localStorage.
- **Gap-fill suggestions** — for any free gap ≥ 60 min that respects buffer + travel rules (per `mem://features/instructor/gap-offer-buffer-rules`), show an inline dashed slot with "Offer this slot →" that opens the existing fill-gap flow with travel buffer pre-applied.
- **Amounts owed per lesson** — small red £ pill on the lesson row if the pupil's balance < lesson cost; tapping opens the existing pre-lesson collection sheet.

### 4. Polish

- **Haptics** — `Haptics.impact({ style: 'light' })` via Capacitor on: summary tile tap (Needs Attention), schedule row tap, quick-access tile tap, pull-to-refresh trigger. No-op on web.
- **Section entrance animations** — first paint only, each section fades + rises 8px with 60ms stagger using existing `animate-fade-in`.
- **Live "last updated" chip** — under the Needs Attention header, "Updated 2 min ago" with a small refresh icon that re-invalidates the 4 count hooks. Updates from the most recent successful query `dataUpdatedAt`.

---

### Technical sketch

```text
MobileHomeDSM2026 (root)
├─ PullToRefresh wrapper        ← new
├─ HeroHeader
│   └─ NextLessonCard
│       ├─ CountdownPill        ← new (30s tick)
│       ├─ EtaRow               ← new (Google Routes, 60s)
│       ├─ QuickActionsRow      ← new (Call/WA/Nav/OnWay)
│       └─ SwipeDeck            ← new (paged peek of next lessons)
├─ TodayStrip                   ← shimmer when loading
├─ NeedsAttentionCard
│   ├─ LastUpdatedChip          ← new
│   └─ (existing chevron + panel)
├─ ScheduleCard
│   ├─ DayChips                 ← new
│   ├─ ViewToggle (list/timeline)
│   ├─ GapSuggestionRow         ← new
│   └─ LessonRow + OwedPill     ← new
├─ QuickAccessCard
├─ UpcomingEventsCard
└─ MembershipCard
```

New files (approx.):
- `src/components/instructor/home/PullToRefresh.tsx`
- `src/components/instructor/home/NextLessonCountdown.tsx`
- `src/components/instructor/home/NextLessonEta.tsx`
- `src/components/instructor/home/NextLessonActions.tsx`
- `src/components/instructor/home/NextLessonDeck.tsx`
- `src/components/instructor/home/ScheduleDayChips.tsx`
- `src/components/instructor/home/ScheduleTimeline.tsx`
- `src/components/instructor/home/GapSuggestionRow.tsx`
- `src/components/instructor/home/LastUpdatedChip.tsx`
- `src/hooks/useDrivingEta.ts` (Google Routes via gateway)
- `src/hooks/usePupilBalanceForLesson.ts` (per-lesson owed amount)
- `src/lib/haptics.ts` (thin Capacitor wrapper, no-op on web)

Edited files:
- `MobileHomeDSM2026.tsx` — wire new wrapper, pass refetch list, add skeletons, mount new sub-components.
- `NextLessonCard` — slot in countdown/ETA/actions/deck.
- `ScheduleCard` — chips, toggle, gap rows, owed pills.

### Ordering

Suggest shipping in this order so each chunk lands as a usable improvement:

1. Pull-to-refresh + skeletons (foundational, instant feel)
2. Hero: countdown + one-tap actions (no external dep)
3. Hero: ETA + traffic (Google Routes)
4. Hero: swipe deck
5. Schedule: day chips + owed pills
6. Schedule: gap-fill + timeline toggle
7. Polish: haptics, entrance animations, last-updated chip

Confirm and I'll start with step 1.
