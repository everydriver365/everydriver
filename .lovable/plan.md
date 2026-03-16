

## Fix: Card Payment Not Working

### Investigation Findings

I identified **two issues** preventing card payments from completing:

**Issue 1: `elavon-checkout` function requires authentication on a public page**
The `elavon-checkout` edge function is NOT listed in `supabase/config.toml`, meaning JWT verification is enabled by default. The booking page (`/book/:id`) is a public page that unauthenticated customers use. When an unauthenticated user clicks "Pay with Card", the `CardstreamPayButton` calls `elavon-checkout`, which returns a 401 — silently killing the payment flow.

For comparison, `npi-checkout`, `payment-callback`, `payment-intent-create`, and `payment-direct-sale` all have `verify_jwt = false` set.

**Issue 2: Iframe success detection fails on preview/mismatched domains**
After payment completes, the `payment-callback` edge function redirects to `siteBaseUrl` (defaults to `https://everydriver.lovable.app`). The `CardstreamPayButton` iframe `onLoad` handler checks `url.origin === window.location.origin` to detect success. If the user is on the preview domain or any other domain, this check always fails — meaning payment succeeds server-side but the UI never acknowledges it.

### Fix Plan

**1. Add `elavon-checkout` to `supabase/config.toml`**
```toml
[functions.elavon-checkout]
verify_jwt = false
```

**2. Pass the current origin to the callback flow**
In `CardstreamPayButton.tsx`, pass `window.location.origin` as part of the `returnUrl` to `elavon-checkout`. Then in the `elavon-checkout` edge function, use the `returnUrl`'s origin (instead of `SITE_URL`) when constructing the callback URL's redirect target. This way, `payment-callback` will redirect the iframe back to the correct origin.

Alternatively, simpler approach: update the `payment-callback` to redirect to the `returnUrl` origin from the query params, OR update the `CardstreamPayButton` iframe detection to compare against the known `siteBaseUrl` as well as `window.location.origin`.

**3. Update `CardstreamPayButton` iframe detection**
Make the origin check more resilient by also checking against common known domains:
```typescript
const isOurDomain = url.origin === window.location.origin || 
                    url.hostname.includes('everydriver.lovable.app');
```

### Files to edit
- `supabase/config.toml` — add `elavon-checkout` with `verify_jwt = false`
- `src/components/payments/CardstreamPayButton.tsx` — fix origin detection
- `supabase/functions/elavon-checkout/index.ts` — pass through the user's origin for callback redirect

