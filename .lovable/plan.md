# Add "Invite parent" button to pupil profile

Today, parents self-activate by going to `/parent` and entering their phone. There's no one-tap way for an instructor to send them the link. This adds an explicit Invite action.

## What you'll see

In **Edit pupil → Parent / guardian** section, when a `parent_phone` is saved:

- A new **"Invite parent"** button next to the parent phone field
- Tap it → sends an SMS to the parent's number with:
  > "Hi {parent_name or "there"}, {instructor business name} has invited you to track {pupil name}'s driving lessons. Open the parent portal: {portal_url}"
- Portal URL = the instructor's branded domain (or `https://everydriver.lovable.app`) + `/parent`
- Toast confirms "Invite sent to {phone}", or shows error if SMS fails
- Button is disabled when `parent_phone` is empty or `parent_portal_enabled = false`
- Shows "Last invited {relative time}" underneath after first send

## Technical details

**1. New edge function: `supabase/functions/invite-parent/index.ts`**
- Verifies caller JWT → resolves instructor via `get_instructor_id_for_user(auth.uid())`
- Body: `{ pupil_id }` (validated with Zod)
- Loads pupil, confirms pupil belongs to caller's instructor, and that `parent_phone` is set and `parent_portal_enabled !== false`
- Resolves portal URL from the instructor's `custom_domain` (if `custom_domain_verified`) else `https://everydriver.lovable.app`
- Sends SMS via existing Twilio env vars (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_MESSAGING_SERVICE_SID`) — same pattern as `notify-parent`
- Records `parent_invited_at` timestamp on the pupils row
- Returns `{ success, sent_to }`
- CORS + 400/403/500 error shapes consistent with other functions

**2. Migration**
- Add nullable column `pupils.parent_invited_at TIMESTAMPTZ`
- No RLS changes (write done by edge function with service role)

**3. UI: `src/components/instructor/EditPupilSheet.tsx`**
- Add small ghost button "Invite parent" inside the Parent section, right of the phone input
- Calls `supabase.functions.invoke("invite-parent", { body: { pupil_id } })`
- Loading state + toast on success/error
- If `parent_invited_at` is present, render muted "Last invited {relativeTime}" below the button

**4. No changes to** existing parent OTP flow, `/parent` route, or `send-parent-otp`. The invite is purely a discovery link — parent still OTPs in.

## Out of scope

- WhatsApp invite (can be added later as a second button using `useSendViaWhatsApp`)
- Bulk invite from pupils list
- Email invite fallback
- Tracking whether the parent has actually claimed the link

## Constraints respected

- RLS identity via `get_instructor_id_for_user(auth.uid())`
- Live data only — no fake "invited" state
- UK SMS only via existing Twilio config; no new secrets requested
- Mobile layout untouched (button added to existing Parent section, fits in both)
