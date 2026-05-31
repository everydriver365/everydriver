## Problem

In `CreateInvoiceDialog` → Preview step, the only payment-method info shown is the bank transfer block (when filled in) and a generic "secure payment link from Square" footer. The other methods the buyer will actually see — Card, Klarna, Clearpay — are not listed, so the preview doesn't match what's offered.

## Fix

Add a "Payment methods" section in the preview (above the Square footer line) that lists every method enabled for this invoice:

- **Card** — always shown (Square requires it).
- **Klarna — Pay in 3 / Pay later** — shown when `allowKlarna && instructorKlarnaEnabled`.
- **Clearpay — Pay in 3** — shown when `allowClearpay`.
- **Bank transfer** — shown when `showBank` and bank details are filled (keeps the existing detailed block; just adds it to the methods list for consistency).

Each row: small brand pill/icon + label + one-line hint (e.g. "Eligibility decided at checkout" for Klarna/Clearpay).

No business-logic or backend changes — purely presentation inside the preview step of `src/components/invoices/CreateInvoiceDialog.tsx`.
