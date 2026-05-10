## Honest answer: is the Notifications panel wired up today?

**Mostly no.** Here's the current state of `instructor_notification_settings` (saved by `NotificationPreferencesPanel`):

| Setting | Saved to DB? | Actually respected? |
|---|---|---|
| Delivery cadence (real-time / hourly / daily / important only) | Yes | **No** — every sender (`send-push-notification`, `notify-instructor`, `process-lesson-reminders`, `eod-notification`, etc.) fires immediately regardless. |
| Quiet hours | Yes | **No** — only `famulor-webhook` checks a hard-coded UK quiet window; the per-instructor row is never read. |
| Category mutes (test_swap / message / job / system) | Yes | **No** — no sender filters by category. |
| Smart filters (test horizon weeks, test distance miles, min job value, dedupe repeat sender) | Yes | **No** — `useTestSwapNotifications` and job-offer flows never read these rules. |

A grep across `supabase/functions/**` for `instructor_notification_settings`, `category_mutes`, `delivery_cadence`, `notification_rules` returns **zero hits**. The toggles persist, but nothing on the server consumes them.

## What this plan does

1. **Make the existing toggles real** by adding a single shared gate that every push/notification sender runs through.
2. **Add two new options the user asked for**: End-of-Lesson reminder and Daily Summary digest.

### Step 1 — Shared `_shared/notify-gate.ts` helper

New file `supabase/functions/_shared/notify-gate.ts` exposes:

```text
shouldSendToInstructor(supabase, instructorId, {
  category: "test_swap" | "message" | "job" | "system" | "lesson",
  channel:  "push" | "email" | "sms",
  importance: "normal" | "important",
  pupilId?: string,    // for dedupe_repeat_sender
  jobValue?: number,   // for job_min_value
}) -> { allow: boolean, reason?: string, defer_until?: ISO }
```

Logic:
- Loads `instructor_notification_settings` once (cached per invocation).
- Returns `false` if `category_mutes[category]` is true.
- For `delivery_cadence = "important_only"` returns false unless `importance === "important"`.
- For `hourly` / `daily` returns `defer_until` so the caller can enqueue into a new `notification_outbox` table instead of sending now.
- Returns `false` (push only) when current UK time is inside `quiet_hours_start..quiet_hours_end` and `quiet_hours_enabled`. Inbox row is still written.
- Smart filter checks for `job` (min value) and `message` (dedupe repeat sender via 60-min lookup against `instructor_notifications`).

### Step 2 — Apply the gate in existing senders

Wrap the actual delivery call in:
- `send-push-notification`
- `notify-instructor`
- `process-lesson-reminders`
- `notify-ai-event`, `notify-booking-enquiry`, `notify-upsell-purchase`
- `famulor-cron-reminders` (replace its bespoke quiet-hours check)

The gate decides allow / drop / defer; nothing about the call sites changes otherwise.

### Step 3 — Hourly/daily digest worker

New edge function `process-notification-digest` (cron every 15 min) reads `notification_outbox` rows whose `deliver_at <= now()`, groups by instructor, and sends one push + one inbox row summarising them ("5 new updates: 2 messages, 3 job offers"). Enabled by `pg_cron` in a `supabase.insert` call.

### Step 4 — New options the user asked for

Add to `useInstructorNotificationSettings.ts` `NotificationRules`:

```text
end_of_lesson_enabled: boolean   // default true
end_of_lesson_lead_minutes: 0|2|5  // "at end" / "2 min before" / "5 min before"
daily_summary_enabled: boolean   // default true
daily_summary_time: "07:00" | "18:00" | custom HH:mm  // default 07:00
daily_summary_include: { tomorrow_lessons, payments_due, pupil_messages, job_offers, test_swaps }
```

Panel changes (`NotificationPreferencesPanel.tsx`) — add a new **"Reminders"** Section with:
- End-of-Lesson reminder switch + segmented "At end / 2 min / 5 min before"
- Daily summary switch + time picker + 5 include checkboxes

Wiring:
- **End-of-Lesson**: existing `useLessonEndAlert` hook already fires client-side. Add a server-side fallback: extend `process-lesson-reminders` with a "T-0" pass that sends an EOL push gated by `end_of_lesson_enabled` and offset by `end_of_lesson_lead_minutes`. Push payload deeplinks to "Mark lesson complete".
- **Daily summary**: new edge function `send-daily-summary` (cron every 15 min) finds instructors whose `daily_summary_time` matches the current quarter-hour and `daily_summary_enabled = true`, builds a digest using the include flags, and sends one push + one `instructor_notifications` row.

### Step 5 — Schema

One migration:
- Add columns `end_of_lesson_enabled`, `end_of_lesson_lead_minutes`, `daily_summary_enabled`, `daily_summary_time`, `daily_summary_include jsonb` to `instructor_notification_settings` (nullable with sane defaults so we don't have to touch existing rows).
- New table `notification_outbox` (id, instructor_id, category, payload jsonb, deliver_at, sent_at). RLS: instructors can read their own rows via `get_instructor_id_for_user(auth.uid())`; service role writes/deletes.

Two `supabase.insert` calls schedule the cron jobs for `process-notification-digest` and `send-daily-summary`.

### Step 6 — Verify

- Reload `/instructor/settings/comms#notification-prefs`, toggle each option, confirm the row updates in `instructor_notification_settings`.
- Manually invoke `send-push-notification` for a muted category → expect `{ allow: false, reason: "category_muted" }` in logs.
- Invoke `send-daily-summary` with a forced `now` query param → expect one push delivered.

## Out of scope

- No changes to mobile layouts.
- No changes to SMS/email channels beyond the shared gate accepting them as a parameter.
- No new design tokens — uses existing portal styles.

Approve and I'll implement.