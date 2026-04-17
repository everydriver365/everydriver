
## Goal
Build out all 5 WhatsApp Business enhancements on top of the existing integration.

## 1. Verify it's live (health check)
- New edge function `whatsapp-health-check`: pings Meta `/v18.0/{PHONE_ID}?fields=verified_name,quality_rating` with the stored token, returns token validity, days until expiry, webhook subscription status, and quality rating.
- New admin tile in Instructor Settings → Integrations → "WhatsApp Business" showing: ✅/❌ status, business display name, quality rating, token expiry warning if <14 days.

## 2. Per-instructor numbers (Embedded Signup)
- DB migration: new table `instructor_whatsapp_accounts` (instructor_id PK, waba_id, phone_number_id, display_phone, access_token encrypted, verified_name, quality_rating, connected_at, status).
- New edge function `whatsapp-embedded-signup-callback`: exchanges Meta's auth code → long-lived System User token via Graph API, stores per-instructor token.
- New page `/instructor/settings/whatsapp` with Meta JS SDK Embedded Signup button (`FB.login` + `extras: { feature: 'whatsapp_embedded_signup' }`).
- Update `send-whatsapp` and `whatsapp-webhook` to look up the per-instructor token first, falling back to the global `WHATSAPP_BUSINESS_TOKEN` for instructors who haven't connected.
- Webhook routing: identify which instructor owns the inbound message by matching `phone_number_id` → `instructor_whatsapp_accounts`.

## 3. Message templates
- DB migration: `whatsapp_templates` (id, instructor_id, meta_template_id, name, category [marketing|utility|authentication], language, body_text, variables jsonb, status [pending|approved|rejected], created_at).
- New edge function `whatsapp-templates`:
  - `GET /list` — fetch from Meta `/v18.0/{WABA_ID}/message_templates`
  - `POST /create` — submit new template to Meta for approval
  - `POST /send` — send a template message to a number (uses `type: "template"` payload)
- New UI under `/instructor/settings/whatsapp/templates`: list templates with status badges, create-template form (name, category, body with `{{1}}` placeholders), "Send template" picker that appears in `LessonTextSheet` when conversation is outside the 24-hr window.
- Hook `useWhatsAppTemplates` for fetching + sending.

## 4. Media messages
- Extend `send-whatsapp`: accept `media: { type: 'image'|'document'|'audio', url, caption? }`, build Meta payload `{ type: 'image', image: { link, caption } }`.
- DB migration: add `media_url`, `media_type`, `media_mime` columns to `whatsapp_messages`.
- Update `whatsapp-webhook` to download inbound media via Meta `/v18.0/{MEDIA_ID}` → upload to existing `chat-attachments` storage bucket → store public URL on the message row.
- UI: add paperclip button to `WhatsAppChat` composer (image/doc/voice picker), render inline previews for image/audio/PDF in the message list.

## 5. Pupil-facing WhatsApp
- DB migration: add `pupil_id` (nullable) to `whatsapp_conversations` so pupil chats are linked to the pupil record.
- Reminders: extend the existing scheduled reminders job to send via WhatsApp first (using approved utility template `lesson_reminder_24h`) and fall back to SMS if the pupil hasn't opted in / no WABA template approved.
- Payment links: in `LessonTextSheet` and pupil profile, add "Send payment link via WhatsApp" — generates the existing GoCardless/Square link and sends with template `payment_request`.
- Lesson confirmations: after `lessons.insert`, the `calendar_sync_queue` worker also enqueues a WhatsApp confirmation using template `lesson_confirmation`.
- Pupil opt-in: add `whatsapp_opt_in` boolean to `pupils` table; surface a toggle in pupil settings + first-message auto-prompt.

## Files / functions
**New edge functions:** `whatsapp-health-check`, `whatsapp-embedded-signup-callback`, `whatsapp-templates`
**Modified edge functions:** `send-whatsapp`, `whatsapp-webhook`
**New tables:** `instructor_whatsapp_accounts`, `whatsapp_templates`
**Schema changes:** `whatsapp_messages` (+media cols), `whatsapp_conversations` (+pupil_id), `pupils` (+whatsapp_opt_in)
**New pages:** `/instructor/settings/whatsapp`, `/instructor/settings/whatsapp/templates`
**Modified UI:** `WhatsAppChat` (media composer), `LessonTextSheet` (template picker + payment link), pupil profile (opt-in toggle)

## Order of work
1. Health check (smallest, validates current setup) →
2. Templates (unlocks #5) →
3. Media messages →
4. Pupil-facing flows (reminders, payments, confirmations) →
5. Per-instructor Embedded Signup (largest; needs Meta App Review for `whatsapp_business_management` scope — flagged as a follow-up if the App isn't yet approved).

## One thing to confirm
Per-instructor Embedded Signup (#2) requires your Meta App to have **Advanced Access** for `whatsapp_business_management` and `whatsapp_business_messaging`. If your app is still in Development Mode, instructors won't be able to connect their own numbers until you submit for App Review. I'll build the flow regardless — it just won't go live for end users until Meta approves.
