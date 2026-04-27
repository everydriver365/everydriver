## Edge Function & Legacy Payment Cleanup

Audited all 145 edge functions against client imports and `cron.job` entries. Found a self-contained legacy gateway tree (Elavon / Cardstream / NPI / WooCommerce) and a few orphans. Active stack (Square, GoCardless, SumUp, Klarna, Clearpay) is untouched.

### Findings

**Legacy payment functions — zero live usage**
Only referenced by orphan components that nothing imports:
- `elavon-checkout` ← `CardstreamPayButton.tsx` (no importers)
- `cardstream-direct-sale`, `cardstream-hostedfields-init` (no refs at all)
- `npi-checkout` ← `NPIHostedFields.tsx` (no importers)
- `npi-hosted-fields` (no refs)
- `woocommerce-checkout`, `woocommerce-update-order` (no refs — also forbidden per memory)
- `payment-direct-sale`, `payment-intent-create`, `applepay-validate-merchant` — only used by `ElavonWalletButtons`, `ElavonBookingWalletButtons`, `CardstreamCheckout`, `CardstreamEmbeddedCardForm` (all orphan components)

**Other orphans**
- `radius-dashcam-probe` — zero references in code or cron

### Plan

**1. Delete edge functions (12)**
```
elavon-checkout
cardstream-direct-sale
cardstream-hostedfields-init
npi-checkout
npi-hosted-fields
woocommerce-checkout
woocommerce-update-order
payment-direct-sale
payment-intent-create
applepay-validate-merchant
radius-dashcam-probe
```
(Plus their `supabase/functions/<name>/` directories.)

**2. Delete orphan client components**
```
src/components/payments/CardstreamPayButton.tsx
src/components/payments/CardstreamCheckout.tsx
src/components/payments/CardstreamEmbeddedCardForm.tsx
src/components/payments/ElavonWalletButtons.tsx
src/components/booking/ElavonBookingWalletButtons.tsx
src/components/booking/NPIHostedFields.tsx
```

**3. Save constraint to memory**
Append Elavon / Cardstream / NPI to the existing payment-gateway exclusion list so they're never re-added.

### Out of scope (keep — confirmed in use)

- AI functions (`ai-receptionist`, `ai-admin-receptionist`, `ai-command-center`, `generate-driving-insights`) — live in `LiveChatWindow` and dashboards. Consolidating into an `ai-router` is a separate, larger refactor.
- `morning-briefing` + `generate-morning-briefing` — both used by `MorningBriefingCard.tsx`. Worth investigating later but not deleting blind.
- `tile-health-check`, `twentyi-api` — admin-tooling, in use.

### Risk

Low. All deletions verified by file-tree import graph + cron audit. No active checkout flow touches any of these. Memory already lists WooCommerce as forbidden; Stripe excluded; this just enforces the same for Elavon/Cardstream/NPI.