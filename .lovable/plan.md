

## Use Standard Apple Pay / Google Pay Branded Buttons

### Problem
The Apple Pay button across all payment flows is a plain black `<button>` with text "Pay with Apple Pay" — no Apple logo, no standard styling. Users expect the recognizable branded buttons they see everywhere else. Google Pay already uses the official SDK `createButton` (which renders the proper branded button), so only Apple Pay needs fixing.

### Solution
Replace the custom Apple Pay `<button>` elements with the native `-apple-pay-button` CSS approach (`-webkit-appearance: -apple-pay-button`), which renders the official Apple-branded button with the  logo automatically. This is the Apple-recommended approach and requires no external assets.

### Files to Change

**1. `src/components/payments/ElavonWalletButtons.tsx`** (lines 361-371)
- Replace the plain `<button>` with a native Apple Pay button element using `-webkit-appearance: -apple-pay-button` and `-apple-pay-button-type: pay`

**2. `src/components/booking/ElavonBookingWalletButtons.tsx`** (lines 405-415)
- Same change — replace plain button with native Apple Pay button

**3. `src/components/payments/CardstreamCheckout.tsx`** (lines 341-356)
- Replace the `<Button>` with the native Apple Pay button styling (currently uses a Lucide `Apple` icon which isn't the real  logo)

### Implementation Detail
Each Apple Pay button becomes:
```html
<button
  onClick={handleApplePay}
  disabled={...}
  style={{
    WebkitAppearance: '-apple-pay-button',
    appearance: '-apple-pay-button' as any,
    // @ts-ignore
    '-apple-pay-button-type': 'pay',
    '-apple-pay-button-style': 'black',
  }}
  className="w-full h-[44px] rounded-lg cursor-pointer disabled:opacity-50"
/>
```

This renders the official Apple Pay button with the  logo, matching what users expect on iOS/Safari. No image assets needed — it's a native browser feature available wherever `ApplePaySession` is supported.

Google Pay buttons already use the official SDK's `createButton()` — no changes needed there.

