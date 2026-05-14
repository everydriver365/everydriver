# Fix: "Course unavailable" on every booking page for anonymous visitors

## Root cause

Ken's database row is fine: `hourly_rate=45`, `preferred_lesson_length=120`, `buffer_minutes=30`, `booking_advance_days=365`, `is_active=true`.

The "unavailable" copy comes from `BookingSummary.tsx` line 319:

> "This instructor profile is unavailable or no longer accepting bookings."

That branch fires whenever `instructorRes.error || !instructorRes.data` is true. The query at line 281 reads from the protected `instructors` table:

```ts
supabase.from("instructors").select(`id, name, profile_image_url, … cash_payments_enabled, klarna_enabled, clearpay_enabled, instant_bank_pay_enabled, school_skim_amount, …`).eq("id", instructorId).maybeSingle()
```

Anonymous visitors are denied by RLS (same `permission denied for table instructors` we just fixed in the search hook), so `error` is set and the user sees "Course unavailable". Logged-in instructors don't see the bug because their RLS lets them through.

The natural fix is to read from the `public_instructors` view (which is already what every other public surface uses), but four columns this page consumes are NOT exposed by the view today:

- `cash_payments_enabled`
- `instant_bank_pay_enabled`
- `school_skim_amount`
- `adi_code_of_practice`

These are not PII — they're public booking-relevant settings (which payment methods to show, the school surcharge already baked into displayed prices, and a public ADI credential badge).

## Change

### 1. Migration — add the four missing columns to `public_instructors`

Recreate the view (drop + create with `security_invoker=on`) with the same column list it has today plus:

- `cash_payments_enabled`
- `instant_bank_pay_enabled`
- `school_skim_amount`
- `adi_code_of_practice`

The base `instructors` table SELECT policy stays unchanged — visitors still cannot read PII (auth_user_id, phone, email, etc.).

### 2. Code edits — both BookingSummary files

`src/pages/BookingSummary.tsx` and `src/pages/everydriver/BookingSummary.tsx` (lines ~281–293):

- Change `.from("instructors")` → `.from("public_instructors")`
- Keep the same `select(...)` column list (it's now fully covered by the view).

No other changes — the `loadErrorReason` branches stay as-is, and Ken now passes all four configuration checks because his real row data flows through.

## Verification

1. Open `/courses` → click any of Ken's tiles → should land on the live BookingSummary, no "Course unavailable" message.
2. Browser console should not show `permission denied for table instructors`.
3. Logged-in instructor portal: confirm no regression on any of their own booking-related screens (those screens already query the base table under their own RLS, untouched).
4. Confirm price card still shows the school skim correctly and that Cash / Instant Bank Pay tiles only appear when their respective toggles are on.

## Out of scope

No fallback values added anywhere; missing-config branches stay strict per LIVE DATA ONLY. No changes to write-side RLS or to any auth-scoped reads.
