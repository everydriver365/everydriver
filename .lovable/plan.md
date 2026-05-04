# Famulor follow-ups: AI-drafted messages + auto missed-call fallback

WhatsApp **is** fully wired (per-instructor Meta Business tokens, `send-whatsapp` with SMS fallback, templates, inbox). We'll layer two features on top of the existing Famulor webhook + call-log drawer.

---

## Feature 1 — AI-drafted follow-up message in the call drawer

When viewing a finished Famulor call, a **"Draft follow-up"** section appears. The instructor picks a tone + channel, an AI reads the transcript/summary and produces a message they can edit and one-tap send.

**UX (in `FamulorCallLogDrawer`)**
- New "Smart follow-up" panel below the existing Actions row, only shown when `status` is `completed`/`no_answer`/`failed` and a phone number exists.
- Channel toggle: WhatsApp (default if pupil phone is mobile) / SMS.
- Tone chips: Friendly, Professional, Booking nudge, Apology (no-answer), Custom.
- "Generate" button → calls new edge function → fills an editable textarea.
- "Send" button reuses existing `famulor-send-message` edge function (already deployed).
- "Regenerate" allowed; button disabled while AI is streaming.

**New edge function: `famulor-draft-followup`**
- Auth: instructor JWT, scoped to their own `famulor_call_logs` row.
- Input: `{ call_log_id, channel: "sms"|"whatsapp", tone }`.
- Loads the call log (transcript, summary, purpose, pupil name + instructor name).
- Calls Lovable AI Gateway (`google/gemini-3-flash-preview`) with a system prompt:
  - UK English, ≤320 chars for SMS, ≤600 chars for WhatsApp.
  - No emojis on SMS; subtle on WhatsApp.
  - Sign off as the instructor.
  - Never invent dates/prices — only reference what's in the transcript/summary.
- Returns `{ message }`. Surfaces 402/429 cleanly.

---

## Feature 2 — Auto fallback message on missed/failed outbound calls

When Famulor reports `no_answer` or `failed` for an **outbound** call to a pupil, automatically send a short SMS/WhatsApp ("Sorry we missed you — call back / book here").

**Where**: extend `supabase/functions/famulor-webhook/index.ts` (already receives status updates).

**Trigger conditions** (all must be true):
- `direction = outbound`
- New status is `no_answer` or `failed` (and previous status wasn't already that — idempotency).
- Instructor's `famulor_settings.auto_fallback_enabled = true` (new column, default `true`).
- Within UK quiet-hours window 08:00–20:00 (reuse same guard used by reminders campaign).
- We have a destination phone number on the row.

**What it sends**: instructor-customisable template stored on `famulor_settings.fallback_template` with placeholders `{name}`, `{instructor}`, `{booking_link}`. Default:
> "Hi {name}, sorry we just missed you on the phone. If you'd like to chat or book a lesson, reply here or book online: {booking_link}. Thanks, {instructor}."

**How**: webhook calls the existing `send-whatsapp` function (which already falls back to Twilio SMS if WhatsApp isn't connected). Result is stamped onto `famulor_call_logs.metadata.auto_fallback`.

**Idempotency**: skip if `metadata.auto_fallback` already set, or if the same pupil already received a fallback within the last 6 hours.

---

## Settings UI

Extend the existing `FamulorSettingsCard` (and the Famulor Hub → Settings tab):
- Toggle: "Auto-message on missed calls" (default ON).
- Channel preference: WhatsApp first / SMS only.
- Editable fallback template (textarea) with live placeholder preview.
- Toggle: "Show AI follow-up drafter in call drawer" (default ON).

---

## Technical details

**Database migration**
- `ALTER TABLE famulor_settings ADD COLUMN auto_fallback_enabled boolean DEFAULT true`
- `ALTER TABLE famulor_settings ADD COLUMN auto_fallback_channel text DEFAULT 'whatsapp_first'` (`'whatsapp_first' | 'sms_only'`)
- `ALTER TABLE famulor_settings ADD COLUMN fallback_template text` (nullable; falls back to default in code)
- `ALTER TABLE famulor_settings ADD COLUMN draft_followup_enabled boolean DEFAULT true`
- No new RLS policies needed (table already restricted by instructor).

**New edge function**
- `supabase/functions/famulor-draft-followup/index.ts`
  - JWT verification, ownership check on `call_log_id`.
  - Calls Lovable AI Gateway with the transcript + summary + tone.
  - Non-streaming JSON response `{ message }` (small payload, no need for SSE).

**Modified edge function**
- `supabase/functions/famulor-webhook/index.ts`
  - After updating the call row, if conditions match, invoke `send-whatsapp` via internal HTTP (service role auth) using the instructor's auth context isn't available — so we'll fetch the instructor's WhatsApp account directly (same pattern as `dormant-pupil-reengage`) and call `send-whatsapp` server-to-server, then write `metadata.auto_fallback`.

**Frontend files**
- `src/components/famulor/FamulorCallLogDrawer.tsx` — add "Smart follow-up" panel + AI draft hook.
- `src/components/famulor/tabs/FamulorOverviewTab.tsx` — small KPI tile "Auto-fallbacks sent (7d)" (reads from `metadata` in `famulor_call_logs`).
- `src/components/instructor/integrations/FamulorSettingsCard.tsx` — new toggles + template editor.
- `src/hooks/useFamulorDraftFollowup.ts` — calls the new edge function.

**Design**
- Reuse `--portal-*` tokens, `rounded-[12px]` for cards, accent `#1A52A0`.
- Tone chips use existing `Badge` styles; channel toggle = small segmented control.

---

## Out of scope (will not build now)
- AI-drafted bulk follow-ups across many calls.
- Inbound-call auto-replies (separate feature; needs more careful WhatsApp template approval).
- Multi-language drafting (UK English only for now).