
# Plan: Replace GoCardless with Square Subscriptions

## Overview
Switch the instructor onboarding payment flow from GoCardless Direct Debit to Square Subscriptions. This involves creating a card tokenization UI using Square's Web Payments SDK and backend functions to create customers and subscriptions in Square.

## Current State
- GoCardless is currently used for instructor subscription payments
- Square is already configured with all required credentials:
  - `SQUARE_ACCESS_TOKEN`
  - `SQUARE_APPLICATION_ID`
  - `SQUARE_LOCATION_ID`
  - `SQUARE_ENVIRONMENT`
- Existing `square-wallet-config` function provides SDK configuration
- Database has `instructor_subscriptions` table with GoCardless-specific columns

## Square Subscriptions Flow

```text
┌─────────────────────────────────────────────────────────────┐
│                   User Onboarding Flow                       │
├─────────────────────────────────────────────────────────────┤
│  1. User selects plan + domain                              │
│  2. StepPayment loads Square Web Payments SDK               │
│  3. User enters card details in embedded Square Card form   │
│  4. Frontend tokenizes card → receives card nonce           │
│  5. Calls square-create-subscription edge function          │
│  6. Backend: Creates Square Customer (if needed)            │
│  7. Backend: Creates Card on File from nonce                │
│  8. Backend: Creates Subscription with card ID              │
│  9. Returns success → user proceeds to dashboard            │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Steps

### 1. Database Migration
Add Square-specific columns to `instructor_subscriptions` table:
- `square_customer_id` (text)
- `square_subscription_id` (text)
- `square_card_id` (text)

### 2. Add Square Plan IDs to subscription_plans
Add a `square_plan_variation_id` column to store the Square catalog plan variation IDs (you'll need to create these in your Square dashboard or via API).

### 3. Create Edge Function: `square-create-subscription`
This function will:
- Accept: instructor_id, plan_id, card_nonce, domain details
- Create a Square Customer (or retrieve existing)
- Create a Card on File using the card nonce
- Create a Subscription using the card and plan variation
- Update the `instructor_subscriptions` table with Square IDs
- Return success/failure

### 4. Create Edge Function: `square-webhook`
Handle Square webhook events for:
- `subscription.created` - Confirm subscription active
- `subscription.updated` - Handle status changes
- `invoice.payment_made` - Extend subscription period
- `invoice.payment_failed` - Mark payment failed

### 5. Update StepPayment Component
Replace GoCardless redirect flow with:
- Load Square Web Payments SDK via script tag
- Initialize Square Card payment form
- Tokenize card on submission
- Call `square-create-subscription` with the token
- Handle success/error states inline (no redirect needed)

### 6. Update InstructorOnboarding.tsx
- Remove GoCardless return handling (no longer needed since Square doesn't redirect)
- Update payment step to use new Square flow

### 7. Cleanup (Optional)
- Remove or deprecate GoCardless edge functions
- Remove GoCardless-specific columns from UI (keep in DB for historical data)

---

## Technical Details

### Square Web Payments SDK Integration
The SDK will be loaded dynamically in the payment component:
```javascript
// Load Square SDK
const script = document.createElement('script');
script.src = environment === 'production' 
  ? 'https://web.squarecdn.com/v1/square.js'
  : 'https://sandbox.web.squarecdn.com/v1/square.js';

// Initialize and attach card form
const payments = window.Square.payments(appId, locationId);
const card = await payments.card();
await card.attach('#card-container');

// Tokenize on submit
const result = await card.tokenize();
// result.token is the card nonce
```

### Edge Function: square-create-subscription
Key API calls:
1. `POST /v2/customers` - Create customer with email/name
2. `POST /v2/cards` - Create card on file using nonce
3. `POST /v2/subscriptions` - Create subscription with card + plan

### Webhook Events
Square will send webhook events to `square-webhook` for:
- Subscription lifecycle events
- Payment confirmations
- Failed payment notifications

### Files to Create
| File | Purpose |
|------|---------|
| `supabase/functions/square-create-subscription/index.ts` | Create customer, card, and subscription |
| `supabase/functions/square-webhook/index.ts` | Handle Square webhook events |

### Files to Modify
| File | Changes |
|------|---------|
| `src/pages/instructor-app/onboarding/steps/StepPayment.tsx` | Replace GoCardless UI with Square Card form |
| `src/pages/instructor-app/onboarding/InstructorOnboarding.tsx` | Remove GoCardless return handling |
| Database migration | Add Square columns to instructor_subscriptions |

---

## Prerequisites / Setup Required
1. **Square Dashboard Setup**: Create subscription plans (catalog items) in Square and note the `plan_variation_id` for each tier (Pro, Max, Multi, Enterprise)
2. **Webhook URL**: Configure webhook endpoint in Square dashboard pointing to your `square-webhook` function
3. **Environment**: Ensure `SQUARE_ENVIRONMENT` is set correctly (sandbox for testing, production for live)

## Benefits of Square over GoCardless
- No redirect flow - card entry happens inline
- Supports card payments (not just Direct Debit)
- Faster payment processing
- Better international support
- Already integrated in your system for other payments
