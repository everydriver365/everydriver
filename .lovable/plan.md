# Round 2 — Audit & Fix Plan

Scope: all remaining Medium severity backlog items, executed in one pass after exploration. Output format will follow the requested 3-part report (Fixed / Verified Clean / Deferred).

## §1 Dashboard tiles — live data verification

Files to audit:
- `src/components/instructor/InstructorMobileHome.tsx` (primary mobile home)
- `src/components/instructor/MobileHomeDSM2026.tsx`, `PremiumIOSHomeView.tsx`, `AppStyleHomeView.tsx`, `IOSNativeHomeView.tsx` (variants in use)
- `NextLessonTile.tsx`, `NextUpTile.tsx`, `HomeTodaySchedule.tsx`, `HomeMoneyOverview.tsx`, `HomeGreeting.tsx`
- `OutstandingTasksCard.tsx` + `src/pages/InstructorAttentionLab2026.tsx` (Needs Attention)
- `ActivityTilesGrid.tsx`, `InsightTilesGrid.tsx`, `QuickActionTiles.tsx`
- Hooks: `useInstructorPaymentsData`, any `useDashboardStats`, `useNeedsAttention`, `useNextLesson`

Checks & fixes:
1. "Lessons today" — confirm count comes from `scheduled_lessons` filtered to `start_time` between today 00:00–24:00 London + `deleted_at IS NULL` + status != cancelled. Add realtime subscription or invalidation on lesson insert/cancel if missing.
2. "Next free slot" — verify call into availability engine (`getNextAvailableSlot` / `availability-london-timezone`), not a static string.
3. "Next lesson tile" — pupil name, time, duration, postcode, lesson type all from the next `scheduled_lessons` row (chronologically across days, not just today).
4. "Outstanding balance" — make consistent with Round 1 EarningsDashboard logic: `sum(abs(account_balance)) where account_balance < 0 and deleted_at is null`.
5. "Needs Attention" counts (Jobs/Tests/Calls/Enq's + urgent) — replace any `|| 0` masking with real queries; urgent = sum of the four, not hardcoded.
6. "Earnings this week / lessons this week" — apply `deleted_at IS NULL` filter; align UK week boundary.

Per memory rule (mem://constraints/no-hardcoded-fallbacks-live-data-only): remove `||`/`??` fallbacks on DB values; show empty/needs-setup state instead.

## §2 Navigation sweep

Trace `src/App.tsx` routes plus instructor portal router. Verify each of:
- Quick Access tiles → matching route exists
- "See all 43 tools" → tools hub route
- "Add lesson" → `AddLessonSheet` open + complete booking flow
- "Fill gaps" → gap-filler logic + result screen
- Lesson card chevron → lesson detail
- Pupil card chevron → pupil profile
- "Edit pins" → pin editor route
- Payment/refund flow back paths
- Needs Attention items (Jobs/Tests/Calls/Enq's) → detail views
- "View in Tax Hub" → tax hub
- Earnings tiles (Owes Money, Payments This Month) → detail views
- Back nav works on every screen (no trapped modals)

Fix any dead links, missing routes, or chevrons wired to `onClick={() => {}}`.

## §3 Form validation

Forms to audit (add zod schemas + inline errors where missing):
- `AddLessonSheet` — pupil, date, time, duration, type required; date not in past; slot not double-booked
- Add pupil dialog — name + (phone OR email); email/phone/postcode format
- `AddCalendarEventDialog` — title + date; date not in past
- `TakePaymentModal` / Add payment — amount > 0; sensible cap vs balance; confirm step
- `RefundModal` — amount ≤ original; **show pupil net after fee deduction** (deferred from R1, implement now); confirm step
- Edit pupil — email/phone/postcode validation on save
- `AccountSettings` — email/phone format; password change requires current password

For each: success toast + immediate UI refresh on relevant screens.

## §4 Empty & error states

Screens to verify each has: loading skeleton, empty state, error state with retry, no NaN/undefined.
- Schedule, Pupils list, Payment history, Earnings (£0 not blank), Needs Attention (0 hides urgent pill), Quick Access tools, Upcoming events, Notifications list.

## §5 Notifications

- Verify push triggers exist for: new booking, lesson cancellation, payment received, new enquiry, upcoming lesson reminder (check edge functions + DB triggers).
- Confirm per-type toggles exist in notification settings UI and persist to DB (not localStorage default).
- Verify Needs Attention badge updates on action/dismiss (realtime or invalidation).
- Verify in-app notifications list marks read correctly.

## Constraints

- No mobile layout changes (per mem://constraints/mobile-update-policy) — data wiring & validation only on mobile screens; visual changes restricted to desktop or to bug-fix scope.
- Live data only — no fallbacks; surface empty states (mem://constraints/no-hardcoded-fallbacks-live-data-only).
- London timezone for any date math (mem://constraints/availability-london-timezone).
- UK Service Fee naming preserved.

## Deliverable

Single response with:
- **PART 1 — Fixed**: file, what was broken, fix applied ✓
- **PART 2 — Verified clean**: list audited & confirmed working
- **PART 3 — Deferred**: items moved to Round 3 (email settings, notification templates, cash/bank receipt coverage, UI polish)

All fixes shipped in one pass, no mid-pass confirmation.
