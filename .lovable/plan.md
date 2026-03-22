

## Plan: Wire Comparison Page CTA Buttons to Signup with GoCardless

### What It Does
When a user clicks a plan's CTA button on `/compare`, they're taken to the instructor signup page with the selected plan pre-selected. For the £4.99 All-In plan, a "First month free" promotional message is shown. After signup, the onboarding flow initiates GoCardless Direct Debit setup for paid plans.

### Changes

#### 1. ComparisonPage.tsx — Add Navigation to CTA Buttons
- Import `useNavigate` from react-router-dom
- For plans with slug `free`: navigate to `/instructor-app/signup`
- For plans with slug `all_in`: navigate to `/instructor-app/signup?plan=all_in&promo=first-month-free`
- For plans with slug `gps`, `single_cam`, `duo_cam`: navigate to `/instructor-app/signup?plan={slug}`
- For `multi_school`: keep existing behaviour (contact us / phone link)

#### 2. InstructorSignup Page — Read Plan & Promo Query Params
- Read `plan` and `promo` from URL search params
- When `promo=first-month-free` and `plan=all_in`, show a promotional banner: "🎉 First month free on the All-In plan!"
- Pass the selected plan through to the onboarding/subscription flow so GoCardless billing is set up with the correct plan

#### 3. GoCardless Billing Request — Support First Month Free
- In the `gocardless-create-billing-request` edge function, when metadata includes `promo: first-month-free`, set the subscription start date to 1 month from now (so the first charge is delayed)
- Add `start_date` to the mandate request to defer the first payment by 30 days

### Files Modified
| File | Change |
|------|--------|
| `src/pages/ComparisonPage.tsx` | Add `useNavigate`, wire CTA buttons to signup with plan query params |
| Instructor signup page | Read `plan`/`promo` params, show promo banner, pass plan to onboarding |
| `supabase/functions/gocardless-create-billing-request/index.ts` | Support `promo` metadata to defer first payment by 1 month |

