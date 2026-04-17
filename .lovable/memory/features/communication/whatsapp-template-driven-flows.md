---
name: WhatsApp template-driven flows
description: Reminders & lesson confirmations send via approved WhatsApp templates first, fall back to SMS
type: feature
---
Reminders (`process-lesson-reminders`) and lesson confirmations (`process-calendar-queue` on first sync) attempt a WhatsApp template send via `_shared/whatsapp-template.ts` when the pupil has `whatsapp_opt_in = true` and `phone` set. If the template is unapproved, no credentials are configured, or the send fails, they fall back to existing Twilio SMS.

Templates required (must be approved in Meta):
- `lesson_reminder_24h` — vars: name, date, time, instructor
- `lesson_reminder_1h` — vars: name, time
- `lesson_confirmation` — vars: name, date, time, pickup

Idempotency: `pupils.whatsapp_confirmed_at` blocks re-sending the confirmation template after the first lesson is created.
