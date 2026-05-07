## Why "Course not found" appears

`BookingSummary` (`/book/:instructorId`) loads the instructor with:

```ts
supabase.from("instructors")
  .select("*, deposit_enabled, deposit_amount, deposit_deadline_days, cancellation_policy_text, booking_mode")
```

A recent security migration (`20260502093229...`) revoked wildcard `SELECT` on `public.instructors` from the `anon` role and re-granted only an explicit safe column list. Several columns the booking page reads were **not** included in that grant:

- `booking_mode`
- `cash_payments_enabled`
- `klarna_enabled`
- `clearpay_enabled`
- `instant_bank_pay_enabled`
- `school_skim_amount`
- `home_address`

Because the query uses `*`, Postgres returns `42501 permission denied for table instructors`. `instructorRes.error` is set, `courseDetails` stays `null`, and the page renders the "Course not found" fallback.

Confirmed live: `curl … /rest/v1/instructors?select=id,booking_mode` returns `permission denied for table instructors` for anon.

This started after the column-level lockdown landed; the Winchester whitelabel work didn't cause it directly, but it's why public booking pages now fail.

## Fix

Two changes:

**1. Replace `select("*")` with an explicit column list in `src/pages/BookingSummary.tsx`** so the query is stable and doesn't drag in restricted columns. Include only the fields the page actually uses (already listed in the `Instructor` and deposit/payment toggles state).

**2. Add a tiny migration** that grants `SELECT` on the missing public-booking columns to `anon` (these are non-PII operational flags and the school skim amount, all of which are needed to render a booking page):

```sql
GRANT SELECT (
  booking_mode,
  cash_payments_enabled,
  klarna_enabled,
  clearpay_enabled,
  instant_bank_pay_enabled,
  school_skim_amount
) ON public.instructors TO anon;
```

`home_address` is genuinely sensitive (instructor home address) so it stays private — the explicit `select` list will simply omit it (the page already tolerates `home_address: null`).

## Files

- `src/pages/BookingSummary.tsx` — change the instructors query to an explicit column list matching the `Instructor` interface + deposit/payment-toggle fields.
- `supabase/migrations/<new>.sql` — grant SELECT on the 6 columns above to `anon`.

## Verification

After applying:

- `curl …/rest/v1/instructors?select=id,booking_mode` returns rows instead of 42501.
- `/book/<instructorId>?hours=10` on drive365 / winchesterdrivingschool loads the booking page instead of showing "Course not found".
