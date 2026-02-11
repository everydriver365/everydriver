

# Enable Klarna and Clearpay on Instructor Mini-Websites (Pro+ Only)

## Overview

Allow instructors on the **Pro plan and above** to toggle Klarna ("Pay in 3") and Clearpay ("Pay in 4") as payment options on their mini-website course cards. When enabled, the BNPL logos and instalment messaging appear on the public-facing mini-website. The instructor absorbs the provider fees, which are clearly displayed when toggling each option on.

## Database Changes

Add two new boolean columns to the `instructors` table:

- `klarna_enabled` (boolean, default `false`) -- whether Klarna appears on their mini-website
- `clearpay_enabled` (boolean, default `false`) -- whether Clearpay appears on their mini-website

## UI Changes

### 1. Instructor Settings (Desktop) -- `AccountSettings.tsx`

Add a new **"Payment Options"** card (or section) containing:

- **Klarna toggle** (Switch component)
  - When toggled ON, show an info box:
    > "Klarna charges 3.29% + 20p per transaction. You (the instructor) will pay these fees."
  - Gated: disabled with lock icon + "Pro plan required" if on Free plan
- **Clearpay toggle** (Switch component)
  - When toggled ON, show an info box:
    > "Clearpay charges 4-6% + 30p per transaction. You (the instructor) will pay these fees."
  - Gated: disabled with lock icon + "Pro plan required" if on Free plan

Both toggles save directly to the `instructors` table (`klarna_enabled`, `clearpay_enabled`).

### 2. Instructor Settings (Mobile App) -- `InstructorSettings.tsx`

Add the same Payment Options toggles in the settings page, with the same fee info boxes and plan gating.

### 3. Mini-Website Public Page -- `InstructorMiniWebsite.tsx`

When `klarna_enabled` or `clearpay_enabled` is true on the instructor record:

- Show Klarna/Clearpay instalment badges below each course price (e.g., "3 x GBP33.33 with Klarna" / "4 x GBP25.00 with Clearpay")
- Show the provider logos in the footer or near the booking CTA
- These use the existing `KlarnaExpressButton` and `ClearpayInstalmentBadge` components already in the codebase

### 4. Plan Gating

Use the existing `useMenuFeatureGates` / subscription features pattern:

- Check `subscription?.features` for `payment_tracking` (which Pro and above already have)
- If the instructor is on Free, the toggles are disabled with a subtle upgrade prompt
- If the instructor somehow has the flags enabled but downgrades, the mini-website should not show BNPL options (check plan server-side or at render time)

## Technical Details

### Migration SQL

```sql
ALTER TABLE public.instructors 
  ADD COLUMN IF NOT EXISTS klarna_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS clearpay_enabled boolean DEFAULT false;
```

### Files to Create/Modify

| File | Change |
|------|--------|
| `src/components/instructor/AccountSettings.tsx` | Add Payment Options section with Klarna/Clearpay toggles and fee info |
| `src/pages/InstructorSettings.tsx` | Add same Payment Options toggles for mobile app settings |
| `src/pages/InstructorMiniWebsite.tsx` | Read `klarna_enabled`/`clearpay_enabled` from instructor data; conditionally render instalment badges on course cards |
| `src/context/InstructorAuthContext.tsx` | Add `klarna_enabled` and `clearpay_enabled` to the instructor select query |

### Fee Display Details

When a toggle is turned ON, a coloured info card appears below it:

- **Klarna**: Pink-tinted card with Klarna logo, text: "Klarna charges **3.29% + 20p** per transaction. These fees are deducted from your payment. Example: On a GBP500 course, the fee would be GBP16.65."
- **Clearpay**: Mint-tinted card with Clearpay badge, text: "Clearpay charges **4--6% + 30p** per transaction. These fees are deducted from your payment. Example: On a GBP500 course, the fee would be approx GBP20--30."

### Flow Summary

```text
Instructor enables Klarna/Clearpay in Settings
  --> Saved to instructors table (klarna_enabled / clearpay_enabled)
  --> Mini-website reads these flags
  --> Course cards show instalment badges + BNPL buttons
  --> Pupil pays via Klarna/Clearpay at checkout
  --> Instructor absorbs the transaction fees
```

