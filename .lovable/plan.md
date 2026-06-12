## Goal
Move DNS for `everydriver.co.uk` from SiteGround to Cloudflare so Lovable can delegate `notify.everydriver.co.uk` for email sending. Get every app email (enquiries, auth, receipts, reminders) delivering through one verified sender.

## Your part (DNS — done once)

### 1. Inventory current SiteGround DNS
Before changing anything, open SiteGround Site Tools → DNS Zone Editor and screenshot the full record list. We need to recreate these in Cloudflare exactly, including:
- A / AAAA records for the root and any subdomains in use
- MX records (your inbox provider)
- TXT records (SPF, DMARC, Resend verification, Google site verification, etc.)
- CNAMEs (www, anything pointed at external services)

If anything is unclear from the screenshot I'll help identify what it's for.

### 2. Create Cloudflare account and add the domain
- Sign up free at cloudflare.com
- Add Site → enter `everydriver.co.uk` → Free plan
- Cloudflare auto-scans and imports most records. **Compare against your SiteGround screenshot** and add anything missing.
- For every mail-related record (MX, SPF, DKIM, DMARC, Resend records): set the proxy toggle to **DNS only (grey cloud)**, not proxied. Same for any record Lovable's custom-domain setup added (A `185.158.133.1`, TXT `_lovable`).

### 3. Switch nameservers at your domain registrar
Cloudflare gives you two nameservers (e.g. `xxx.ns.cloudflare.com`). Go to wherever you bought `everydriver.co.uk` (the registrar, not SiteGround hosting) and replace the existing nameservers with Cloudflare's two. Save.

Propagation: usually under an hour, occasionally up to 24h. Cloudflare emails you when active.

### 4. Tell me when Cloudflare shows the domain as Active
That's the signal to start the Lovable side.

### 5. Add the Lovable email-domain NS records
When I prompt you, Lovable will show 2 NS records for `notify`. In Cloudflare DNS:
- Type: NS, Name: `notify`, Target: (first Lovable NS), Proxy: DNS only
- Type: NS, Name: `notify`, Target: (second Lovable NS), Proxy: DNS only

Verification usually completes in minutes.

## My part (inside Lovable — I'll do all of this)

1. Open the email-domain setup dialog for `notify.everydriver.co.uk` and give you the exact NS values for Step 5 above.
2. Once verification passes, remove the failed `notify.drive365.co.uk` entry so the Email panel is clean.
3. Revert `create-enquiry` to call `send-transactional-email` like every other app email (removes the temporary direct-Resend path I added).
4. Send a test enquiry and confirm `email_send_log` shows `sent` → `delivered`.
5. Once the new path is proven working: remove the `RESEND_API_KEY` secret and audit the codebase for any other Resend references. Tell you what (if anything) is safe to delete from Resend's dashboard.
6. Auth emails (signup, password reset, magic links) will start working automatically once the domain is verified — I'll confirm by triggering a test password reset.

## Safety rails
- Resend keeps working throughout the migration because we copy its records into Cloudflare *before* switching nameservers.
- If anything goes wrong during nameserver propagation, you can revert nameservers at the registrar back to SiteGround's originals (note these down before changing).
- No code changes ship until DNS is verified, so the app can't get worse than it is right now.
- The custom-domain records (`185.158.133.1`, `_lovable` TXT) get copied into Cloudflare so `everydriver.co.uk` keeps serving the site without interruption.

## What you need to do right now
1. Screenshot SiteGround Site Tools → DNS Zone Editor (full record list).
2. Confirm where the domain is **registered** (the registrar, e.g. SiteGround themselves, GoDaddy, 123-reg). That's where the nameserver change happens.

Once you've done those two things, paste the screenshot here and I'll mark up exactly what needs to move into Cloudflare and what to leave behind. Then we proceed step by step.
