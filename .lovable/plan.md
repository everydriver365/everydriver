
# AI Voice (Famulor) Hub — Unified Dashboard Section

Today the only Famulor surface is a settings card buried in the instructor Menu. We'll promote it to a proper **Hub** that lives in three portals — Instructor, School, Admin — each scoped to what that role should see.

## What the Hub shows (tabs)

```text
┌─ AI Voice (Famulor) ────────────────────────────────────┐
│  Overview │ Calls │ Campaigns │ Agents │ Settings │ Logs │
└──────────────────────────────────────────────────────────┘
```

### 1. Overview (default tab)
KPI tiles + charts for the selected period (Today / 7d / 30d):
- Total calls (inbound vs outbound split)
- Answer rate %, avg call duration, avg cost (£)
- Outcomes: Confirmed / Cancelled / Booked / No-answer / Voicemail
- Calls by purpose: Reminder · Win-back · Receptionist · Manual
- Sparkline of calls/day and £ saved (vs. estimated SMS+admin time)
- "Live now" strip — any call currently in progress (polled every 5s)

### 2. Calls (the explorer)
Searchable, filterable table of `famulor_call_logs`:
- Filters: direction, purpose, status, date range, pupil, agent
- Row: pupil avatar + name, time, duration, outcome badge, cost
- Click row → side drawer (`FamulorCallLogDrawer`) with:
  - Full transcript (chat-style bubbles)
  - Audio player for `recording_url`
  - AI-generated summary
  - Linked lesson / lead / payment (deep-link buttons)
  - Re-trigger / mark-resolved actions

### 3. Campaigns (outbound automations)
One card per automation with on/off toggle, last-run, next-run, success rate:
- Lesson reminders (24h before) — threshold slider
- Dormant win-back (>N days inactive) — threshold + script preview
- Test-day pep call
- Failed-test follow-up
- Payment-due reminder
- "Run now" button for ad-hoc batch triggers (admin/school only)

### 4. Agents
List of configured Famulor agents (inbound + outbound) pulled from Famulor's API:
- Agent name, voice, language, phone number
- "Test call me" button (rings instructor's mobile with that agent)
- Edit prompt / introduction script in-app (saved to `famulor_settings`)

### 5. Settings
Existing `FamulorSettingsCard` content — agent IDs, thresholds, quiet-hours, consent defaults, recording disclosure toggle.

### 6. Logs (admin-only tab)
Raw webhook events + edge function invocations for debugging — read from `famulor_call_logs` + edge logs.

## Per-portal scoping

| Portal | Sees | Can do |
|---|---|---|
| **Instructor** | Own pupils' calls only | Toggle own campaigns, trigger manual calls, view transcripts |
| **School** | All instructors in the school | All instructor actions + per-instructor breakdown, school-wide campaigns |
| **Admin** | All schools/instructors platform-wide | Everything + Logs tab, cost monitoring, force-disable abusive accounts |

Scoping enforced via RLS using `get_instructor_id_for_user(auth.uid())` and `is_school_owner(school_id)`, plus `has_role(auth.uid(), 'admin')` for the admin tab.

## Files to create

- `src/components/famulor/FamulorHub.tsx` — tabbed shell, role-aware
- `src/components/famulor/tabs/FamulorOverviewTab.tsx` — KPI tiles + charts (recharts)
- `src/components/famulor/tabs/FamulorCallsTab.tsx` — table + filters
- `src/components/famulor/FamulorCallLogDrawer.tsx` — transcript + audio + actions
- `src/components/famulor/tabs/FamulorCampaignsTab.tsx`
- `src/components/famulor/tabs/FamulorAgentsTab.tsx`
- `src/components/famulor/tabs/FamulorLogsTab.tsx` (admin only)
- `src/hooks/useFamulorStats.ts` — aggregations from `famulor_call_logs`
- `src/hooks/useFamulorCalls.ts` — paginated/filtered list + realtime subscription

## Files to edit

- `src/pages/InstructorMenu.tsx` — replace `FamulorSettingsCard` case with `<FamulorHub scope="instructor" />` and rename tile to "AI Voice Hub"
- `src/pages/SchoolPortal.tsx` — add new menu item "AI Voice" → `<FamulorHub scope="school" schoolId={...} />`
- `src/pages/AdminPortal.tsx` — add admin nav entry → `<FamulorHub scope="admin" />`
- `src/components/instructor/InstructorBottomNav.tsx` (if applicable) — no mobile layout changes per memory rule; desktop nav only

## Backend additions

- New edge function `famulor-list-agents` — proxies Famulor REST `/agents` so the Agents tab can show what's available without exposing the API key.
- Realtime: `ALTER PUBLICATION supabase_realtime ADD TABLE public.famulor_call_logs;` so the Live strip and Calls table update instantly.
- Add columns to `famulor_call_logs` if missing: `cost_pence integer`, `agent_name text`, `from_number text`, `to_number text` (idempotent migration).
- New view `famulor_daily_stats` for fast Overview aggregations (calls, minutes, cost grouped by `date_trunc('day')` + `instructor_id`).

## Compliance guards (reflected in UI)

- Quiet-hours banner (20:00–08:00 UK) on Campaigns tab — outbound disabled.
- Consent badge on each pupil row in Calls tab (green = consented, amber = no record).
- 12-month auto-purge note shown on Logs tab.

## Memory I'll add after build

`mem://features/instructor/famulor-voice-hub` — describes the hub's tab structure, role scoping, and that the Overview KPI period defaults to 7d.

## Out of scope (will offer as follow-ups)

- Speed-to-lead auto-callback on new website leads
- Live transfer / warm hand-off to instructor mobile
- Multi-language voice picker per pupil
- Parent-update post-lesson auto-calls

## Approve to proceed?

Once you approve, I'll build it in this order: migration + realtime → Hub shell + routing in all 3 portals → Overview → Calls + Drawer → Campaigns → Agents → Logs → memory update.
