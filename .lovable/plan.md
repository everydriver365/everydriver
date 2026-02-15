
# Payment, Balance & Tax Synchronisation Fix

## What's Wrong Today

1. **Lessons completed = no charge deducted**: When you mark a lesson as "done", the pupil's balance is never reduced and no record appears in payment history. Money goes in but never comes out.

2. **Cancellation fees invisible**: Cancelling with a charge deducts from the balance but creates no payment history record, so income reports and tax summaries miss it.

3. **Tax page missing mileage deductions**: The Tax page only counts manually logged expenses. It ignores HMRC mileage allowance (45p/25p per mile) from tracked mileage logs -- typically the biggest deduction for a driving instructor.

4. **UI doesn't refresh after lesson completion**: The `usePaymentInvalidation` hook is not used in `TodayScheduleView`, so balance badges stay stale.

---

## Changes

### 1. TodayScheduleView -- Deduct balance on lesson completion

**File:** `src/components/instructor/TodayScheduleView.tsx`

After the lesson is marked completed and rewards are awarded, add:

- Fetch the instructor's `hourly_rate` from the `instructors` table
- Calculate the lesson cost: `(duration_minutes / 60) * hourly_rate`
- Read the pupil's current `account_balance` (already fetched in the lesson data)
- Deduct: update `pupils.account_balance` = current balance - lesson cost
- Insert a `payment_history` record with a **negative amount** representing the lesson charge, payment_method = "Lesson Charge", notes describing the duration
- Import and call `usePaymentInvalidation` to refresh all balance tiles

### 2. CancelLessonDialog -- Record cancellation fee in payment_history

**File:** `src/components/instructor/CancelLessonDialog.tsx`

When `chargeOption === "charge"` and the balance is updated, also:

- Insert a `payment_history` record with a **negative amount** for the cancellation fee, payment_method = "Cancellation Fee"
- Import and call `usePaymentInvalidation` after the cancellation

### 3. InstructorTax -- Add HMRC mileage deduction

**File:** `src/pages/InstructorTax.tsx`

In `fetchTaxData()`, add a query to `mileage_logs`:

- Filter by `instructor_id`, `trip_type = 'business'`, and the tax year date range
- Sum total business miles (convert from km using * 0.621371)
- Calculate HMRC allowance: 45p for first 10,000 miles, 25p for miles beyond
- Add as a "Mileage Allowance" entry in the expense breakdown
- Include in `totalExpenses` so it reduces taxable income

Also fix income calculation: currently it sums ALL `payment_history` amounts (including negative lesson charges). Change to only sum positive amounts (actual payments received) for income, and treat negative amounts as additional deductions -- or filter to only `amount > 0` for income.

---

## Technical Details

### Lesson charge code (TodayScheduleView)

After the rewards section (around line 351), before the mileage calc:

```text
// Fetch instructor hourly rate
const { data: instrRate } = await supabase
  .from("instructors")
  .select("hourly_rate")
  .eq("id", instructorId)
  .single();

const hourlyRate = instrRate?.hourly_rate || 40;
const lessonCost = (lesson.duration_minutes / 60) * hourlyRate;

// Deduct from pupil balance
const currentBalance = lesson.pupil.account_balance || 0;
const newBalance = currentBalance - lessonCost;

await supabase
  .from("pupils")
  .update({ account_balance: newBalance })
  .eq("id", lesson.pupil.id);

// Record charge in payment_history
await supabase.from("payment_history").insert({
  pupil_id: lesson.pupil.id,
  instructor_id: instructorId,
  amount: -lessonCost,
  payment_method: "Lesson Charge",
  notes: `${lesson.duration_minutes}min lesson on ${lesson.lesson_date}`,
});

invalidatePaymentQueries({
  pupilId: lesson.pupil.id,
  instructorId
});
```

### Cancellation fee record (CancelLessonDialog)

After the balance update inside the `chargeOption === "charge"` block:

```text
await supabase.from("payment_history").insert({
  pupil_id: pupilId,
  instructor_id: instructorId,
  amount: -amountDue,
  payment_method: "Cancellation Fee",
  notes: `Cancellation charge for ${lessonDate} ${lessonTime}`,
});

invalidatePaymentQueries({ pupilId, instructorId });
```

### Tax mileage query (InstructorTax)

```text
// Fetch business mileage
const { data: mileageLogs } = await supabase
  .from("mileage_logs")
  .select("distance_km")
  .eq("instructor_id", instructorId)
  .eq("trip_type", "business")
  .gte("log_date", taxYearStart)
  .lte("log_date", taxYearEnd);

const totalBusinessMiles = (mileageLogs || [])
  .reduce((sum, l) => sum + (Number(l.distance_km) * 0.621371), 0);

const mileageDeduction = totalBusinessMiles <= 10000
  ? totalBusinessMiles * 0.45
  : 10000 * 0.45 + (totalBusinessMiles - 10000) * 0.25;
```

Add `mileageDeduction` to `totalExpenses` and include "Mileage Allowance" in the expense breakdown.

### Income calculation fix (InstructorTax)

Change line 144 from summing all amounts to only positive ones:

```text
const totalIncome = (payments || [])
  .filter(p => Number(p.amount) > 0)
  .reduce((sum, p) => sum + Number(p.amount), 0);
```

### Files to change

| File | Change |
|------|--------|
| `src/components/instructor/TodayScheduleView.tsx` | Deduct balance + insert payment_history + call invalidation |
| `src/components/instructor/CancelLessonDialog.tsx` | Insert payment_history record for cancellation fee + call invalidation |
| `src/pages/InstructorTax.tsx` | Add mileage deduction query + fix income filter |
