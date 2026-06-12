
# Plan: Switch Resend sends to everydriver.co.uk branding

## Goal
Once `everydriver.co.uk` is verified in Resend, every email the app sends should come from a branded `@everydriver.co.uk` address, and replies should land in your active `hello@everydriver.co.uk` inbox at SiteGround.

## Prerequisites (you do these, outside the code)
1. In Resend → Domains → add `everydriver.co.uk` (EU region).
2. In SiteGround DNS Zone Editor, add the 3 records Resend shows (MX + SPF on `send`, DKIM on `resend._domainkey`). Skip the `_dmarc` one — already present.
3. Click **Verify** in Resend, wait for green tick.
4. Reply **"verified"** in chat.

## What I will change in the code (after you say "verified")

### 1. Centralise sender config
Create a single shared helper used by every Resend-calling edge function so the from/reply-to is defined in exactly one place:

- `FROM_EMAIL = "EveryDriver <noreply@everydriver.co.uk>"`
- `REPLY_TO   = "hello@everydriver.co.uk"`

If we later want a different from-name per email type (e.g. `bookings@`, `payments@`), it's a one-line change in this helper.

### 2. Update all Resend-using edge functions
Sweep `supabase/functions/**` for any function that calls Resend (currently sending from `onboarding@resend.dev` or similar test addresses) and update each to:
- Import the shared helper
- Set `from: FROM_EMAIL`
- Set `reply_to: REPLY_TO`

Functions known to send mail (booking confirmations, payment receipts, instructor notifications, contact form, password/reset flows that go through Resend, etc.) — I'll enumerate them once exploring the folder and update each in one batch.

### 3. Deploy
Deploy all touched edge functions in a single `deploy_edge_functions` call.

### 4. Test
- Trigger one real send (e.g. contact form or a test booking) from the live site.
- Confirm the email lands in your inbox showing **From: EveryDriver `<noreply@everydriver.co.uk>`**.
- Hit Reply, confirm it auto-fills `hello@everydriver.co.uk`.
- Query `email_send_log` to confirm `status = sent`.

## Out of scope
- No changes to auth emails (Supabase handles those separately; they're not on Resend).
- No changes to the Lovable Emails infrastructure on `notify.everydriver.co.uk` — that stays disabled/unused; we're not removing the NS records unless you ask.
- No new mailboxes — `hello@everydriver.co.uk` is your existing SiteGround inbox.

## Reply when ready
Say **"verified"** once Resend shows the domain green, and I'll execute steps 1–4.
