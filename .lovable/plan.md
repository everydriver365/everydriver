## Goal

Make the Famulor settings card honest:
1. Add a real **"AI answers inbound calls"** master toggle that actually enables/disables the inbound agent on Famulor's side.
2. Add a **"Test connection"** button that verifies the API key, agent ID, and inbound number are valid, with a clear ✅/❌ result.

## What you'll see

On the Famulor settings card (Instructor → Famulor → Settings):

- A new prominent toggle at the top: **"AI answers inbound calls"** with subtitle *"When on, your Famulor agent will pick up calls forwarded to your inbound number."*
- A **"Test connection"** button next to the agent fields. Tapping it shows one of:
  - ✅ *"Connected. Agent 'Reception' is live on +44…"*
  - ❌ *"Inbound agent ID not found in your Famulor account."*
  - ❌ *"Famulor API key missing or invalid."*
  - ⚠️ *"Connected, but no inbound number is provisioned for this agent."*
- A small inline status pill ("Live" / "Paused" / "Not configured") so you can tell at a glance without pressing the button.

## Technical changes

**Database** (`famulor_settings`)
- Add `inbound_answering_enabled BOOLEAN DEFAULT false`
- Add `last_verified_at TIMESTAMPTZ`, `last_verified_status TEXT`, `last_verified_message TEXT` for the test result

**New edge function: `famulor-toggle-inbound`**
- Inputs: `{ enabled: boolean }`
- Resolves instructor from JWT, reads their `inbound_agent_id`
- Calls Famulor API to enable/disable the agent (`PATCH /agents/{id}` with active flag — exact field confirmed against Famulor docs at build time)
- On success, persists `inbound_answering_enabled` to `famulor_settings`
- On failure, returns the upstream error so the UI can show why

**New edge function: `famulor-verify-connection`**
- No inputs (reads instructor's saved settings)
- Steps: (a) check `FAMULOR_API_KEY` exists, (b) `GET /agents/{inbound_agent_id}`, (c) confirm the inbound phone number is attached to that agent
- Writes the outcome to `last_verified_*` columns and returns `{ outcome, message, agent_name, phone_number }`

**UI: `FamulorSettingsCard.tsx`**
- New `ToggleRow` for `inbound_answering_enabled` — calls `famulor-toggle-inbound` instead of just writing to the DB. Optimistic update with revert + toast on failure.
- New "Test connection" button (secondary style, `--portal-radius-button`) that calls `famulor-verify-connection`, shows a loading spinner, then renders the result inline.
- Status pill near the toggle reflecting `last_verified_status` (`live` → green, `paused` → grey, `failed` → red, `unknown` → neutral).

**Files**
- New: `supabase/functions/famulor-toggle-inbound/index.ts`
- New: `supabase/functions/famulor-verify-connection/index.ts`
- New: `supabase/migrations/<ts>_famulor_inbound_toggle.sql`
- Edited: `src/components/instructor/integrations/FamulorSettingsCard.tsx`
- Edited: `src/integrations/supabase/types.ts` (auto-regenerated)

## Out of scope

- Forwarding your business landline/mobile to the Famulor number — that's a carrier-side step (we'll surface copy-paste instructions in the card but can't automate it).
- Provisioning new Famulor numbers from inside this app (still done in Famulor's dashboard for now).
- Any changes to outbound calling, reminders, or the SMS/WhatsApp fallback already wired up.
