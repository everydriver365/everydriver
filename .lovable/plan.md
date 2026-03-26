

## Square OAuth Auto-Payouts with Manual Fallback

### Summary

Enable instructors to connect their own Square account via OAuth. When connected, pupil payments are automatically split — the instructor's share goes directly to their Square account, and the platform fee is retained. When NOT connected, the existing manual payout flow (admin marks payments as transferred) continues unchanged.

### How It Works

```text
INSTRUCTOR HAS SQUARE CONNECTED:
  Pupil pays £100 via Square
  → Square splits automatically:
     £97.50 → instructor's Square account
     £2.50  → platform Square account (service fee)
  → payment_history recorded with payout_status = 'auto_transferred'
  → instructor_payouts record created with method = 'square_auto'
  → No admin action needed

INSTRUCTOR DOES NOT HAVE SQUARE:
  Pupil pays £100 via Square
  → £100 goes to platform Square account
  → payment_history recorded with payout_status = 'pending'
  → Admin manually marks as transferred (existing flow)
```

### Prerequisites

You need to apply for **Square Marketplace** access in the Square Developer Dashboard. This enables the `app_fee_money` parameter for multi-party payments. Without this, the OAuth flow will work but automatic fund splitting will not.

You also need to register an OAuth redirect URI in Square Developer Dashboard: `https://everydriver.lovable.app/instructor/square-callback`

### Implementation

**Step 1: Database — Add Square OAuth columns to instructors**

Migration adding:
- `square_merchant_id` (text, nullable) — the instructor's Square merchant/location ID
- `square_access_token_encrypted` (text, nullable) — their OAuth access token (stored encrypted in edge function, not client-accessible)
- `square_refresh_token_encrypted` (text, nullable) — refresh token
- `square_token_expires_at` (timestamptz, nullable)
- `square_connected_at` (timestamptz, nullable)

**Step 2: Edge Function — `square-oauth`**

Handles three actions:
- `authorize` — builds the Square OAuth URL with required scopes (`PAYMENTS_WRITE`, `MERCHANT_PROFILE_READ`) and returns it
- `callback` — exchanges the auth code for tokens, stores them against the instructor, fetches merchant info
- `disconnect` — clears the Square OAuth columns for that instructor

Requires new secrets: `SQUARE_APPLICATION_ID` (already exists), `SQUARE_OAUTH_SECRET` (new — the OAuth Application Secret from Square Dashboard).

**Step 3: Callback Page — `src/pages/instructor/SquareCallback.tsx`**

Similar to the existing `AccountingCallback.tsx` — reads code/state from URL params, calls the `square-oauth` edge function with action `callback`, shows success/error.

Route: `/instructor/square-callback`

**Step 4: UI — "Connect Square" in Instructor Settings**

Add a section to the instructor settings page:
- If not connected: "Connect Your Square Account" button → opens Square OAuth popup
- If connected: Shows merchant name, connected date, "Disconnect" button
- Info text explaining that connecting enables automatic payouts

**Step 5: Update `square-checkout` and `square-payment` edge functions**

When processing a payment:
1. Look up the instructor's `square_merchant_id` and `square_access_token`
2. If connected: use the **instructor's access token** instead of the platform token, and add `app_fee_money` for the platform's service fee
3. If not connected: use the existing platform token (current behaviour, no change)

Key change in the Square API payload:
```json
// When instructor has Square OAuth:
{
  "amount_money": { "amount": 10000, "currency": "GBP" },
  "app_fee_money": { "amount": 250, "currency": "GBP" }
}
```

**Step 6: Update `square-webhook` to handle auto-payout recording**

When a `payment.completed` webhook fires:
- Check if the instructor has a connected Square account
- If yes: record `payout_status = 'auto_transferred'` in `payment_history` and create an `instructor_payouts` record with `notes = 'Auto-paid via Square OAuth'`
- If no: record `payout_status = 'pending'` (current behaviour)

**Step 7: Update Admin Payouts view**

- Filter auto-transferred payments out of the "Pending" tab (they already are since status ≠ pending)
- Show auto-transferred payments in the "Paid" tab with a distinct badge ("Auto-paid via Square")
- Add a filter/indicator so admins can see which instructors have Square connected vs manual

**Step 8: Update Instructor Payout History**

Show auto-transferred payouts with a "Direct to Square" badge instead of "Transferred by admin"

### Files to Create
- `supabase/functions/square-oauth/index.ts`
- `src/pages/instructor/SquareCallback.tsx`

### Files to Modify
- `supabase/functions/square-checkout/index.ts` — add instructor token + app_fee_money logic
- `supabase/functions/square-payment/index.ts` — same
- `supabase/functions/square-webhook/index.ts` — auto-payout recording
- `src/components/admin/AdminInstructorPayouts.tsx` — auto-paid badge
- `src/components/instructor/InstructorPayoutHistory.tsx` — direct payout badge
- `src/pages/InstructorSettings.tsx` — Connect Square section
- `src/routes/*.tsx` — add square-callback route

### New Secret Required
- `SQUARE_OAUTH_SECRET` — the OAuth Application Secret from your Square Developer Dashboard (Settings → OAuth → Application Secret)

