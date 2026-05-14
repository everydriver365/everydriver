## Payment Flow Hardening — Sequential Fix Plan

We'll do these **one at a time**, deploy + verify each works in production data before moving to the next. After each stage I'll pause for your confirmation.

---

### Stage 1 — Klarna (CRITICAL: payments not recorded at all)

**Problem:** `klarna-order` captures money at Klarna but writes nothing to our DB. Pupil balance never credited, no `payment_history` row, no platform fee.

**Fix:**
- Edit `supabase/functions/klarna-order/index.ts` to, on successful capture, accept `instructorId`, `pupilId`, `bookingRef` from the request body and:
  1. Insert `payment_history` row with `payment_method = 'Klarna'`, `notes` containing `klarna_order_id:<id>` for idempotency.
  2. Idempotency guard: skip if a row with that order_id already exists in notes.
  3. Call `increment_pupil_balance` RPC with the amount.
- Edit `src/components/booking/BookingSummary.tsx` (`handleKlarnaSuccess`) to pass `instructorId` + `pupilId` to `klarna-order`.
- Trigger `record_platform_fee_for_payment` will auto-create the £1 platform fee + Klarna uplift commission.

**Verification:**
- Deploy function.
- Check `payment_history` for any new Klarna row after a test booking, OR I'll show you a SQL query to verify on the next real Klarna payment.

---

### Stage 2 — Clearpay (CRITICAL: balance never credited, broken FK parsing)

**Problem:** `clearpay-capture` parses `merchantReference.split("-")` for instructor/pupil IDs — UUIDs contain hyphens so this is gibberish. Pupil balance never credited.

**Fix:**
- Edit `supabase/functions/clearpay-capture/index.ts` to accept explicit `instructorId` and `pupilId` in the request body.
- Insert `payment_history` with `payment_method = 'Clearpay'`, idempotency check on `clearpay_payment_id` in notes.
- Call `increment_pupil_balance`.
- Update the calling component (Clearpay checkout flow) to pass these IDs.

**Verification:** Same pattern as Stage 1.

---

### Stage 3 — GoCardless Instant Bank Pay (instructor_id missing)

**Problem:** Webhook inserts `payment_history` without `instructor_id`, so the auto platform-fee trigger fires with NULL instructor — breaks reporting.

**Fix:**
- Locate the GoCardless webhook handler that processes IBP completions.
- Look up `instructor_id` from `payment_intents.metadata` or pupils table and include it in the `payment_history` insert.
- Add idempotency check on `billing_request_id`.

**Verification:** Query `payment_history` for IBP rows, confirm `instructor_id` is populated.

---

### Stage 4 — Add `external_payment_ref` column + unique index

**Problem:** Idempotency relies on `ilike` on `notes` field — fragile, easy to miss duplicates.

**Fix (migration):**
- Add nullable `external_payment_ref TEXT` column to `payment_history`.
- Partial unique index `WHERE external_payment_ref IS NOT NULL`.
- Update Square, Klarna, Clearpay, GoCardless flows to write to it.

**Verification:** Try inserting a duplicate ref → should be rejected by unique index.

---

### Stage 5 — Normalise `payment_method` values

**Problem:** Inconsistent labels (`cash`/`Cash`, `card`/`Square`/`square_checkout`) cause duplicate rows in reports.

**Fix:**
- Define canonical set: `'Cash' | 'Bank Transfer' | 'Square' | 'GoCardless Bank Pay' | 'GoCardless Direct Debit' | 'Klarna' | 'Clearpay' | 'SumUp' | 'Lesson Charge' | 'Course Bonus'`.
- Migration: backfill existing rows to canonical names.
- Add CHECK-style validation trigger (not constraint) to enforce going forward.
- Update all edge functions to use canonical strings.

**Verification:** `SELECT DISTINCT payment_method FROM payment_history` returns only canonical values.

---

### Workflow

After each stage I will:
1. Show what I changed.
2. Deploy edge functions / run migration.
3. Show a verification query or test result.
4. **Wait for your "next" / "ok" / "go" before starting the following stage.**

If a stage fails verification, I fix it before moving on — no piling up half-done work.

Ready to start with **Stage 1 (Klarna)** on your approval.
