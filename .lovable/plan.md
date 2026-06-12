## Fix contact-form email deliverability

Direct Resend sends from `noreply@everydriver.co.uk` are unaligned with the verified `notify.everydriver.co.uk` subdomain — SPF/DKIM fail and mail is silently quarantined. Switch to Lovable Emails so sends use the verified domain and appear in `email_send_log`.

### 1. Create a new transactional template

`supabase/functions/_shared/transactional-email-templates/admin-enquiry-notification.tsx`

- React Email component with white body, simple branded layout.
- Props: `name`, `email`, `phone`, `postcode`, `courseType`, `requestedHours`, `preferredTiming`, `additionalNotes`, `isCallback`.
- Subject (function): `📞 New Callback Request from {name}` when `isCallback`, else `📝 New Bespoke Course Enquiry from {name}`.
- `displayName`: "Admin enquiry notification".
- `previewData` with realistic sample values.

### 2. Register it

`supabase/functions/_shared/transactional-email-templates/registry.ts` — import the template and add `'admin-enquiry-notification': adminEnquiryNotification` to `TEMPLATES`.

### 3. Rewire create-enquiry

`supabase/functions/create-enquiry/index.ts`:

- Remove the direct `fetch("https://api.resend.com/emails", …)` block and the `RESEND_API_KEY` read.
- For each admin recipient in `adminEmails`, invoke `send-transactional-email`:

```ts
const r = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${supabaseServiceKey}`,
    apikey: supabaseServiceKey,
  },
  body: JSON.stringify({
    templateName: "admin-enquiry-notification",
    recipientEmail: adminEmail,
    idempotencyKey: `enquiry-${newEnquiry.id}-${adminEmail}`,
    templateData: {
      name: enquiry.name,
      email: enquiry.email,
      phone: enquiry.phone,
      postcode: enquiry.postcode.toUpperCase(),
      courseType: enquiry.courseType,
      requestedHours: enquiry.requestedHours,
      preferredTiming: enquiry.preferredTiming,
      additionalNotes: enquiry.additionalNotes,
      isCallback,
    },
  }),
});
```

- Track `emailSent` as true if at least one invocation returned ok; log failures (non-fatal so the enquiry still saves and instructors still get push notifications).
- Leave the rest of the function (insert, push notifications, response shape) untouched.

### 4. Deploy & verify

- Deploy `send-transactional-email` (template registry change) and `create-enquiry`.
- Submit a test enquiry; confirm a new `email_send_log` row with `template_name='admin-enquiry-notification'` reaches status `sent`, and that no other behaviour changed.

### Out of scope

- `MiniWebsiteContact` already routes through `create-enquiry`, so it inherits the fix — no separate change.
- Not touching `notify-admin-enquiry`, `notify-booking-enquiry`, or any other Resend call sites in this pass.
