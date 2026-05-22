# MTD Enrolment Flow — Wizard + Period Seeding

Build the minimum viable MTD enrolment flow. No HMRC OAuth, no submission API.

---

## PART 1 — Route split + marketing page update

**Edit `src/pages/InstructorMTD.tsx`:**
- Add gate at top using `useInstructorMTDStatus` + auth context:
  - `is_mtd_enrolled === true` → `<Navigate to="/instructor-app/mtd/dashboard" replace />`
  - Logged in + not enrolled → render marketing content with prominent "Get set up →" CTA linking to `/instructor-app/mtd/setup`
  - Logged out → keep existing marketing page; replace email capture form with "Sign in to get started" link to login
- Remove the fake email lead-capture form entirely (the one that just calls `setSubmitted(true)`).

**Register routes in the instructor app router:**
- `/instructor-app/mtd/setup` → `MTDSetup`
- `/instructor-app/mtd/dashboard` → `MTDDashboard`
- Both wrapped with auth guard (must be logged in instructor).

---

## PART 2 — Enrolment wizard at `/instructor-app/mtd/setup`

**New file: `src/pages/instructor/MTDSetup.tsx`**

4-step wizard, single-column card, bg `#F2F4F8`, card white + `1px #e0e3ea` border + `14px` radius, Poppins.

**Step indicator:** numbered pills (1·2·3·4) at top with current highlighted.

**Step 1 — Business details**
- `business_name` (text, required, pre-populated from `instructors.business_name` if present)
- `business_start_date` (shadcn date picker with `pointer-events-auto`, required, must be `<= today`)
- Subtitle: "This is the name HMRC will see on your submissions"

**Step 2 — HMRC identifiers**
- `hmrc_nino` (text, required)
  - Regex: `^[A-CEGHJ-PR-TW-Z]{2}\d{6}[A-D]$` (uppercase, stripped of spaces before validation)
  - Display formatted with spaces: `AB 12 34 56 C`
  - Inline error: "Enter a valid NI number (e.g. AB123456C)"
- `utr` (text, required, exactly 10 digits)
  - Inline error: "UTR must be 10 digits"
  - Info: "Find your UTR on any letter from HMRC or your Self Assessment tax return"
- Validation via zod schemas; "Next" disabled until valid.

**Step 3 — Accounting preferences**
- `accounting_type` segmented control: `cash` (default) / `accruals`
  - Descriptions as specified
- `flat_rate_expenses` toggle, off by default
  - Label + subtitle as specified
- Info pill: "You can change these settings later"

**Step 4 — Review + confirm**
- Summary list of all entered values
- Checkbox: "I confirm my details are correct and I want to enrol for Making Tax Digital"
- "Complete enrolment" button disabled until checkbox ticked
- On submit:
  1. `supabase.from('mtd_instructor_settings').upsert({ instructor_id, ...fields, is_mtd_enrolled: true }, { onConflict: 'instructor_id' })`
  2. `supabase.functions.invoke('seed-mtd-periods', { body: { instructor_id } })`
  3. On success → `navigate('/instructor-app/mtd/dashboard')` + sonner toast "You're enrolled for Making Tax Digital"
  4. On error → inline error block, no navigation, no enrolment flag flipped if seed fails (wrap in try/catch and roll back the upsert if seed errors? — actually keep simple: surface error and let user retry; seed is idempotent so retry is safe)

Back button on steps 2–4; Next disabled until step's required fields valid.

---

## PART 3 — `seed-mtd-periods` edge function

**New file: `supabase/functions/seed-mtd-periods/index.ts`**

- CORS via `npm:@supabase/supabase-js@2/cors`
- Validate JWT in code, derive `auth_user_id`, look up `instructor_id` via `get_instructor_id_for_user(auth.uid())` RPC, reject if mismatch with body's `instructor_id`
- Inline pure copy of `getQuarterDeadlines(taxYear)` logic from `src/lib/mtdDeadlines.ts` (Apr–Jul, Aug–Oct, Nov–Jan, Feb–Apr; deadlines = period_end + 1 month + 7 days, standard MTD rules)
- Determine current UK tax year (Apr 6 → Apr 5) from today
- Build 8 rows: current year Q1–Q4 + next year Q1–Q4
- Each row: `{ instructor_id, tax_year, quarter, period_start, period_end, deadline, status: 'open' }`
- `upsert` on conflict `(instructor_id, tax_year, quarter)` — idempotent
- Returns `{ seeded: number }`
- Requires unique constraint on `(instructor_id, tax_year, quarter)` — **migration** to add it if not already present (check first via read_query before plan execution; add `ALTER TABLE … ADD CONSTRAINT IF NOT EXISTS …` only if missing)

---

## PART 4 — MTD dashboard at `/instructor-app/mtd/dashboard`

**New file: `src/pages/instructor/MTDDashboard.tsx`**

Visible only to enrolled instructors (redirect to `/instructor-app/mtd` if `is_mtd_enrolled !== true`).

- **Header:** "Making Tax Digital" + green pill "Enrolled"
- **Settings row:** tappable card → opens shadcn `Sheet` with same fields as wizard, pre-populated; "Save changes" upserts `mtd_instructor_settings`
- **Tax year selector:** segmented control switching between current and next tax year
- **Quarterly periods list:** fetch `mtd_quarterly_periods` for selected tax year, ordered by quarter
  - Each row: quarter label (e.g. "Q1 Apr–Jul"), period dates, deadline, status pill (Open / Submitted / Overdue — Overdue computed client-side when `deadline < today && status === 'open'`)
  - Current quarter (where today between period_start and deadline) gets blue left border (`border-l-4 border-[#2D3FE7]`)
  - "Submit" button on rows where `status === 'open'` → sonner toast "HMRC submission coming soon"
- **Footer link:** "View full tax breakdown →" → `/instructor/tax`

Reuse `PortalCard` / portal tokens per design system memory.

---

## PART 5 — `MTDDeadlineTile` update

**Edit existing tile component:**
- Non-enrolled state CTA: change link target from `/instructor-app/mtd` to `/instructor-app/mtd/setup`, label "Get set up →"
- Enrolled + submitted state: confirm it reads from `mtd_quarterly_periods` (now that rows exist after seeding) — show "Q{n} submitted ✓"
- Enrolled + open state: unchanged

---

## PART 6 — Verified clean (untouched)

- `src/pages/InstructorTax.tsx`
- `src/components/instructor/TaxYearReport.tsx`
- `src/lib/ukTax.ts`
- `src/hooks/useInstructorTaxSummary.ts`
- `mtd_sa103_mappings` table (reference data)
- All payment / accounting affiliate code from the previous pass
- No HMRC OAuth, no submission edge functions

---

## PART 7 — Deferred

- HMRC OAuth + developer hub registration
- `submit-mtd` edge function + fraud-prevention headers
- `mtd_submission_log` writes
- `mtd_sa103_mappings` consumer (income/expense categorisation)
- Reminder emails before quarterly deadlines
- Admin view of enrolled instructors

---

## Files

**New**
- `src/pages/instructor/MTDSetup.tsx`
- `src/pages/instructor/MTDDashboard.tsx`
- `supabase/functions/seed-mtd-periods/index.ts`
- Migration (only if missing): unique constraint on `mtd_quarterly_periods(instructor_id, tax_year, quarter)`

**Edited**
- `src/pages/InstructorMTD.tsx` (gate + CTA + remove fake form)
- Instructor app router (register 2 new routes)
- `MTDDeadlineTile` component (CTA target + label)
