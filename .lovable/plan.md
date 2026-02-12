

## TrueLayer Open Banking Integration

### What This Does
Adds TrueLayer as a payment option so pupils can pay directly from their bank app (via Faster Payments). When a pupil pays, the money lands in your TrueLayer merchant account almost instantly, and a payout is automatically triggered to the instructor's bank account -- giving you near-instant, low-fee, bank-to-bank payments.

### Prerequisites (You Need to Do First)
1. **Sign up at [TrueLayer Console](https://console.truelayer.com)** -- create a business account
2. **Complete KYB verification** -- TrueLayer needs to verify your business identity
3. **Get your API credentials** from the Console:
   - Client ID
   - Client Secret
   - Signing Key ID + Private Key (needed for the Payouts API)
4. **Set up a merchant account** in TrueLayer (this is where pupil payments land before being paid out)

### How the Flow Works

```text
Pupil clicks "Pay"
       |
       v
+-----------------------------+
| truelayer-checkout (edge fn)|  <-- Creates a payment via TrueLayer API
| Returns hosted payment link |
+-----------------------------+
       |
       v
Pupil completes payment in their banking app
       |
       v
+-----------------------------+
| truelayer-webhook (edge fn) |  <-- TrueLayer sends payment status update
| Records payment_history     |
| Updates pupil balance       |
| Triggers instructor payout  |
+-----------------------------+
       |
       v
+-----------------------------+
| truelayer-payout (edge fn)  |  <-- Sends money to instructor's bank
| Records in instructor_payouts|
+-----------------------------+
       |
       v
Instructor receives funds via Faster Payments
```

### What Gets Built

**1. Database Changes**
- Add `instructor_bank_details` table (sort code, account number, stored securely, RLS protected so only the instructor can see their own)
- Add `truelayer` as a payment gateway option

**2. Three Edge Functions**
- `truelayer-checkout` -- Authenticates with TrueLayer, creates a payment request, returns the hosted payment page URL for the pupil
- `truelayer-webhook` -- Receives payment status webhooks from TrueLayer, records the payment, updates pupil balance, and triggers instructor payout
- `truelayer-payout` -- Calls TrueLayer Payouts API to send funds to the instructor's bank account

**3. Instructor Bank Details UI**
- New section in instructor settings to enter sort code and account number
- Required before TrueLayer payouts can be sent to them

**4. Pupil Payment Integration**
- Add "Pay by Bank" as an option alongside existing card/BNPL methods
- Uses TrueLayer's Hosted Payment Page (no card details needed)

**5. Secrets Required**
- `TRUELAYER_CLIENT_ID`
- `TRUELAYER_CLIENT_SECRET`
- `TRUELAYER_SIGNING_KEY_ID`
- `TRUELAYER_SIGNING_PRIVATE_KEY`
- `TRUELAYER_WEBHOOK_SECRET`

### Technical Details

**TrueLayer API Flow:**
1. Get access token: POST to `https://auth.truelayer.com/connect/token` with client credentials
2. Create payment: POST to `https://api.truelayer.com/v3/payments` with amount, currency (GBP), beneficiary (merchant account)
3. Return `hosted_payment_page_link` to pupil's browser
4. Receive webhook on payment completion
5. Create payout: POST to `https://api.truelayer.com/v3/payouts` with instructor's sort code and account number

**Request signing:** TrueLayer's Payouts API requires request signing using ES512 (ECDSA with P-521). The signing key private key will be stored as a secret and used in the edge function.

**Commission handling:** The platform commission will be deducted before the instructor payout, matching the existing `platform_commission_config` logic.

**Sandbox vs Production:** A `TRUELAYER_SANDBOX` secret flag will control whether sandbox or production endpoints are used, matching how Clearpay/Klarna sandbox flags work in the existing codebase.

