# Instructor Mobile — Corner Radius QA Checklist

Use this checklist to verify the sharpened iOS-premium radius scale is applied
consistently across the **instructor portal** on mobile. All values come from
the `--portal-radius-*` tokens defined in `src/index.css` (scoped to
`.instructor-portal`). See `mem://style/instructor-radius-scale-2026`.

## Radius scale (source of truth)

| Token                       | Value | Used for                                              |
| --------------------------- | ----- | ----------------------------------------------------- |
| `--portal-radius-card`      | 12px  | Main content cards, tiles, list containers           |
| `--portal-radius-icon`      | 12px  | Square icon background blocks                         |
| `--portal-radius-button`    | 12px  | Standard / primary / secondary buttons                |
| `--portal-radius-control`   | 12px  | Segmented controls                                    |
| `--portal-radius-input`     | 12px  | Search, text inputs, dropdowns, date selectors        |
| `--portal-radius-sheet`     | 16px  | Bottom sheets, modal dialogs                          |
| `--portal-radius-nav`       | 22px  | Floating bottom navigation                            |
| `--portal-radius-pill`      | 999px | Badges, status pills, count chips, date chips         |

Avatars and the floating microphone FAB stay **fully circular**.

---

## Test devices / viewports

Run the checklist on at least **two** of these mobile breakpoints in the preview
device toolbar (or browser devtools):

- iPhone SE — **375 × 667**
- iPhone 13/14 — **390 × 844**
- iPhone 14 Pro Max — **430 × 932**
- Android small — **360 × 800**

Repeat once in **light mode** and once in **dark mode** (`.dsm-dark`).

---

## 1. Global setup

- [ ] Open DevTools → Elements → confirm the `<body>` (or wrapping container)
      has the class `instructor-portal` on every instructor screen.
- [ ] In the Computed panel, inspect `:root` / `.instructor-portal` and verify
      the eight `--portal-radius-*` tokens above have the documented values.
- [ ] No instructor screen sets a hard-coded `border-radius` larger than 16px
      on a card-like surface (search the codebase for `rounded-3xl`,
      `rounded-[24px]`, `rounded-[28px]`, etc., inside `src/components/instructor/`
      and `src/pages/instructor*` / `everyInstructor*`).

---

## 2. Per-screen visual checks

Walk every screen below and confirm corners match the table.

### Home (`/every-instructor`)
- [ ] Up Next / Next Lesson card → **12px**
- [ ] Lesson Details, Conditions, Last Lesson cards → **12px**
- [ ] Balance / Take Payment card → **12px**
- [ ] Do This Next, Needs Your Attention cards → **12px**
- [ ] Today's Schedule row tiles → **12px**
- [ ] Quick Actions list container → **12px** (inner rows hairline-divided, not separately rounded)
- [ ] Status pills (`Online`, `Awaiting`, countdown chip) → **fully rounded**
- [ ] Notification count badge on tab icons → **fully rounded**
- [ ] Avatars → **circle**
- [ ] Floating mic FAB → **circle** with strong shadow
- [ ] Bottom nav floating bar → **22px**

### Schedule (`/every-instructor/schedule`)
- [ ] Day cards / lesson cards → **12px**
- [ ] Today / Tomorrow segmented control → **12px** outer, **10px** segments
- [ ] Filter chips → **fully rounded**
- [ ] Empty-state cards → **12px**

### Tracking (`/every-instructor/tracking`)
- [ ] Map container card → **12px**
- [ ] Telemetry stat tiles → **12px**, icon roundels → **12px**
- [ ] Trip rows / list container → **12px**

### Money (`/every-instructor/pay`)
- [ ] Balance / earnings cards → **12px**
- [ ] Payment method tiles (Klarna, Square, GoCardless, SumUp) → **12px**
- [ ] Take Payment / Collect / Chase buttons → **12px**
- [ ] Receipt / invoice list rows → outer container **12px**, no per-row radius

### Pupils (`/every-instructor/pupils`)
- [ ] Pupil cards → **12px**
- [ ] Avatars → **circle**
- [ ] All / Active / Passed segmented control → **12px / 10px**
- [ ] Search input → **12px**

### Menu (`/every-instructor/menu`)
- [ ] Grouped settings list containers → **12px**
- [ ] Tool / settings cards → **12px**
- [ ] Profile photo → **circle**
- [ ] Toggles → unchanged native iOS pill switch

### Modals & sheets
- [ ] Bottom sheets — top corners **16px**
- [ ] Confirmation dialogs / modal cards → **12–16px**
- [ ] Drawer grab-handle pill remains fully rounded

---

## 3. Buttons & controls

- [ ] Nav, Call, Text action buttons on Up Next → **12px**
- [ ] Primary CTAs (Save, Continue, Confirm, Send, Take Payment) → **12px**
- [ ] Destructive buttons (Cancel) → **12px**
- [ ] Segmented controls everywhere → **12px** outer with **10px** active segment
- [ ] No button on any instructor screen is fully pill-shaped unless it is
      a *badge*, *status chip*, or *date chip*.

---

## 4. Inputs

- [ ] Search bars (`SearchInput`) → **12px**
- [ ] Text fields, dropdowns, date pickers → **12px**
- [ ] Form sections grouped in a card → outer **12px**, no double-rounded rows

---

## 5. Pills, badges, avatars (must stay round)

- [ ] All `Badge` components inside `.instructor-portal` → **999px**
- [ ] Notification dots / count chips → **999px**
- [ ] `ONLINE`, `AWAITING`, status pills → **999px**
- [ ] User and pupil avatars → **circle**
- [ ] Microphone FAB → **circle**

---

## 6. Visual polish (regression checks)

- [ ] Card shadows still soft, not flat (no shadow loss after radius change)
- [ ] 0.5–1px hairline borders still visible on flat cards
- [ ] No clipped content inside cards (icons/avatars not cut by smaller radius)
- [ ] No double-border ring around cards inside nested containers
- [ ] Light mode and dark mode both render the same radii
- [ ] Tap feedback (scale 0.98) still works on all buttons

---

## 7. Functional regression (must remain unchanged)

- [ ] Bottom nav routes navigate correctly
- [ ] Up Next Nav / Call / Text actions still trigger
- [ ] Take Payment / Collect / Chase flows unchanged
- [ ] Live data (lessons, balances, badges) renders — no mock data
- [ ] Loading, empty, error and offline states render with the new radii
- [ ] Notification badge counts unchanged

---

## 8. Sign-off

| Tester | Device         | Mode  | Date       | Pass / Fail | Notes |
| ------ | -------------- | ----- | ---------- | ----------- | ----- |
|        | iPhone 13 390  | Light |            |             |       |
|        | iPhone SE 375  | Light |            |             |       |
|        | iPhone 13 390  | Dark  |            |             |       |
|        | Android 360    | Light |            |             |       |

A release is only considered **radius-clean** when every row above passes on at
least two devices in both light and dark mode.
