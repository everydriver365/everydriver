## Goal

When a pupil submits a booking enquiry, send two emails:
1. **Confirmation** to the pupil ("We've received your enquiry, the instructor will be in touch")
2. **Notification** to the instructor with the pupil's details so they can follow up

Currently nothing emails out — the enquiry is only inserted into `booking_enquiries`.

## Prerequisite: fix sender domain

The configured sender `notify.drive365.co.uk` is in **Failed** status (DNS provisioning timed out). Nothing will deliver until that's fixed. Two options:

- **A.** Re-run DNS setup for `notify.drive365.co.uk` (add the NS records at the registrar, then verify). Keeps the existing branded sender.
- **B.** Use a different verified subdomain (e.g. `mail.drive365.co.uk`).

I'll need you to pick one and complete DNS before emails can actually send. Scaffolding and code can be built in parallel.

## What I'll build

1. **Scaffold Lovable transactional email infrastructure** (`send-transactional-email` edge function + queue + suppression + unsubscribe page).
2. **Two new React Email templates** under `supabase/functions/_shared/transactional-email-templates/`:
   - `enquiry-confirmation.tsx` — to pupil. Subject: "We've passed your enquiry to {instructor name}". Body: thanks, summary of what they asked about (course/instructor), what happens next, instructor contact line.
   - `enquiry-instructor-notification.tsx` — to instructor. Subject: "New enquiry from {pupil name}". Body: pupil name, email, phone, postcode, course interest, message, link to reply.
   - Branded with Drive365 tokens (read from `src/index.css`).
3. **Register both templates** in `_shared/transactional-email-templates/registry.ts`.
4. **Wire the send into the existing RPC path.** The enquiry now goes through `submit_booking_enquiry` (SECURITY DEFINER). After the RPC returns the new enquiry id, the client (`EnquiryFlow.tsx` and `EnquiryOnlyView.tsx`) will call `supabase.functions.invoke("send-transactional-email", …)` twice:
   - once with `templateName: "enquiry-confirmation"`, recipient = pupil email, `idempotencyKey: enquiry-confirm-<id>`
   - once with `templateName: "enquiry-instructor-notification"`, recipient = instructor email (looked up from `public_instructors` by `instructor_id` on the page), `idempotencyKey: enquiry-notify-<id>`
   Both invocations are fire-and-forget (no `await` blocking the UI success state); failures are logged but don't break the "enquiry sent" toast.
5. **Deploy** `send-transactional-email`, `process-email-queue`, `handle-email-unsubscribe`, `handle-email-suppression`.

## Test plan

After DNS is green:
- Submit a new Fred Bloggs enquiry on `/booking/chapmans`.
- Verify two `sent` rows appear in `email_send_log` (dedup by `message_id`) — one to the pupil address, one to `info@drive365.co.uk` (Richard's instructor email — note: this is the same as the Drive365 inbox, so Richard will see it there).
- Visually inspect both templates render with Drive365 branding.

## Out of scope

- Re-sending old enquiries that already failed silently.
- Editing the instructor's email address (Ken D / Richard both use `info@drive365.co.uk` — that's fine for now; if individual instructor inboxes are wanted later, that's a separate change).
- Auth emails (signup/reset) — untouched.

## Question for you before I build

Which sender domain do you want to use — re-verify **notify.drive365.co.uk**, or switch to a different subdomain?
