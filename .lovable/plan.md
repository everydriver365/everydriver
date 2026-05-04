## Goal

Turn the Famulor integration into a true **multi-channel AI assistant per instructor**, covering:

1. **Phone — Inbound** (AI receptionist)
2. **Phone — Outbound** (reminders, win-back, follow-ups)
3. **WhatsApp** (AI replies + book lessons)
4. **Web Chat** (AI on the instructor's mini-website + portal widget)

Each channel has its own **independent toggle per instructor**. The AI is **scoped to that instructor only** — it knows their pupils, prices, schedule, and books only into their calendar. **Admins can see and manage everything across all instructors.**

Bookings the AI proposes go in as **pending requests** the instructor approves with one tap (safer default — can be changed per-instructor later).

## What you'll see

### Instructor → Famulor Hub → **Channels** tab (new)

A card per channel, each with its own toggle and "Test" button:

```text
┌─────────────────────────────────────────────────┐
│ 📞 Phone — Inbound          [● Live]   [ ON ]  │
│    Forward your line to: +44 20 …               │
│    Agent: Reception · Voice: UK English         │
│    [Test call]  [Edit agent in Famulor ↗]       │
├─────────────────────────────────────────────────┤
│ 📲 Phone — Outbound         [● Live]   [ ON ]  │
│    Reminders, win-back, follow-ups              │
│    [Send test call to me]                       │
├─────────────────────────────────────────────────┤
│ 💬 WhatsApp                 [✓ Ready]  [ ON ]  │
│    Replies via your WhatsApp Business number    │
│    [Send test message to me]                    │
├─────────────────────────────────────────────────┤
│ 🌐 Web Chat                 [✓ Ready]  [ ON ]  │
│    On your mini-website and portal              │
│    Embed snippet: <script…>  [Copy]             │
│    [Open chat preview]                          │
└─────────────────────────────────────────────────┘
```

Each toggle calls Famulor immediately to activate/deactivate that channel's agent and persists the result. A pill shows live state per channel (Live / Paused / Check setup / Not connected).

### Instructor → **Conversations** tab (renamed from Calls)

Unified inbox across all four channels, filterable by channel, direction, status, purpose. Each row shows the channel icon, summary, and outcome. Tap to open the existing transcript drawer.

### Instructor → **Bookings from AI** (new small section on Overview)

Pending booking requests the AI captured with one-tap **Approve** / **Decline** / **Counter-offer**. Approving creates the lesson and notifies the pupil; declining sends a polite "we'll get back to you" message.

### Admin → Famulor Hub

Already shows per-instructor data. Adds:
- **Channels matrix** — table of every instructor × four channels with status pills, so admin can see at a glance who has what live.
- Filter Conversations by **instructor** and **channel**.
- **Force-disable** any channel for an instructor (compliance / abuse).
- Per-instructor cost rollups by channel.

### School owner

Same matrix view scoped to their own instructors (read-only, can't force-disable).

## Booking authority

All AI-created bookings land as `status = 'pending_ai'` in the existing `scheduled_lessons` table (or a new `ai_booking_requests` table — see Technical). Instructor approves/declines from the new Bookings-from-AI section or via push notification. **Auto-confirm is off by default**, exposed as a per-instructor switch in Settings for those who want it later.

## Google Calendar role

We already have bi-directional Google Calendar sync per instructor. The Famulor agent will read available slots through our existing `instructor_availability` + `scheduled_lessons` data (already kept in sync with Google Calendar), so the AI never double-books. No new Google integration needed — we reuse what's there.

## Technical changes

### Database (one migration)

Extend `famulor_settings` with per-channel toggles + IDs:

```sql
ALTER TABLE public.famulor_settings
  ADD COLUMN phone_inbound_enabled  boolean NOT NULL DEFAULT false,
  ADD COLUMN phone_outbound_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN whatsapp_enabled       boolean NOT NULL DEFAULT false,
  ADD COLUMN webchat_enabled        boolean NOT NULL DEFAULT false,
  ADD COLUMN whatsapp_agent_id      text,
  ADD COLUMN webchat_agent_id       text,
  ADD COLUMN webchat_widget_token   text,            -- public token for embed
  ADD COLUMN auto_confirm_bookings  boolean NOT NULL DEFAULT false,
  ADD COLUMN per_channel_status     jsonb  NOT NULL DEFAULT '{}'::jsonb;
  -- per_channel_status: { phone_in:{state,message,verified_at}, phone_out:{…}, whatsapp:{…}, webchat:{…} }
```

Backfill: copy existing `inbound_answering_enabled` → `phone_inbound_enabled`, and `enabled` (used as outbound master) → `phone_outbound_enabled` for instructors who already have an outbound agent. Keep old columns for now (deprecate later).

New table for AI-captured bookings awaiting instructor approval:

```sql
CREATE TABLE public.ai_booking_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
  source_channel text NOT NULL CHECK (source_channel IN ('phone_in','phone_out','whatsapp','webchat')),
  source_call_log_id uuid REFERENCES famulor_call_logs(id),
  pupil_id uuid REFERENCES pupils(id),     -- nullable: new lead
  contact_name text, contact_phone text, contact_email text,
  requested_start timestamptz NOT NULL,
  duration_minutes int NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'pending'   -- pending | approved | declined | expired | countered
    CHECK (status IN ('pending','approved','declined','expired','countered')),
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  resulting_lesson_id uuid REFERENCES scheduled_lessons(id)
);
```

RLS:
- Instructor: full CRUD on own rows via `get_instructor_id_for_user(auth.uid())`.
- Admin: SELECT/UPDATE all (`has_role(auth.uid(),'admin')`).
- School owner: SELECT for instructors in their school.

`famulor_call_logs` already supports per-channel via a small extension:
```sql
ALTER TABLE public.famulor_call_logs
  ADD COLUMN channel text NOT NULL DEFAULT 'phone'
    CHECK (channel IN ('phone','whatsapp','webchat'));
```
(`direction` stays inbound/outbound for phone & whatsapp; webchat is always inbound.)

### Edge functions

Replace the single `famulor-toggle-inbound` with one generic toggler, plus channel-specific handlers:

- **`famulor-channel-toggle`** — `{ channel: 'phone_in'|'phone_out'|'whatsapp'|'webchat', enabled: boolean }`. Resolves instructor from JWT, picks the right Famulor agent ID, calls Famulor API to activate/deactivate that agent, persists `<channel>_enabled` and updates `per_channel_status[channel]`. Returns the new state + any upstream message.
- **`famulor-verify-channel`** — `{ channel }`. Verifies API key + agent existence + phone/number/widget binding for that channel; writes outcome to `per_channel_status[channel]` and returns it.
- **`famulor-whatsapp-webhook`** — receives Famulor → WhatsApp events, logs into `famulor_call_logs` with `channel='whatsapp'`, creates `ai_booking_requests` when the agent captures a booking intent.
- **`famulor-webchat-webhook`** — same shape for web chat events.
- **`famulor-tools`** (single endpoint Famulor calls during a conversation) — exposes scoped tool functions:
  - `get_available_slots(instructor_id, date_range)` — reads `instructor_availability` + `scheduled_lessons` (already Google-Calendar-synced).
  - `get_pupil_by_phone(instructor_id, phone)` — looks up existing pupil (privacy-scoped).
  - `get_prices(instructor_id)` — pulls from instructor's pricing config.
  - `create_booking_request(instructor_id, …)` — inserts into `ai_booking_requests`, fires push notification.
  All tool calls verify a per-instructor signing secret (already have `FAMULOR_WEBHOOK_SECRET`) and the `instructor_id` in the payload matches the agent that called.
- **`famulor-booking-decision`** — `{ request_id, action: 'approve'|'decline'|'counter', counter_start? }`. Approve → inserts `scheduled_lessons` (uses existing clash trigger), notifies pupil via WhatsApp/SMS. Decline → sends decline message. Counter → sends alternative slot.

### UI components

- **New `FamulorChannelsTab.tsx`** — channel cards with toggles. Each card uses the new `famulor-channel-toggle` function with optimistic update + rollback (same pattern as today's `toggleAnswering`). Wire into `FamulorHub` tabs list **for instructor + admin + school scopes**.
- **Refactor `FamulorSettingsCard.tsx`** — keep agent IDs, voice, automations, smart follow-ups; remove the duplicated "AI answers inbound calls" toggle (now lives on Channels tab). Add fields for `whatsapp_agent_id`, `webchat_agent_id`, plus a "Generate web chat embed" button that creates `webchat_widget_token`.
- **New `AIBookingRequestsCard.tsx`** — Approve/Decline/Counter list, drops onto Instructor Overview and on the Famulor Hub Overview tab.
- **Rename `FamulorCallsTab` → `FamulorConversationsTab`** — adds channel filter chip; row icon switches by `channel`.
- **New `FamulorChannelsMatrix.tsx`** — admin/school table view (instructor × 4 channels with status pills + force-disable for admin).
- **Web chat widget** — small standalone script served from an edge function (`famulor-webchat-script`) that renders an iframe pointed at Famulor's web chat session API, keyed by `webchat_widget_token`. Auto-embedded on the instructor's mini-website when `webchat_enabled`.

### Notifications

Reuse existing instructor push notification system to alert on:
- New `ai_booking_requests` row (with quick-action approve/decline)
- A channel auto-disabled by Famulor (e.g. agent removed)

### Files

**New**
- `supabase/migrations/<ts>_famulor_multichannel.sql`
- `supabase/functions/famulor-channel-toggle/index.ts`
- `supabase/functions/famulor-verify-channel/index.ts`
- `supabase/functions/famulor-whatsapp-webhook/index.ts`
- `supabase/functions/famulor-webchat-webhook/index.ts`
- `supabase/functions/famulor-tools/index.ts`
- `supabase/functions/famulor-booking-decision/index.ts`
- `supabase/functions/famulor-webchat-script/index.ts`
- `src/components/famulor/tabs/FamulorChannelsTab.tsx`
- `src/components/famulor/AIBookingRequestsCard.tsx`
- `src/components/famulor/FamulorChannelsMatrix.tsx`
- `src/hooks/useFamulorChannels.ts`
- `src/hooks/useAIBookingRequests.ts`

**Edited**
- `src/components/famulor/FamulorHub.tsx` — add Channels tab for all scopes; rename Calls → Conversations.
- `src/components/famulor/tabs/FamulorCallsTab.tsx` → renamed `FamulorConversationsTab.tsx`, channel filter added.
- `src/components/instructor/integrations/FamulorSettingsCard.tsx` — drop duplicated inbound toggle, add WhatsApp/Web Chat agent fields + embed token generator + auto-confirm-bookings switch.
- `src/components/famulor/tabs/FamulorAgentsTab.tsx` — list all four agents.
- `src/integrations/supabase/types.ts` — auto-regenerated.

### Webhook configuration in Famulor

Inside each instructor's Famulor account we set the webhook URLs to our edge functions, signed with `FAMULOR_WEBHOOK_SECRET`. The app will display copy-paste setup instructions per channel.

## Out of scope (this iteration)

- Forwarding the carrier line to the inbound number (manual carrier step; we show instructions).
- Provisioning new Famulor numbers/agents from inside the app (still done in Famulor's dashboard for now).
- Cross-instructor handoff ("escalate to school admin") — possible later.
- Auto-confirm booking by default — opt-in per instructor.
