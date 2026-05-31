## Square Invoices — instructor & admin desktop portals

Adds invoicing on top of the existing Square integration (payments, wallet, subscriptions, refunds, OAuth, webhooks). Desktop portals only — mobile untouched.

---

## Sending account rules (confirmed)

- **Instructor portal** → invoice is sent from the **instructor's own connected Square account** (`instructors.square_merchant_id` + per-instructor OAuth tokens). Money lands in their Square balance.
- **Admin / school portal** → invoice is sent from the **platform Square account** already configured via the existing `SQUARE_ACCESS_TOKEN` / `SQUARE_LOCATION_ID` / `SQUARE_APPLICATION_ID` secrets. No new secrets needed.
- If an instructor hasn't connected Square, the "Send Invoice" button is disabled with a tooltip linking to Settings → Payments.

---

## Service Fee (confirmed)

UK Service Fee line is auto-added to instructor invoices using the existing `useAdminFee` / tiered service fee logic, exactly like checkout. Labelled **"Service Fee"** per UK compliance memory. Admin/school invoices do not add it (school billing is separate).

## Due date (confirmed)

Configurable per invoice in the Send dialog. Defaults to **7 days** from send. Instructors can also set their preferred default in Settings → Payments (`instructors.default_invoice_due_days`).

---

## What the user sees

### Instructor desktop portal
- **"Send Invoice"** button on:
  - Pupil course summary page (next to "Send Reminder")
  - Payment history rows
  - Accounts / In-Out page (bulk: invoice all pupils with outstanding balance)
- Dialog pre-fills: pupil name + email, line items (hours × rate, top-up), Service Fee line, due date (editable date picker, defaults to instructor's default), optional message
- Status pill per invoice: Draft / Sent / Viewed / Paid / Overdue / Cancelled — with "View in Square" link and Resend / Cancel actions
- Paid invoices auto-credit the pupil balance via `increment_pupil_balance` RPC

### Admin desktop portal
- New **Invoices** section under `/admin` with a sidebar entry
- List of all school-issued invoices (filters: status, date range, recipient, amount)
- Per-row actions: view, resend, cancel, refund (uses existing `square-refund`)
- Read-only view of instructor-issued invoices for audit/support — admin cannot send on the instructor's behalf

---

## What we build

### 1. Database
**New table** `public.square_invoices`
- `issuer_type` ('instructor' | 'school'), `issuer_instructor_id` (nullable)
- `recipient_pupil_id` (nullable), `recipient_email`, `recipient_name`
- `square_invoice_id`, `square_order_id`, `public_url`, `square_location_id`
- `status`, `amount_cents`, `service_fee_cents`, `currency`, `due_date`, `description`, `line_items` jsonb
- `sent_at`, `paid_at`, `cancelled_at`, `last_event_at`
- RLS: instructor sees own (`get_instructor_id_for_user(auth.uid())`), admin sees all (`has_role`), pupil sees own
- GRANTs to `authenticated` + `service_role`

**New column** `instructors.default_invoice_due_days int default 7`

### 2. Edge functions (new)
- `square-create-invoice` — picks instructor tokens (caller is instructor) or platform `SQUARE_ACCESS_TOKEN` (caller is admin); creates Order → Invoice → publishes; adds Service Fee line for instructor invoices; inserts row
- `square-cancel-invoice` — cancels draft/unpaid
- `square-resend-invoice` — republish/resend email

**Extend `square-webhook`** to handle `invoice.created`, `invoice.published`, `invoice.payment_made`, `invoice.canceled`, `invoice.refunded` → update row and call `increment_pupil_balance` on paid (instructor invoices only).

### 3. Square OAuth scope bump
Add `INVOICES_WRITE` + `INVOICES_READ` to `square-oauth` scope list. Instructors with existing connections are prompted to **reconnect once** the first time they try to send an invoice.

### 4. Frontend (desktop, `md:` and above)
- `SendInvoiceDialog.tsx` — shared dialog with due-date picker and Service Fee preview
- `InvoiceStatusBadge.tsx` — shared status pill
- Instructor: hooks added to `PupilCourseSummary.tsx`, `InstructorAccounts.tsx`, `InstructorInOut.tsx`
- Admin: new `AdminInvoicesPage.tsx` + route + sidebar entry
- Settings → Payments: new "Default invoice due days" field

---

## Out of scope
- Mobile layouts (per mobile-update policy)
- Recurring/subscription invoices (existing Square subscriptions handle this)
- Admin sending on behalf of an instructor (explicitly excluded — admin uses platform account only)
