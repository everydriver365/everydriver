## Goal
Make per-channel eligibility crystal clear in the preview so the user can see, before sending, exactly which channels each pupil will / won't receive on and why.

## Changes (UI only, `SendAllRemindersDialog.tsx`)

### 1. Add per-channel status chips to each pupil row
Replace the single "Receiving on: …" / "missing …" text with a row of chips — one chip per **selected** channel — showing one of three states:

- **Ready** (green): channel will send. Icon + label.
- **Missing contact** (amber): channel selected but pupil has no phone/email. Tooltip: "No phone on file" / "No email on file".
- **Not selected**: hidden (only show chips for currently selected channels).

Each chip uses the channel icon + label + a small status dot, so the user can scan the list and instantly see gaps.

### 2. Restructure the Preview block by channel
Currently the preview shows one message per pupil. Change to:

```text
Sarah Jones · £45.00
  ✓ Text       "Hi Sarah, friendly reminder…"
  ✓ WhatsApp   "Hi Sarah, friendly reminder…"
  ✗ Email      Skipped — no email on file
```

For each selected pupil, list **every selected channel** with either the final formatted message (Email shows subject + body; SMS/WhatsApp/In-app show the short text) or a clear "Skipped — reason" line in muted rose. This makes ineligibility visible inside the preview itself, not just in the list above.

### 3. Add a compact summary line above the preview
`X messages will send · Y skipped (Z missing email, W missing phone)` so the user sees the totals at a glance before clicking Send.

### 4. Keep the fully-ineligible pupil rows (already shown) but tighten the copy
"Skipped on all channels — no phone or email on file" (clearer than the current join).

## Technical notes
- Extract a `buildMessage(p, ch, fromName)` helper returning `{ subject?, body }` and reuse it in both `sendOne` and the preview (removes the duplicated template string at lines 145 & 369).
- Add a `channelStatusFor(p, ch)` helper returning `'ready' | 'missing-phone' | 'missing-email'`.
- No backend, schema, or business-logic changes. Send flow, eligibility rules, and `followup_log` insert stay identical.
- Uses existing semantic tokens (`text-emerald-700`, `text-rose-700`, `text-muted-foreground`, `bg-muted/30`, `border-primary/30`) — no new colors.
