## Goal

Now that `everydriver.co.uk` is verified in Resend, normalise every outbound email across the 23 edge functions so:

1. All `from` addresses use the verified root domain `everydriver.co.uk` (drop the mixed `notify.everydriver.co.uk` subdomain — it isn't part of the just-verified DNS).
2. Every email sets `reply_to: "hello@everydriver.co.uk"` (unless a more specific reply-to already exists — see below) so user replies land in the active SiteGround mailbox.

## Changes

### 1. Unify the From domain

Standardise on these three branded senders (all on the verified root domain):

| Purpose | From address |
|---|---|
| General transactional (reminders, receipts, welcomes, auth, backups, lessons, campaigns) | `EveryDriver <noreply@everydriver.co.uk>` |
| Enquiry notifications | `EveryDriver Enquiries <enquiries@everydriver.co.uk>` |
| Admin/support messages | `EveryDriver Support <support@everydriver.co.uk>` |
| System notifications (test swap, upsell, compliance) | `EveryDriver <notifications@everydriver.co.uk>` |

Files updated (all `notify.everydriver.co.uk` → `everydriver.co.uk`):
- `notify-lessons-scheduled`
- `notify-booking-enquiry` (both sends)
- `send-lesson-reminders`
- `notify-admin-enquiry`
- `notify-test-swap-match`
- `notify-public-test-swap-request`

### 2. Add `reply_to: "hello@everydriver.co.uk"`

Add a default reply-to on every Resend send call that doesn't already have one, so any user hitting "Reply" reaches the live `hello@everydriver.co.uk` mailbox at SiteGround.

Existing per-message reply-to values are preserved (they're more useful):
- `notify-booking-enquiry` → `pupil_email` / `instructor.email`
- `notify-admin-enquiry` → `pupil_email`
- `notify-admin-message` → `ADMIN_EMAIL`
- `notify-public-test-swap-request` → `me.email`

All other ~18 send sites get `reply_to: "hello@everydriver.co.uk"` added.

### 3. Deploy

Deploy all 23 affected edge functions in one batch after the edits.

## Out of scope

- No template/copy changes.
- No DNS changes (domain already verified).
- No changes to the SiteGround inbox or MX records.
- Lovable Emails / queue infrastructure remains untouched — this project sends directly via the Resend API.
