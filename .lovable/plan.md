

## Fix: "Secure card fields SDK unavailable"

### Root Cause
The Cardstream Hosted Fields SDK (`hostedfields.min.js`) requires jQuery as a dependency. The code loads the SDK script but never loads jQuery first, so `window.jQuery?.fn?.hostedForm` is always undefined.

### Fix

**File: `src/components/payments/CardstreamCheckout.tsx`**

Before loading the hosted fields script (line ~133), load jQuery first:

```typescript
// Load jQuery (required by Cardstream Hosted Fields SDK)
await loadScript("https://code.jquery.com/jquery-3.7.1.min.js");

// Then load Hosted Fields script
await loadScript(data.hostedFieldsScriptUrl);
```

This is a two-line addition inside the existing `useEffect` async block. No other files need changes.

