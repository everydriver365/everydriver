

## Problem

On the booking checkout (MobileBookingView), payment methods are inconsistently gated:

- **Klarna** and **Clearpay** — always shown, ignoring instructor toggle settings (`klarna_enabled`, `clearpay_enabled`)
- **GoCardless (Pay by Bank)** — correctly gated by `instantBankPayEnabled` + `gatewayHealth.gocardless.available`
- **Cash** — correctly gated by `cashPaymentsEnabled`

Ken D has all toggles enabled, so GoCardless *should* appear. The likely issue is the `gatewayHealth.gocardless.available` check failing (network/timing), or the prop not being passed correctly. But the broader issue is that Klarna/Clearpay should also respect their instructor toggles.

## Plan

### 1. Fetch Klarna/Clearpay toggle settings from the instructor (BookingSummary.tsx)

- Add state: `klarnaEnabled`, `clearpayEnabled`
- Read `klarna_enabled`, `clearpay_enabled` from the instructor query result (already fetched via `select("*")`)
- Pass these as new props to `MobileBookingView`

### 2. Gate Klarna and Clearpay buttons behind instructor toggles (MobileBookingView.tsx)

- Add `klarnaEnabled` and `clearpayEnabled` props
- Wrap the Clearpay button (line ~963) with `{clearpayEnabled && ...}`
- Wrap the Klarna button (line ~978) with `{klarnaEnabled && ...}`

### 3. Remove the `gatewayHealth.gocardless.available` gate from GoCardless button

The `gatewayHealth` check adds a second barrier that can silently hide the button even when the instructor has it enabled. Since the instructor toggle is the intended control, and the health check can fail due to network issues:

- In MobileBookingView line 994: change condition from `instantBankPayEnabled && onInstantBankPay && gatewayHealth.gocardless.available` to just `instantBankPayEnabled && onInstantBankPay`
- Same change in BookingSummary.tsx desktop view (line ~2015)

### 4. Also gate Klarna/Clearpay in the desktop fallback view (BookingSummary.tsx)

Apply the same `klarnaEnabled`/`clearpayEnabled` checks to the desktop payment rendering section.

### Files changed
- `src/pages/BookingSummary.tsx` — fetch & pass toggle states, gate desktop payment tiles
- `src/components/booking/MobileBookingView.tsx` — accept new props, gate Klarna/Clearpay, simplify GoCardless condition

