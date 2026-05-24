## What's wrong today

**1. The discount never appears in the SMS to pupils.**
`GapsFiller` always sends a `customMessage` to the `send-gap-sms` edge function. The function only appends the "🎉 SPECIAL OFFER…" line when `customMessage` is empty (`supabase/functions/send-gap-sms/index.ts` line 158). Because `GapsFiller` always supplies a rendered template, the discount line is silently dropped.

On top of that, the template editor (`MessageTemplateEditor.tsx`) exposes only `{first_name}`, `{slot_list}`, `{instructor_first_name}` — there is no `{discount}` token, so even an instructor who wants the discount in the message can't put it there. The in-sheet preview also doesn't reflect it.

**2. Grab a Gap is a different pipeline and is NOT wired to the discount.**
- SMS gap offers write to `gap_offers` (has `discount_type` / `discount_value`). Pupil replies via Twilio webhook; booking note records the discount but the lesson price is not adjusted.
- The pupil-portal "Grab a Gap" UI (`SlotOfferNotification.tsx`) reads from a different table — `instructor_short_slots` — via the `claim_slot_offer` RPC. That table has no discount columns, and the offers it surfaces are not the ones created by `GapsFiller`. So a discount set in GapsFiller is invisible inside the pupil portal and never affects the claim price.

## Plan

### A. Show the discount in the gap-offer SMS

1. Add a `{discount}` token to `MessageTemplateEditor.tsx`:
   - Add to `TEMPLATE_TOKENS`.
   - Extend `renderTemplate(template, vars)` to substitute `{discount}` with a human string ("10% off if you book", "£5 off if you book"), or empty string when no discount selected.
   - Show the token chip in the editor toolbar.
2. Update `DEFAULT_TEMPLATE` in `GapsFiller.tsx` to include `{discount}` on its own line so new users get it for free; existing instructors keep their saved template, but can drop the token in.
3. Pass `discountType` / `discountValue` into `renderTemplate` from `GapsFiller`'s per-pupil send loop and from the `ConfirmSendSheet` preview so the preview matches the SMS.
4. In `send-gap-sms/index.ts`: when `customMessage` is provided AND a discount is set AND the message does not already mention the discount (simple `includes` check on the rendered phrase), append the same `discountText` so older saved templates without `{discount}` still show it. This preserves backward compatibility.

### B. Wire Grab a Gap to the same offers + discount

The two systems should share data. Decision needed (see questions below), but the cleanest path:

1. In `send-gap-sms`, after inserting a `gap_offers` row, also publish to whatever the pupil portal listens to. Two options:
   - **Option 1 (preferred):** Switch `SlotOfferNotification.tsx` and `claim_slot_offer` to read/claim from `gap_offers` directly (the source of truth that already has discount columns). Add `claimed_at`/`claimed_by` columns to `gap_offers` and rewrite the RPC.
   - **Option 2 (lighter):** Keep `instructor_short_slots` for the portal, add `discount_type` / `discount_value` columns to it, and have `send-gap-sms` mirror each gap offer into `instructor_short_slots`. Risk: dual sources of truth and race conditions on claim/SMS-YES.
2. Update `SlotOfferNotification.tsx` to render the discount badge ("10% off") on the offer card so pupils see the same incentive in-portal as in the SMS.
3. Update `claim_slot_offer` (and the Twilio reply handler) to actually apply the discount to the resulting lesson price — today both only write a note. The lesson price should be reduced by the percentage/amount at booking time.

### C. Verification

- Send a test gap offer with a 10% discount: the SMS preview, the SMS body, the gap_offers row, and the resulting booked lesson price all reflect the 10% off.
- Open the pupil portal as a recipient: the Grab a Gap card shows the same discount and claiming it produces a lesson with the discounted price.

## Questions before I build

1. For the Grab-a-Gap unification, do you want **Option 1** (consolidate on `gap_offers`, retire `instructor_short_slots`) or **Option 2** (mirror data, keep both)? Option 1 is the right long-term answer but touches the pupil portal claim flow.
2. Should the discount actually reduce the lesson price on booking (today it's only recorded as a note), or stay informational for now?
