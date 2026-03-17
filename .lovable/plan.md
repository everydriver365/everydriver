

## Fix: Address not splitting in deployed edge function

### Root cause
The code in `supabase/functions/elavon-checkout/index.ts` already contains the `splitCustomerAddress` logic, but the network response proves the **deployed** version is stale — `customerAddress1` still contains the full comma-separated string `"4 Watkin Road, Hedge End, Southampton, SO30 2TD"` instead of just `"4 Watkin Road"`.

### Fix
Make a small code change to the edge function to force redeployment. Specifically, add a debug log line showing the structured address output. This will both trigger a fresh deploy and help confirm the split is working on the next test.

### File: `supabase/functions/elavon-checkout/index.ts`
- Add a `console.log` after the `splitCustomerAddress` call to log the structured result
- This forces Lovable to redeploy the function with the existing split logic intact

No other files need changes — the split logic is already correct.

