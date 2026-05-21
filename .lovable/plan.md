
# Full-App Audit + Inline Critical Fixes

I'll execute the audit in one pass on the instructor portal (current focus). Approving this plan kicks off the work — there is no per-section confirmation.

## Approach

For each of the 12 sections I will:
1. Read the relevant screens, hooks, edge functions, and tables.
2. Classify every issue as Critical / High / Medium / Low.
3. Fix every Critical issue inline (code + edge function deploys + migrations where needed).
4. Log High / Medium / Low to the backlog (no code changes).

## What counts as Critical (will be fixed now)

- Money figures wrong (earnings, balance, owes money, payments this month, service fees, per-hour).
- Payments or refunds that fail to complete, double-charge, or leave state inconsistent.
- Refunds not subtracting from earnings / payments-this-month / pupil balance.
- Dead routes on core flows (book lesson, take payment, refund, add pupil).
- Forms that submit invalid data silently.
- Screens that crash with empty/zero data.
- Account email update that breaks login.
- Security gaps already identified (e.g. unset `SQUARE_WEBHOOK_SIGNATURE_KEY`).
- Hardcoded values masquerading as live data on money/lesson/pupil counts.

Everything else (UI polish, missing toggles, template editor, 2FA, GDPR niceties, edge-case input validation, empty-state visuals) → backlog.

## Sections in order

1. Data wiring — Dashboard, Schedule, Needs Attention, Earnings, Pupils, Quick Access, Upcoming Events, Membership tiles.
2. Cross-screen consistency — trace each of the 12 actions through every affected screen.
3. Navigation & routing — sweep tappable elements, "See all 43 tools", "Add lesson", "Fill gaps", payment/refund flows.
4. UI consistency — Poppins, #F2F4F8 bg, card style, button colours.
5. Payments — end-to-end including platform fee collection (already in flight), receipts, partial payments, failure states.
6. Refunds — end-to-end including earnings exclusion, notifications, "Refunded" label.
7. Email settings — auto-confirmations, reminders, receipts, refund confirmations, enquiry/test/membership notifications.
8. Notification settings — push channels, toggles, badge counts.
9. Forms & validation — add lesson / pupil / event / payment / refund.
10. Empty & error states.
11. Account & profile — name, phone, email, photo, vehicle, areas, hourly rate, password, 2FA, account deletion.
12. Edge cases — zero-data instructor, huge numbers, long names, multi-same-day lessons, timezone, midnight-spanning, negative balance.

## Carry-overs from previous turn

Already queued as Critical (will be applied as part of this audit):
- Set `SQUARE_WEBHOOK_SIGNATURE_KEY` secret (will re-prompt).
- Pass `platformFeePence` from `TakePaymentModal` into `square-checkout` for both QR and Send Request flows.
- Drop `!isAutoTransfer` guard on `platform_commissions` insert in `square-webhook`.
- Make `square-refund` prefer `external_payment_ref` over notes regex.
- Tighten `TakePaymentModal` realtime listener to match by `external_payment_ref`.

## Output format

**Part 1 — Critical Fixes Applied** (per item: screen, what was broken, fix applied ✓)
**Part 2 — Backlog** grouped High / Medium / Low (per item: screen, issue, effort estimate)

## Out of scope for this pass

- Pupil portal, school portal, admin portal, mini-website (unless a Critical issue there directly breaks instructor flows).
- Visual redesign / Awwwards polish.
- New features not present in the existing app.

## Risks

- This will touch many files and likely require 1–2 migrations and several edge function deploys. If you'd rather I batch fixes by section with a checkpoint between Payments and the rest, say so before approving.
