## Goal
Let an instructor have a dedicated **landline number** (01/02/03 UK number) that intelligently routes incoming calls to either the AI receptionist or their mobile, based on a schedule.

## How it works (per instructor)

A new "Phone number" page under **Teaching** with two parallel flows:

**Flow A — Provision a number on us (Twilio)**
- Pick UK area code → see 5 candidate numbers fetched from Twilio → buy with one tap.
- Backend assigns it, configures Twilio's voice webhook to point at our edge function.
- Number shown with monthly cost (e.g. "£2.50/mo billed with your subscription") and a "Release number" action.

**Flow B — Bring your own**
- Enter an existing landline + the mobile number it currently diverts to.
- We give them a **Twilio forwarding number to programme into their telco** as the divert target. Calls hit our number, we apply the routing rules, then forward.
- Display step-by-step instructions per major UK provider (BT/Sky/Virgin) as a collapsible help block.

**Routing rules (both flows)**
Three modes the user picks from, mirroring the existing `ai_call_divert_mode`:
- `ai` — always to AI receptionist (Famulor)
- `mobile` — always to their mobile (`instructors.phone`)
- `schedule` — AI during scheduled lessons + buffer, mobile otherwise (uses existing `ai_call_divert_buffer_before/after_minutes`)

When the call comes in:
1. Edge function `voice-router` receives Twilio webhook.
2. Looks up `instructor_phone_numbers` row by the dialled number.
3. Reads `routing_mode`. For `schedule`, queries `scheduled_lessons` for an active/imminent lesson with buffers applied.
4. Returns TwiML: either `<Dial>` to mobile or `<Redirect>` to Famulor's inbound URL.

## Database

New table `instructor_phone_numbers`:
- `instructor_id` (FK)
- `phone_number` (E.164, unique)
- `provider` enum: `twilio_provisioned` | `byo_forwarded`
- `twilio_sid` (nullable — only for provisioned)
- `routing_mode` enum: `ai` | `mobile` | `schedule`
- `forward_to_mobile` (text — defaults to instructors.phone, overridable)
- `monthly_cost_pence` (int, nullable)
- `status` enum: `active` | `releasing` | `released`
- `created_at` / `updated_at`

RLS: instructor can read/update their own row via `get_instructor_id_for_user(auth.uid())`. Service-role only for delete/insert from edge functions.

## Edge functions

1. `phone-number-search` — POST `{ areaCode }` → returns 5 available Twilio numbers.
2. `phone-number-provision` — POST `{ phoneNumber }` → buys it, sets voice webhook, inserts row.
3. `phone-number-release` — POST `{ id }` → releases on Twilio, marks row `released`.
4. `voice-router` — public Twilio webhook → returns TwiML based on routing rules.

All four use the existing `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` secrets via the connector gateway pattern. SMS Pumping Protection / Geo Permissions reminder shown to the project owner once.

## UI

**New page** `src/components/instructor/settings/pages/PhoneNumberPage.tsx`
Sections (sv2-card style, matching the rest of the V2 settings):
1. **Your number** — shows current number or "Get a number" empty state with two buttons (Provision / Bring your own).
2. **Routing** — three radio cards: AI / Mobile / Schedule-based. Auto-saves on change with toast.
3. **Forward to** — editable mobile number, defaults to profile phone. Auto-saves.
4. **Help** — collapsible "How to set up forwarding" per provider (BYO flow only).
5. **Danger zone** — "Release this number" (provisioned only).

**Sidebar wiring** in `SettingsSidebar.tsx`:
- Add `{ id: "phone-number", label: "Phone number", icon: IconPhone }` under the **Teaching** group.

**Quick settings shortcut** in `QuickSettingsPage.tsx`:
- Add a row to the existing "Bookings & calls" card: "Landline routing" → currently shows mode (AI / Mobile / Schedule), tap navigates to the full page. Three-state segmented control inline so they can flip it without opening the page.

**Provisioning flow** uses an `AlertDialog` with the area-code input and the 5 returned numbers as selectable cards.

## Files

**New**
- `src/components/instructor/settings/pages/PhoneNumberPage.tsx`
- `src/components/instructor/PhoneNumberProvisionDialog.tsx`
- `src/components/instructor/PhoneNumberByoDialog.tsx`
- `src/hooks/useInstructorPhoneNumber.ts`
- `supabase/functions/phone-number-search/index.ts`
- `supabase/functions/phone-number-provision/index.ts`
- `supabase/functions/phone-number-release/index.ts`
- `supabase/functions/voice-router/index.ts`

**Edited**
- `src/components/instructor/settings/SettingsSidebar.tsx` — add Phone number entry
- `src/components/instructor/settings/SettingsLayoutV2.tsx` — register page
- `src/components/instructor/settings/pages/QuickSettingsPage.tsx` — landline routing row

## Out of scope
- Billing/charging the £2.50/mo through GoCardless (will need a follow-up task tied into existing subscription invoicing).
- Voicemail / call recording / call history UI (Famulor already covers AI calls; mobile-routed calls are just forwarded).
- SMS to the landline number.
- School-level shared numbers (instructor-only for v1).

## Notes
Once approved, I'll need to confirm the **per-number monthly markup** you want to charge instructors before billing wiring goes in (default Twilio cost is ~£1/mo, suggested £2.50/mo retail). For v1 we'll just track `monthly_cost_pence` in the DB and surface it in the UI without charging — billing can land in a follow-up.
