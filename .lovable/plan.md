
# All-in App Improvements — Phased Rollout

This bundles every suggestion from the previous message into 5 phases, ordered to ship value early and keep each phase independently testable. Nothing here changes mobile-only layouts unless explicitly noted.

---

## Phase 1 — Payment Feed extensions (build on what we just shipped)

**1.1 Running balance column**
- In `PupilPaymentFeed.tsx`, after sorting `filtered` chronologically (oldest→newest), compute a per-row running balance, then re-sort newest→oldest for display.
- Show balance as a small muted figure on the right of each row (e.g. `Bal £120.00`), with red tint if negative.

**1.2 Monthly summary headers**
- Group displayed entries by `format(parseISO(recorded_at), "MMMM yyyy")`.
- Sticky header per group: `April 2026 · £240 paid · 6 lessons` (lessons = count where `lesson_id` is set).
- Use the existing iOS uppercase section-header style.

**1.3 Receipt view**
- Add a "Receipt" button inside the expanded collapsible row.
- New component `PupilPaymentReceiptSheet.tsx` (Drawer) showing: pupil name, instructor name + ADI number, payment amount, method, recorded date, linked lesson summary, transaction ID.
- "Download PDF" uses existing `src/utils/generatePDFBackend.ts`. "Share" uses `src/lib/share-utils.ts`.

**1.4 Refund / dispute flag**
- Add "Flag for review" button in the expanded row.
- New table `payment_disputes` (id, payment_id FK, pupil_id, instructor_id, reason text, status enum `open|resolved|dismissed`, created_at). RLS via `get_instructor_id_for_user(auth.uid())` for instructor read/update, pupil insert/read for own.
- Surface count on the instructor `OutstandingTasksPage` as "Payment queries (n)".

---

## Phase 2 — Pupils page (current route `/instructor/pupils`)

**2.1 Status chips on each pupil card**
- Extend `ExpandablePupilCard` / `PupilCardStack` to show up to 2 chips per pupil:
  - `Owes £X` from `usePupilPaymentStatus`
  - `Test in Nd` from pupil `test_date`
  - `No lesson booked` (no future `scheduled_lessons` row)
  - `Dormant Nw` from `usePupilRetentionAlerts`
- Chip styling: rounded-full, 11px, colour-coded (red/amber/slate). Desktop and tablet only — mobile card layout unchanged per memory rule.

**2.2 Smart sort toggle**
- Segmented control above the list: `Needs attention` (default) / `A–Z` / `Recent activity`.
- "Needs attention" score = owes_amount × 0.5 + (test_within_14d ? 30 : 0) + dormant_weeks × 5.
- Persist choice in localStorage key `pupils:sort`.

**2.3 Swipe actions (desktop only — mobile excluded)**
- On hover-row reveal: Quick Pay, Add Lesson, Add Note (already have `PupilNoteSheet`).
- Mobile keeps existing card behaviour (per `mem://constraints/mobile-update-policy`).

**2.4 Bulk WhatsApp**
- Multi-select checkboxes on pupil rows, top action bar "Message N pupils".
- Uses existing `useWhatsAppTemplates` and `useSendViaWhatsApp` to pick a template and broadcast. Confirmation dialog before send.

---

## Phase 3 — Instructor daily flow

**3.1 "Day at a glance" dashboard widget**
- New `DayAtAGlanceCard.tsx` composing existing hooks:
  - `useNextLessonDetails` + `useInstructorEnRouteETA` → next lesson + ETA
  - `useDailyEarnings` + `useMonthlyGoals` → today vs goal progress bar
  - `useUrgentAlerts` count
  - `useTomorrowWeather` summary
- Mounted on `InstructorPortalDashboard` desktop view only.

**3.2 Voice quick-add on FAB**
- Add a mic button beside `+` in `QuickActionsFAB.tsx`.
- Uses `useVoiceToText`; transcript piped through new edge function `parse-lesson-voice` (Lovable AI gateway, `google/gemini-2.5-flash`) returning `{pupil_name, date, time, location, duration_minutes}`. Pre-fills `AddLessonSheet`.

**3.3 End-of-lesson sheet**
- New `EndOfLessonSheet.tsx` triggered when a lesson `end_time` passes (via `useLessonEndAlert`).
- Three tabs: Progress (DVSA competency sliders from `src/constants/dvsaSyllabus.ts`), Payment (reuse `PupilPaymentDrawer`), Note (reuse `PupilNoteSheet`).
- Single confirm CTA writes all three in a transaction. Uses `increment_pupil_balance` RPC for the payment leg.

---

## Phase 4 — Pupil-side improvements

**4.1 Test Readiness widget**
- New `TestReadinessCard.tsx` on the pupil portal home.
- Score 0–100 = weighted average of competency ratings minus churn risk penalty (`useChurnRiskScore`).
- Lists top 3 lowest-rated competencies with a "Practise next" button that pre-fills the booking flow with the relevant lesson type.

**4.2 Smart "Book next lesson" suggestions**
- On pupil home, surface 2–3 best-fit slots from instructor's `useGapSuggestions`, ranked by match to pupil's preferred duration/day.
- Inline "Book this slot" → existing `LessonScheduler` confirmation.

**4.3 Streak badge**
- New `PupilStreakBadge.tsx` showing weeks with ≥1 lesson.
- New `pupil_streaks` view (computed from `scheduled_lessons` grouped by week) — read-only.
- Subtle confetti via existing motion utilities when a new week is added.

---

## Phase 5 — Polish & trust

**5.1 Skeleton parity**
- Audit pages still using empty `<div />` loading states; replace with `useSkeletonMorph` shimmer to match iOS consistency memory.
- Target list (desktop only): `InstructorAccounts`, `InstructorMessages`, `InstructorPipeline`, `PupilPortalHistory`.

**5.2 Empty-state CTAs**
- For each empty list audit: ensure exactly one primary CTA (e.g. "Add your first pupil", "Take your first payment").
- New shared `EmptyState.tsx` primitive (icon, headline, body, CTA) used across the targets above.

**5.3 Offline pill**
- New `OfflineStatusPill.tsx` mounted in `InstructorPortalLayout` header.
- Reads from `useOfflineGPSQueue` + `getAllItems('syncQueue')`. Renders only when offline OR queue length > 0. Tap → drawer listing queued items.

---

## Technical Notes

- **RLS**: All new tables use `public.get_instructor_id_for_user(auth.uid())` for instructor scoping; pupil access via `auth.uid()` matched to `pupils.auth_user_id`.
- **Atomicity**: Phase 3.3 end-of-lesson save uses existing `increment_pupil_balance` RPC. No direct `account_balance` writes.
- **Mobile policy**: Phases 2.3, 3.1 and 5.1 are desktop-only per `mem://constraints/mobile-update-policy`. Mobile equivalents only on explicit request.
- **AI**: Voice parsing (3.2) uses `LOVABLE_API_KEY` via gateway; no new secrets.
- **No forbidden providers**: All payment touchpoints stay within Klarna / Clearpay / Square / GoCardless / SumUp.
- **Service Fee labelling**: Receipt view (1.3) labels any platform fee strictly as "Service Fee".

---

## Suggested ship order

1. Phase 1 (1–2 days) — completes the payment story
2. Phase 2 (2 days) — biggest daily-use win for instructors
3. Phase 5 (1 day) — quick polish wins to build trust
4. Phase 3 (3 days) — habit-forming workflows
5. Phase 4 (2 days) — pupil retention layer

Reply **approve** to start with Phase 1, or tell me to re-order / drop any phase.
