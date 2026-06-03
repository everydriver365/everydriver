## Make Richard Chapman cash-only

Update Richard Chapman's instructor payment settings so pupils only see Cash at checkout.

**Instructor:** Richard Chapman (`1b49d152-1088-4587-8f80-b325ba41c1af`)

**Changes (data only, no code):**
1. Enable cash payments (`accept_cash = true`, or equivalent flag on his instructor/settings row).
2. Disable Klarna (`klarna_enabled = false`).
3. Disable Clearpay (`clearpay_enabled = false`).
4. Leave Square and Payment QR off (already off).

**How:**
- First run a quick `SELECT` to confirm the exact column names on Richard's settings row (cash / Klarna / Clearpay toggles live on `instructors` or `instructor_payment_settings` — need to verify before updating).
- Then run a single `UPDATE` via the insert tool flipping those three flags.

**Result at checkout for Richard:**
- ✅ Cash
- ❌ Klarna, Clearpay, Card, Bank, QR

No frontend code changes. No migrations. No effect on Ken D or any other instructor.