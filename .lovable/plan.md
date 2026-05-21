## Problem

The "Owes Money" tile shows different totals on the homepage vs the Payments page.

- **Homepage** (`MobileHomeRedesign.tsx`) uses `useInstructorPupilsPaymentSummary`, which queries `pupils` with `.eq("is_active", true)` — so archived/inactive pupils are excluded.
- **Payments page** (`src/pages/InstructorPay.tsx` → `fetchPupils`, line 145) queries `pupils` for the instructor with **no `is_active` filter**, so archived pupils with negative balances inflate the total.

Both tiles otherwise use the same rule (`account_balance < 0`, sum of absolute values), so the only divergence is the active filter.

## Fix

In `src/pages/InstructorPay.tsx`, add `.eq("is_active", true)` to the `fetchPupils` query so the Payments page mirrors the homepage source of truth.

```ts
const { data } = await supabase
  .from("pupils")
  .select("id, name, account_balance, phone, email, profile_image_url")
  .eq("instructor_id", instructorId)
  .eq("is_active", true)               // ← add this
  .order("name", { ascending: true });
```

This will:
- Make the "Owes Money" total (and the expanded debtor list) match the homepage tile.
- Also align the "Credit on Account" tile, since both summary tiles on the Payments page are derived from the same `pupils` array.

## Out of scope

No changes to the hook, the homepage, or business logic. Pure data-filter alignment.
