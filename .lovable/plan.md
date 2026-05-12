# Plan & billing — wiring audit

## Status today
The page at `/instructor-app/plan-billing` (`src/pages/instructor-app/InstructorPlanBilling.tsx`) renders correctly but is **almost entirely hard-coded mock data**. None of the buttons that should mutate state actually do anything beyond a toast.

### What is currently fake
| Section | Source today | Should come from |
|---|---|---|
| Plan tiers (Starter / Pro / Studio + £24/£49 etc.) | `PLANS` const at top of file | `subscription_plans` table |
| "Current plan" + renewal date | `useState<PlanId>("pro")` and `const renewal = "4 June 2026"` | `instructor_subscriptions` (`plan_id`, `current_period_end`, `billing_cycle`) |
| Billing cycle toggle (monthly/yearly) | local state only — does not reflect saved choice | `instructor_subscriptions.billing_cycle` |
| Usage meters (Pupils / AI credits / Storage) | `USAGE` const | `pupils` count, AI credit ledger, storage usage — none queried |
| Invoices table + "Download all" / row download | `INVOICES` const + `toast("Invoice downloaded")` | `subscription_payments` rows + signed URL/PDF generation |
| Payment method (Visa •••• 4242, exp 08/27) | Hard-coded JSX | GoCardless mandate / Square card on `instructor_subscriptions` |
| Billing email | Reads `instructor.email` ✅ wired |
| "Manage" button | No `onClick` | Should open a manage flow |
| "Upgrade" header button | Always opens Studio sheet regardless of current plan | Should pick next tier |
| Upgrade sheet "Pay with •••• 4242" | `toast.success` only | Edge function to change plan via GoCardless/Square |
| Cancel plan / Cancel anyway | `toast` only | Edge function to cancel `instructor_subscriptions` |
| Update payment method link | No handler | Open GoCardless mandate / Square card update flow |

### What is real
- `useInstructorMembership` hook exists and queries `instructor_subscriptions` correctly — but **this page does not use it**.
- `instructor.email` shown as billing email.
- Sign out and notification bell are wired through `DashboardShell`.

## Recommended wiring scope

### Phase 1 — Read-only live data (low risk)
1. Replace `PLANS` const with a query against `subscription_plans` (active plans, ordered by `display_order`). Keep the tier cards/UX identical.
2. Replace hard-coded `current` + `renewal` with a query against `instructor_subscriptions` for the signed-in instructor. Default to "starter" / no renewal when none.
3. Initialise the Monthly/Yearly toggle from `billing_cycle` on load.
4. Replace `INVOICES` with a query against `subscription_payments` (latest 12, ordered by `payment_date desc`). Hide the section when empty.
5. Replace the Visa •••• 4242 block with the real method:
   - GoCardless mandate present → show "Direct Debit · {bank_name or 'Bank account'}"
   - Square card present → show brand + last 4 + expiry
   - Otherwise → "No payment method on file"
6. Replace `USAGE` pupils meter with live count from `pupils` table (active). Leave AI credits / Storage as TODO placeholders unless you want those wired too — confirm.

### Phase 2 — Actions (higher risk, needs edge functions)
7. "Manage" → no-op for now or link to a settings page (decide).
8. Upgrade flow → call a new `instructor-change-plan` edge function (GoCardless preferred, Square fallback) that updates `instructor_subscriptions.plan_id` and prorates.
9. Cancel flow → call `instructor-cancel-subscription` edge function; set `status = 'cancelled'` and keep `current_period_end` for grace period (matches `mem://features/subscription/billing-lifecycle`).
10. "Update payment method" → open GoCardless billing-request flow or Square card-on-file update.
11. Invoice downloads → generate PDF on demand via edge function returning a signed URL.

## Open questions for you
1. **Scope**: do you want **Phase 1 only** (make the page show real data, leave action buttons as stubs), or **Phase 1 + Phase 2** (also wire upgrade / cancel / payment-method change to real edge functions)?
2. **Plan tiers**: the hard-coded tiers say Starter / Pro / Studio at £0 / £24 / £49. Your `subscription_plans` table is the source of truth — should I display whatever is in the DB verbatim, even if tier names differ?
3. **AI credits & Storage meters**: there is no ledger table for AI credit usage and no per-instructor storage tally today. Drop these meters, leave them as static placeholders, or build the tracking?
4. **Payment provider**: this membership flow should use **GoCardless** (per memory). Confirm we route upgrade/cancel through GoCardless and not Square for subscription billing.
