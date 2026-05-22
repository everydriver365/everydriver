
# Tax estimate tile — fix all 10 discrepancies

Scope: `src/lib/ukTax.ts`, `src/hooks/useInstructorTaxSummary.ts`, and minimal copy/label changes in `src/components/instructor/TaxEstimateTile.tsx` only. The affiliate-signup prompt is deferred to a follow-up loop per the user's "after the tax fix completes" instruction.

## Schema facts confirmed (read-only checks)

- `mtd_instructor_settings.accounting_type` exists (text). All current rows are NULL → default to cash.
- `instructor_expenses` has `deleted_at` but **no `status` and no `is_deductible` column** → D6 reduces to `deleted_at IS NULL`.
- `mileage_logs.trip_type` distinct values are exactly `business` and `personal` → existing `eq('trip_type','business')` filter is correct. D10 is a no-op fix; just record the finding.
- `payment_history` has `deleted_at` but **no `type`/`source`/`category` column** distinguishing platform-fee rows from instructor income → D5 reduces to: keep `instructor_id` + `amount > 0` + add `deleted_at IS NULL`.
- `scheduled_lessons` has `status`, `amount_due`, `deleted_at`. Status values in use: `scheduled`, `confirmed`, `cancelled` — **there is no `completed` status**. For accruals basis we treat a lesson as earned when `lesson_date <= today`, `status IN ('scheduled','confirmed')`, `deleted_at IS NULL`.

## PART 1 — High severity (D1, D3, D4)

### D1 — Personal allowance taper above £100k (`ukTax.ts`)
Rewrite `calculateTax(taxable)` to compute an adjusted personal allowance:
```
adjustedPA = Math.max(0, 12570 - Math.floor(Math.max(0, taxable - 100000) / 2))
```
Use `adjustedPA` in place of the `PERSONAL_ALLOWANCE` constant inside the function body. The three band constants (50,270 / 125,140) stay fixed — only the PA shrinks. At ≥125,140 the PA is 0, never negative. Existing call sites unchanged (same signature).

### D3 — Cash vs accruals basis (`useInstructorTaxSummary.ts`)
Add a 4th parallel query that reads `mtd_instructor_settings.accounting_type` for the instructor (`.maybeSingle()`). Branch:
- `accounting_type === 'accruals'` → income = sum of `amount_due` from `scheduled_lessons` where `instructor_id = X`, `lesson_date BETWEEN startISO AND endISO`, `status IN ('scheduled','confirmed')`, `deleted_at IS NULL`. Adapt to actual delivered lessons by also requiring `lesson_date <= today` so future bookings are not pre-counted.
- Otherwise (cash, NULL, or missing row) → existing `payment_history` logic.

Expose `accountingBasis: 'cash' | 'accruals'` on the returned summary so the tile can label the figure.

### D4 — Full-year projection (`useInstructorTaxSummary.ts` + `TaxEstimateTile.tsx`)
Compute:
```
daysElapsed = max(1, daysBetween(startISO, today))
daysInYear  = daysBetween(startISO, endISO) + 1  // 365 or 366
projectedAnnualIncome   = (ytdIncome / daysElapsed) * daysInYear
projectedAnnualExpenses = (totalExpenses / daysElapsed) * daysInYear
projectedTaxable        = max(0, projectedAnnualIncome - projectedAnnualExpenses)
projectedTax            = calculateTax(projectedTaxable)
projectedNI             = calculateNI(projectedTaxable)   // includes Class 2 after D2
projectedLiability      = projectedTax + projectedNI
```
Return `daysElapsed`, `projectedAnnualIncome`, `projectedLiability`, plus existing YTD fields (unchanged so `InstructorTax.tsx` is unaffected).

`TaxEstimateTile.tsx` minimal edit:
- Headline £ = `projectedLiability` when `daysElapsed >= 30`, else `totalLiability` (YTD).
- Subtitle: "Projected full-year estimate" (or "Year-to-date · projection available after 30 days" before day 30).
- Secondary 11px grey line: "Based on £X earned so far this year".
- No other layout changes.

## PART 2 — Medium severity (D2, D5, D6)

### D2 — Class 2 NI (`ukTax.ts` + hook + tile)
Refactor `calculateNI(taxable)` to return `{ class2: number; class4: number; total: number }`:
- `class4` = existing logic
- `class2` = `taxable > 12570 ? 179.40 : 0` (£3.45 × 52)
- `total` = sum
Update all call sites:
- `useInstructorTaxSummary.ts` — surface `estimatedClass2NI`, `estimatedClass4NI`, keep `estimatedNI = total` for backward compatibility with `InstructorTax.tsx`.
- `TaxEstimateTile.tsx` — relabel the right-hand mini card "Nat. Insurance" → "Class 2 + Class 4" and add an 11px grey subtitle under the value: `"£179 Class 2 + £X Class 4"` (only when Class 2 applies).

### D5 — `payment_history` filtering (`useInstructorTaxSummary.ts`)
Add `.is('deleted_at', null)` to the payments query. Keep existing `instructor_id` filter and `> 0` post-filter. Note in code comment: no platform-fee column exists on `payment_history` so no additional type filter is applicable.

### D6 — `instructor_expenses` filtering (`useInstructorTaxSummary.ts`)
Add `.is('deleted_at', null)`. No `status` or `is_deductible` columns exist → those filters skipped (documented in code comment + reported in output).

## PART 3 — Low severity (D8/D9, D10, cosmetic)

### D8 + D9 — Timezone-safe tax-year boundary (`ukTax.ts currentUkTaxYear`)
Replace `new Date(year, 3, 6)` constructions with explicit London-clock anchors. April 6 in the UK is always BST → use `+01:00`:
```
const cutover = new Date(`${year}-04-06T00:00:00+01:00`);
const start   = new Date(`${startYear}-04-06T00:00:00+01:00`);
const end     = new Date(`${startYear + 1}-04-05T23:59:59+01:00`);
```
ISO strings returned (`startISO`, `endISO`) stay as bare dates `YYYY-04-06` / `YYYY-04-05` since both Supabase queries use them either as `date` columns (no TZ) or as `T00:00:00`/`T23:59:59` bounds — switch the timestamp bound in the payments query to `T23:59:59+01:00` so a 5-Apr-23:30-UTC payment is correctly counted in the closing year. `getQuarterDeadlines` is not in this file — skip per scope; flag if it exists elsewhere.

### D10 — `trip_type` casing
Confirmed only `business` and `personal` exist. Filter is already correct. No code change. Report in output.

### Cosmetic
Update the file header comment in `ukTax.ts` from "2024/25" to "2025/26".

## PART 4 — Verified clean

- `InstructorTax.tsx` untouched. `calculateNI` signature change is the one risk → either keep the old `calculateNI` exported as a thin wrapper returning `total`, OR update `InstructorTax.tsx` to read `.total` (preferred: thin wrapper to honour "do not modify InstructorTax.tsx").
- No edits to payment/refund/accounting-sync code.
- D3 only reads `scheduled_lessons` and `mtd_instructor_settings` — no writes.
- No migration needed.

## PART 5 — Deferred

- Affiliate-signup prompt (`site_settings` audit, admin panel, signup UI, click tracking) → next loop once user confirms tax fix.
- Quarter deadline TZ fix outside `ukTax.ts` if `getQuarterDeadlines` lives elsewhere.
- Platform-fee filtering on `payment_history` once a distinguishing column exists.

## Files

- Edit: `src/lib/ukTax.ts`
- Edit: `src/hooks/useInstructorTaxSummary.ts`
- Edit: `src/components/instructor/TaxEstimateTile.tsx` (label + projection display only)
