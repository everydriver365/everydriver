# Famulor AI Voice Integration

Add Famulor as the AI voice layer powering three flows: inbound receptionist, outbound lesson reminders, and dormant pupil win-back. Configurable globally in Settings → Integrations and triggerable per-pupil from the pupil card.

## 1. Database

New migration adds:

- `famulor_settings` (one row per instructor)
  - `instructor_id`, `enabled`, `inbound_agent_id`, `outbound_agent_id`, `inbound_phone_number`, `voice_id`, `business_hours_only`, `auto_book_enabled`, `reminder_hours_before` (default 24), `dormant_days_threshold` (default 60)
- `famulor_call_logs`
  - `id`, `instructor_id`, `pupil_id` (nullable for unknown inbound), `lead_id` (nullable), `direction` (`inbound`/`outbound`), `purpose` (`receptionist`/`reminder`/`win_back`), `famulor_call_id`, `phone_number`, `status` (`queued`/`in_progress`/`completed`/`failed`/`no_answer`), `duration_seconds`, `transcript` (jsonb), `summary` (text), `outcome` (text — e.g. `confirmed`, `cancelled`, `booked`, `not_interested`), `recording_url`, `created_at`, `ended_at`
- RLS on both using `public.get_instructor_id_for_user(auth.uid())`
- Index on `(instructor_id, created_at desc)` and `(famulor_call_id)`

## 2. Secrets

Request `FAMULOR_API_KEY` and `FAMULOR_WEBHOOK_SECRET` (HMAC verification) via the secret tool once the plan is approved.

## 3. Edge functions

All under `supabase/functions/`, each with CORS + Zod input validation + JWT verification (except the webhook which uses HMAC):

- **`famulor-trigger-call`** — Authed. Body `{ pupil_id, purpose }`. Looks up the pupil, builds context (name, next lesson date/time, balance, instructor name), calls Famulor REST `POST /calls` with the right agent + dynamic variables, inserts a `famulor_call_logs` row.
- **`famulor-webhook`** — Public, HMAC-verified using `FAMULOR_WEBHOOK_SECRET`. Handles `call.completed` events: updates `famulor_call_logs` with transcript / summary / outcome, and depending on purpose:
  - `reminder` + outcome `cancelled` → calls existing cancel-lesson logic
  - `receptionist` + outcome `booked` → creates a `lead_inbox` row (and a draft `pupils` row if confident) using existing clash check
  - `win_back` → just logs
- **`famulor-cron-reminders`** — Scheduled via `pg_cron` hourly. Finds lessons starting in `reminder_hours_before ± 30 min` for instructors with `enabled = true` and reminders on, then invokes `famulor-trigger-call` for each.
- **`famulor-cron-dormant`** — Scheduled daily 10:00 UK. Finds pupils with no lesson in `dormant_days_threshold` days, instructor opted in, and queues win-back calls (rate-limited to N per day per instructor).

## 4. UI

### Settings → Integrations → "AI Voice Agent (Famulor)" card
- Enable toggle
- Inbound agent ID + assigned phone number (read-only display once Famulor returns it)
- Outbound agent ID
- Voice picker (fetched from Famulor `/voices`)
- Toggles: Lesson reminders, Dormant win-back, Auto-book inbound leads
- Numeric: reminder hours before, dormant threshold days
- "Send test call to my number" button → calls `famulor-trigger-call` with `purpose=test`
- Recent calls table (last 20 from `famulor_call_logs` with summary + outcome chip)

### Per-pupil action
- New menu item on pupil card / dormant list: **"AI call this pupil"** → opens a small confirm sheet (purpose: reminder / win-back / custom note) → invokes `famulor-trigger-call`. Disabled if Famulor not enabled.

### Call log drawer
- Click any row in the recent calls table → side drawer with full transcript, recording playback, and outcome.

## 5. Files to create / edit

**New:**
- `supabase/migrations/<ts>_famulor.sql`
- `supabase/functions/famulor-trigger-call/index.ts`
- `supabase/functions/famulor-webhook/index.ts`
- `supabase/functions/famulor-cron-reminders/index.ts`
- `supabase/functions/famulor-cron-dormant/index.ts`
- `src/components/instructor/integrations/FamulorSettingsCard.tsx`
- `src/components/instructor/integrations/FamulorCallLogDrawer.tsx`
- `src/components/instructor/pupils/AiCallPupilSheet.tsx`
- `src/hooks/useFamulorSettings.ts`
- `src/lib/famulorClient.ts` (thin wrapper around `supabase.functions.invoke`)

**Edited:**
- `src/pages/instructor/Settings.tsx` (or equivalent integrations page) — mount `FamulorSettingsCard`
- Pupil card / dormant list component — add "AI call this pupil" action
- `mem://index.md` + new `mem://features/communication/famulor-voice-integration.md`

## 6. Open points (defaults unless you say otherwise)

- **Inbound number**: Famulor provisions a UK number per agent. Instructor forwards their existing line to it (we'll show forwarding instructions in the card). Not building number porting.
- **Cost guardrails**: hard-cap dormant calls at 20/instructor/day to prevent runaway spend.
- **Language/voice**: default to a UK English voice; instructor can override.

Once you approve, I'll request the two secrets, then build it end-to-end.