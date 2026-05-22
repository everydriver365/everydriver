# MTD Quarter-Deadline Dashboard Tile

Investigation confirmed: `mtd_quarterly_periods` (0 rows) and `mtd_instructor_settings` (0 rows) exist but nothing reads them; `InstructorMTD.tsx` is a marketing page; the only MTD UI today is a hardcoded countdown to 6 Apr 2026 (now in the past). This plan adds a real, dynamic deadline tile that works for every instructor without depending on seeded rows.

## PART 1 — Pure utility + hook

**`src/lib/mtdDeadlines.ts`** (new, pure, no Supabase)

UK MTD ITSA quarterly periods → filing deadlines:

| Q | Period           | Deadline |
|---|------------------|----------|
| 1 | 6 Apr – 5 Jul    | 7 Aug    |
| 2 | 6 Jul – 5 Oct    | 7 Nov    |
| 3 | 6 Oct – 5 Jan    | 7 Feb    |
| 4 | 6 Jan – 5 Apr    | 7 May    |

Exports:
- `getCurrentTaxYear(now?: Date): number` — returns start year (tax year starts 6 Apr; Jan–early-Apr returns previous year)
- `getQuarterDeadlines(taxYear: number): QuarterDeadline[]` — `{ quarter, periodStart, periodEnd, deadline, label }` for all 4 quarters (Q3 + Q4 deadlines fall in the following calendar year)
- `getQuarterForDate(date: Date): 1|2|3|4`
- `getNextDeadline(fromDate?: Date): QuarterDeadline & { daysRemaining, isOverdue, urgency }` — walks current then next tax year, picks first deadline `>= fromDate`. Urgency: `urgent` ≤7d, `warning` 8–30d, `ok` ≥31d. `isOverdue` only used when an explicit overdue period is requested.

All functions pure and unit-testable. No `||`/`??` fallbacks over DB data (none consumed here).

**`src/hooks/useInstructorMTDStatus.ts`** (new)
- Resolve instructor id via `public.get_instructor_id_for_user(auth.uid())` pattern used elsewhere.
- Select `is_mtd_enrolled, business_name, utr` from `mtd_instructor_settings` (single row).
- If missing or `is_mtd_enrolled !== true` → `{ enrolled: false, isLoading, error }`.
- If enrolled → compute `next = getNextDeadline()`, then query `mtd_quarterly_periods` for the current quarter row (`tax_year`, `quarter` from `getQuarterForDate(today)`) and check `status === 'submitted'`. Missing row = not submitted (never invented).
- Return `{ enrolled: true, nextDeadline: next, daysRemaining, urgency, isOverdue, currentQuarterSubmitted }`.

## PART 2 — Tile component

**`src/components/instructor/MTDDeadlineTile.tsx`** (new) — mobile-only, design-system aligned (white card, `#e0e3ea` border, 14px radius, Poppins, instructor mobile blue `#3D55A1` for primary links). Entire tile is a button → `/instructor-app/mtd`.

States (driven by `useInstructorMTDStatus`):

1. **Loading** — skeleton card (shimmer per iOS consistency).
2. **Not enrolled** — compact informational card. Left: `#f0edfb` icon chip with file-invoice icon `#6b4fc4`. Title "Making Tax Digital", subtitle "Get MTD ready before April 2026". Right: "Set up →" in `#2952b3`.
3. **Submitted (current quarter)** — green tint `#e8f5ee` bg, `#2d8a4e` border tint. "Q{X} submitted ✓" + "Next: Q{Y} due {DD MMM}" in grey.
4. **OK (≥31 days)** — white card, standard border. Eyebrow "MTD FILING" 10px uppercase grey. Headline "Q{X} due {DD MMM YYYY}" 16px semibold charcoal. Subtitle "{N} days remaining". Thin blue progress bar = quarter elapsed % (period_start → deadline).
5. **Warning (8–30 days)** — `#fff8e8` bg, 3px left border `#f59e0b`. Amber "{N} days remaining". Amber pill "Due soon".
6. **Urgent (≤7 days)** — `#fbe8e8` bg, 3px left border `#c9302c`. Red bold "{N} days remaining". Red pill "Action needed".
7. **Overdue** — red tint, "OVERDUE" red label, "Submit now →" CTA. Read-only — CTA just navigates.

No edits, no form submissions from the tile.

## PART 3 — Dashboard mount + MTDCountdown fix

**`src/components/instructor/MobileHomeDSM2026.tsx`** — import `MTDDeadlineTile`, mount it directly below `TaxEstimateTile`. Always rendered; the not-enrolled state handles new instructors. No extra gating.

**`src/components/instructor-features/MTDCountdown.tsx`** — replace the hardcoded `new Date("2026-04-06T00:00:00Z")`:
- Banner/full variants now derive their date from `getNextDeadline()`.
- Enrolled instructors (when this is consumable) see the next quarterly filing deadline.
- Otherwise (and on the marketing page) show "MTD is now live" copy instead of a passed-date countdown. Visual layout untouched — only the data source changes.

`InstructorMTD.tsx` is otherwise not modified.

## PART 4 — Verification (manual checklist)

- `mtdDeadlines.ts` returns correct deadlines for current and next tax year; boundary tests at 5 Apr / 6 Apr, 5 Jul / 6 Jul, etc.
- Urgency thresholds correct at 7 / 8 / 30 / 31 days.
- Hook returns `enrolled: false` for current users (table is empty) → tile shows informational variant on `/instructor`.
- No DB writes; no new rows in `mtd_quarterly_periods` or `mtd_instructor_settings`.
- `InstructorTax.tsx`, `useInstructorTaxSummary`, payments, and busyness sources untouched.
- `MTDCountdown` no longer shows a passed date.
- No `||`/`??` fallbacks substituted for DB values.

## PART 5 — Deferred

- Generating `mtd_quarterly_periods` rows from live `payment_history`/`instructor_expenses` (totals roll-up).
- Push/email reminders at T-30, T-7, T-1 via edge function + cron.
- Desktop variant of the tile for instructor desktop portal.
- Wiring `useInstructorMTDStatus` into `MTDCountdown` per-user (currently the marketing page has no auth context, so banner uses generic "live" copy).
- Enrolment flow / settings UI for `mtd_instructor_settings`.

## Technical notes

- Pure utility: no Supabase imports, no `Intl` locale guesses beyond `en-GB` formatting; date math uses local Europe/London semantics (dates only, no UTC drift).
- Hook follows project RLS identity rule via `get_instructor_id_for_user(auth.uid())`.
- Tile uses existing `--portal-*` tokens where available; literal hexes only where the prompt specifies them, matching `TaxEstimateTile` precedent.
- Files touched: 3 new (`src/lib/mtdDeadlines.ts`, `src/hooks/useInstructorMTDStatus.ts`, `src/components/instructor/MTDDeadlineTile.tsx`), 2 edited (`MobileHomeDSM2026.tsx`, `MTDCountdown.tsx`). No migrations.
