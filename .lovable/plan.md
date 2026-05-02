## Goal
Add a single **"Do this next"** action card on the instructor home page that picks the most relevant action right now — replacing passive scrolling with one decisive tap.

## Where it sits
Above `HomeToolsHub` (search/Frequently used/Browse) and below the existing `NextUpTile`. The card only renders when `NextUpTile` is **not** showing an imminent lesson (no lesson within ~45 min) — otherwise the next lesson is already the most relevant action and we don't want stacked CTAs.

```text
[ NextUpTile — only when lesson imminent ]
[ Do this next — only when no imminent lesson ]
[ Search ]
[ Frequently used ]
[ Browse all tools ]
```

## Priority engine
Pick the highest-priority signal from this ranked list. First match wins, render that card. If nothing matches, render nothing (don't show an empty state).

| Rank | Trigger | Card content | Tap action |
|---|---|---|---|
| 1 | Pupil owes ≥ £20 from a lesson finished in last 7 days (uses `usePupilRetentionAlerts` / payments query) | "Chase £{amt} from {Pupil}" + last lesson date | `/instructor/pay?pupilId=…` |
| 2 | A pending test-swap offer expires in <24h (`useSoonestPendingOffer`) | "Respond to swap offer · expires in {x}h" | `/instructor/test-requests` |
| 3 | A gap ≥ 90min tomorrow with ≥ 1 waiting-list pupil nearby (`useGapSuggestions`) | "Offer {time} gap to {n} waiting pupils" | `/instructor/gaps` |
| 4 | Pupil hasn't booked in 21+ days but has prepaid hours (`useChurnRiskScore`) | "Re-engage {Pupil} — {h}h credit unused" | `/instructor/pupils/{id}` |
| 5 | A pupil's theory/practical test is in <14 days with <5 lessons booked | "Book test prep for {Pupil} — test {date}" | `/instructor/course-planner?pupilId=…` |
| 6 | Vehicle MOT/service due in <30 days (`useAutoMaintenanceSetup`/vehicle health) | "Book MOT — due {date}" | `/instructor/vehicle-health` |
| 7 | Weekly report ready and unread | "Read this week's summary" | `/instructor/weekly-report` |

All triggers reuse hooks that already exist — no new queries.

## Card design
Single white rounded-22 card matching `NextUpTile` style. Left: small tinted icon (tone derived from category — amber for money, blue for swaps, green for gaps, etc.). Centre: bold one-line title + subtle subtitle. Right: chevron. Whole card tappable. Optional secondary "Snooze" link (top-right, tiny grey) that hides this specific card for 24h via `localStorage` key `dsm:next-action-snooze:{rank}:{date}`.

```text
┌──────────────────────────────────────────────┐
│ 💷  Chase £45 from Sarah                  ›  │
│     Lesson Tue · 3 days ago         Snooze   │
└──────────────────────────────────────────────┘
```

Header label above the card: `DO THIS NEXT` (uppercase, matches existing iOS section label style).

## Files
- New: `src/components/instructor/DoThisNextCard.tsx` — runs priority engine, renders card.
- New: `src/hooks/useNextBestAction.ts` — composes existing hooks, returns `{ rank, title, subtitle, icon, tone, route, snoozeKey } | null`.
- Edit: `src/components/instructor/PremiumIOSHomeView.tsx` — insert `<DoThisNextCard />` after the `NextUpTile` section, gated on `!nextLesson || nextLesson.minutesUntil > 45`.

## Out of scope
- No backend changes, no new tables.
- No analytics — can layer in later via existing funnel tracker.
- Mobile layout untouched (per Core memory rule); the card is part of the existing scroll, not a fixed element.
