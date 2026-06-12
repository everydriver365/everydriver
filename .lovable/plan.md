## Problem

The `/contact` page's "Send us a message" and "Request a Callback" forms submit to the `create-enquiry` edge function. That function still sends admin notifications via **Resend directly**, using `from: noreply@everydriver.co.uk` (the root domain). Since your verified sender domain is `notify.everydriver.co.uk`, Resend rejects (or silently drops) these sends, but the function returns `success: true` to the form anyway — so the UI shows "Message sent!" while no email arrives.

Meanwhile, the auto-reply confirmation to the visitor isn't sent at all.

## Fix

Migrate `create-enquiry` off direct Resend and onto the Lovable Emails queue, same pipeline that's already working for my admin-enquiry test.

### 1. New app email template — `contact-enquiry-admin`
- `supabase/functions/_shared/transactional-email-templates/contact-enquiry-admin.tsx`
- Receives: name, email, phone, courseType (callback/general/bespoke), hours, timing, message
- Subject: "📞 New Callback from {name}" or "📝 New Enquiry from {name}"
- Brand-consistent React Email layout (same tokens as existing templates)
- Registered in `_shared/transactional-email-templates/registry.ts`

### 2. New app email template — `contact-enquiry-confirmation`
- Sent to the visitor when they provide an email
- Subject: "We've received your message – EveryDriver"
- Short thank-you + what to expect next

### 3. Update `create-enquiry/index.ts`
- Remove the direct `fetch("https://api.resend.com/emails", ...)` block and the `RESEND_API_KEY` dependency
- After inserting the enquiry, invoke `send-transactional-email` twice:
  - One per admin email in `admin_notification_emails` (or fallback `enquiries@everydriver.co.uk`) with template `contact-enquiry-admin`, idempotency key `enquiry-admin-{enquiryId}-{recipientHash}`
  - If visitor provided an email, send `contact-enquiry-confirmation` with idempotency key `enquiry-confirm-{enquiryId}`
- Set `emailSent` based on actual invoke success (not silently swallow errors)
- Return a proper error to the client if the enquiry insert succeeds but email enqueue fails, so the UI can show real feedback

### 4. Deploy
- Deploy `create-enquiry` and `send-transactional-email` after template/registry changes

### 5. Validate
- Submit the live `/contact` form
- Check `email_send_log` for both rows progressing `pending` → `sent`
- Confirm delivery to `enquiries@everydriver.co.uk` and to the visitor address

## Out of scope
- BespokeEnquiryForm (different component – will inherit the same backend fix automatically since it uses the same function, but I'll verify its payload shape)
- School/instructor mini-website contact forms
- Removing the now-unused `RESEND_API_KEY` secret (leave in place unless you ask to delete it)
