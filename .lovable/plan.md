## Goal
Get app emails (enquiries, auth, receipts, etc.) actually delivering by aligning the Lovable Emails sender domain with the domain you've already verified DNS for.

## The exact mismatch
- Lovable Emails domain registered: **`notify.drive365.co.uk`** — status: **Failed** (provisioning timed out, DNS never verified).
- `send-transactional-email` is hard-coded to send from: **`notify.everydriver.co.uk`** (lines 16/20 of the function).
- Result: every send is rejected with *"No sender domain matches the requested sender domain"* — which is exactly what `email_send_log` is showing.
- The Resend verification you completed is on `everydriver.co.uk` but isn't wired into Lovable Emails, so it doesn't help.

## What I'll do

### 1. Set up `notify.everydriver.co.uk` as the Lovable email domain
Open the email-domain setup dialog so you can add **`notify.everydriver.co.uk`**. Lovable will give you 2 NS records to add at your `everydriver.co.uk` DNS provider (just like before). Lovable then manages SPF/DKIM/DMARC inside that delegated subdomain automatically — no conflict with the Resend setup on the root domain.

Why `notify.everydriver.co.uk` and not the root?
- The send function is already pointing at this exact subdomain, so zero code changes needed.
- The root `everydriver.co.uk` is already verified in Resend; reusing the same name in Lovable would conflict (Lovable's NS delegation would fight Resend's records).

### 2. Wait for verification, then confirm
Once DNS propagates (usually minutes, up to 72h), I'll re-check the domain status and trigger a test enquiry to confirm `email_send_log` shows `sent`/`delivered`.

### 3. Decommission the Resend path
- Delete the direct-Resend code I added to `create-enquiry` and revert it to use `send-transactional-email` like all other app emails.
- Optionally remove the `RESEND_API_KEY` secret and the Resend DNS records on the root `everydriver.co.uk` if you don't use Resend for anything else. (I'll list what's safe to remove before you delete anything.)

### 4. Clean up the failed drive365 domain
Remove the failed `notify.drive365.co.uk` entry so it stops appearing as a broken domain in Project Settings → Email.

## What you'll need to do
- **One thing only:** add the 2 NS records Lovable gives you to your `everydriver.co.uk` DNS (same registrar you used last time). I'll prompt you with the exact values in the setup dialog.

## What stays the same
- All existing templates, the send function, every trigger (enquiries, contact forms, receipts, etc.) — no rewrites.
- Auth emails will also start working once the domain is live (currently broken for the same reason).

## Outcome
One verified sender domain, one email system, every email type fixed in a single change. Resend can be fully retired or kept for unrelated use — your call.