

## Plan: School Payment Gateways + Admin School Commission Settings

### Overview
Add a "Payment Gateways" section to the school sidebar where schools choose between using the DSM (platform) Square account (paying a commission set by admin) or connecting their own payment gateway credentials (Square, Stripe, PayPal). Also add a "School Commission" config card in the admin portal's Commission & Fees section.

### Database Changes

**Add columns to `schools` table:**
- `payment_gateway_mode` (text, default `'platform'`) — `'platform'` (use DSM Square) or `'own'` (own credentials)
- `own_square_app_id` (text, nullable)
- `own_square_access_token` (text, nullable)
- `own_square_location_id` (text, nullable)
- `own_stripe_publishable_key` (text, nullable)
- `own_stripe_secret_key` (text, nullable)
- `own_paypal_client_id` (text, nullable)
- `own_paypal_secret` (text, nullable)

**Add row to `platform_commission_config`:**
- Insert a new row with `commission_type = 'school_payment'` to let admin set the school commission rate separately from instructor rates.

### Files to Create

**`src/components/school/SchoolPaymentGatewaysSection.tsx`**
- Radio toggle: "Use DSM Square Account" vs "Use Your Own Gateway"
- Platform mode: shows info about commission rate (fetched from `platform_commission_config` where `commission_type = 'school_payment'`), status badge, and explanation
- Own gateway mode: tabbed form for Square / Stripe / PayPal credential fields with save per provider
- Reads/writes the new `schools` columns
- Demo mode: local state with toast feedback

### Files to Modify

1. **`src/components/school/SchoolLayout.tsx`**
   - Add `{ key: "payment-gateways", label: "Payment Gateways", icon: CreditCard }` to the Financials sidebar group
   - Add `payment-gateways` to `sectionMeta`

2. **`src/pages/SchoolPortal.tsx`**
   - Add `case "payment-gateways"` returning `<SchoolPaymentGatewaysSection school={school} onRefresh={refetch} />`

3. **`src/pages/DemoSchoolPortal.tsx`**
   - Add `case "payment-gateways"` with demo props

4. **`src/components/admin/CommissionSettingsManager.tsx`**
   - No code change needed — the new `school_payment` row in `platform_commission_config` will automatically appear as a third card in the existing grid, since the component queries all rows from the table. Just need to handle the label mapping for the new commission type.
   - Add label mapping: `commission_type === "school_payment"` → "School Payment" with a 🏫 icon

5. **Database migration** — add columns + seed commission row

### Technical Notes
- Credential fields are stored in the `schools` table for now (can be wired to edge functions later)
- The commission rate for schools using the platform account is managed by admin via the existing Commission & Fees section
- No actual payment processing changes — this is configuration UI only, to be wired up later as stated

