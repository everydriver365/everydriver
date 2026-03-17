

## Problem

The payment-callback edge function receives **empty POST body** from the Cardstream gateway redirect. The logs confirm: `Payment callback data: {}` and `ELAVON response - code: undefined`.

After the 3DS flow, Cardstream redirects the browser back to `redirectURL` as a **GET request** (HTTP 302 redirect), not a POST. The response fields (`responseCode`, `responseMessage`, `orderRef`, etc.) are sent as **query string parameters**, but the callback only looks for them in the POST body.

Since the body is empty, `responseCode` is `undefined`, which defaults to `"1"` (declined), and the user sees a failure redirect.

## Fix

In `supabase/functions/payment-callback/index.ts`, after parsing the POST body (which may be empty), **fall back to URL query parameters** for the Cardstream response fields.

Around line 107, after the formData parsing block, add:

```typescript
// Cardstream may redirect via GET with response in query params
// Fall back to query params if POST body was empty
if (Object.keys(formData).length === 0) {
  url.searchParams.forEach((value, key) => {
    formData[key] = value;
  });
}
```

This ensures the callback picks up `responseCode`, `responseMessage`, `orderRef`, `amount`, `authorisationCode`, `signature`, etc. from the query string when the gateway uses a GET redirect after 3DS.

After editing, redeploy `payment-callback`.

No other files need changes.

