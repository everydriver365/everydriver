

## Fix: Embedded card form stuck on "Loading secure form..."

### Root Cause
The `useEffect` in `CardstreamEmbeddedCardForm.tsx` has `[merchantId, onInitError]` as dependencies. The parent component `CardstreamCheckout` fires `payment-intent-create` multiple times (visible in network logs: 4 calls), each time updating `merchantId`. This triggers the effect's cleanup function which sets `cancelled = true`. However, `initAttemptedRef` prevents the effect from re-running. 

Result: both the `hostedform:ready` event handler and the 6-second fallback timeout check `!cancelled`, find it `true`, and skip setting `sdkReady`. The button stays disabled forever showing "Loading secure form...".

### Fix

**File: `src/components/payments/CardstreamEmbeddedCardForm.tsx`**

1. Use a `cancelledRef` (useRef) instead of a local `cancelled` variable, so it's only set to `true` on actual component unmount — not on dependency changes
2. Remove `merchantId` from the effect dependency array (use `merchantIdRef` instead) since the init should only run once and `initAttemptedRef` already guards against re-runs
3. Remove `onInitError` from deps too (use ref) to prevent the same cleanup issue
4. The fallback timeout already has a stale closure for `sdkReady` but that's harmless since it only ever reads the initial `false` — just use `setSdkReady` unconditionally with a ref guard

This is a one-file, targeted fix to the effect lifecycle — no backend or other component changes needed.

