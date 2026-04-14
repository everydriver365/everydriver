

## Plan: Fix Export Stream Authentication

### Problem
The `radius-poller` sends the API key via `x-access-token` header, but the KT Export Stream API expects authentication via a **query parameter** (`?token=<key>`). Your Postman test confirms the endpoint and key are valid — only the auth method differs.

### Fix (one-line change)

**File**: `supabase/functions/radius-poller/index.ts`

Update `fetchFromExportStream()` (line 46) to append the token as a query parameter:

```typescript
const url = `${exportEndpoint}?token=${exportApiKey}`;
const res = await fetch(url, {
  method: "GET",
  headers: {
    "x-access-token": exportApiKey,   // keep as fallback
    "Accept": "application/json",
  },
});
```

### Steps
1. Update the fetch URL to include `?token=` query parameter
2. Re-deploy `radius-poller`
3. Invoke the poller and verify it returns telemetry data for "Charlotte"

### What stays the same
- All secrets remain unchanged
- DELETE acknowledgement logic stays as-is
- Fallback methods (KT v2, Legacy) remain in place

