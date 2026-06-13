---
name: SumUp Integration Logic
description: SumUp 1.69% flat rate for in-person card taps; payout reconciliation now flows through Ryft sub-accounts
type: feature
---

SumUp remains an optional in-person card reader integration (1.69% flat rate, Tap-to-Pay on iPhone/Android where supported).

Payout / split reconciliation:
- Card gateway of record is Ryft (Square fully removed). Service Fee + instructor payout splits flow through Ryft sub-accounts via `ryft-create-checkout` and `ryft-invoice-manage`.
- SumUp captures funds directly to the instructor's SumUp merchant account; the platform receives no split. Service Fee for SumUp transactions is recorded in `payment_history` and settled out-of-band on the instructor's monthly invoice — not via a Ryft split.
- Never reference Square as a workaround for SumUp split payouts. Square is forbidden (see mem://constraints/payment-gateway-ryft-only).
