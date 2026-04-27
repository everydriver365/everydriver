# Instructor Notifications — Volume Controls & Quick Actions

Five additive changes that retain every current behaviour on `/instructor/notifications` and slot into the existing premium tile design system. No redesign of the Notifications page itself — only new controls layered on, plus a new preferences card in Settings.

---

## 1. Notification preferences in Settings

A new "Notifications" tile inside the existing Settings flow (`InstructorSettings.tsx` / `InstructorSettingsCategory.tsx`), routed via the same `?open=notifications` deep-link pattern already used for terms.

Controls (all per-instructor):
- **Delivery cadence** — segmented control: `Real-time` · `Hourly digest` · `Daily digest` · `Important only`
- **Channel toggles** — Push · Email · SMS (re-using existing `instructor_reminder_preferences` row, surfaced together so instructors see one unified panel)
- **Quiet hours** — start/end time pickers (defaults 22:00–07:00, 24h format)
- **Per-category mute** — Test swaps · Messages · Job offers · System (white card with hairline rows, switch on the right)

`Important only` is defined as: payment failures, cancellations within 24h, manual admin alerts, and pupil no-shows. Everything else is suppressed (still stored, surfaced in the in-app inbox, just no push/email).

## 2. Source-side notification rules

Rules evaluated in the trigger paths that currently insert into `instructor_notifications`. Reduces volume at insert time, not just visually.

Initial ruleset (all editable from the same Settings tile, under "Smart filters"):
- **Test slots horizon** — switch + slider: only notify for slots within `N` weeks (default 6, range 1–12). Beyond that, the slot still appears in Test Requests, no inbox row created.
- **Test slots distance** — switch + slider: only notify for centres within `N` miles of home postcode (default 25, range 5–60). Uses imperial per project memory.
- **Job offers minimum value** — switch + currency input: suppress offers below £X (default off).
- **Mute repeat sender** — switch: collapse repeated messages from same pupil within 1h into a single notification (the inbox already groups visually; this skips the duplicate insert).

Stored as JSONB `notification_rules` on a new `instructor_notification_settings` row. Edge functions / DB functions that create notifications read this row and short-circuit before insert.

## 3. Snooze individual notifications

Adds a `snoozed_until timestamptz` column on `instructor_notifications`. Snoozed rows are filtered out of the inbox until the time passes, then re-surface as unread.

UI:
- Snooze appears in the long-press menu (see #5) and as a swipe action on each row.
- Snooze options: `1 hour`, `Until tonight (18:00)`, `Tomorrow morning (08:00)`, `Next week`.
- Snoozed rows hidden from the main list; a small `Snoozed (n)` chip appears at the top of the list when any exist — tap to view a filtered snoozed-only view with an "Unsnooze" action.

The `useInstructorNotifications` hook gains `snoozeNotification(id, until)` and `unsnoozeNotification(id)`, both writing directly to the row (existing UPDATE RLS policy already covers it).

## 4. Category filter within the list

Replace the current 2-segment `All / Unread` control with a horizontal scroll row of pills:

`All` · `Unread · n` · `Test swaps` · `Messages` · `Job offers` · `System`

Behaviour:
- Single-select. State held locally in the page.
- Counts only shown on `Unread` (matches current pattern).
- Selecting a category filters `notifications` by `categoryFor(n.type)` before grouping. Grouping logic untouched.
- "Mark all read" link continues to apply only to currently-visible rows (so it respects the filter).

## 5. Long-press quick actions

Long-press (500ms) on any row opens a bottom sheet (`vaul` Drawer, matching existing pupil portal pattern) with:

- **Mark as read / Mark as unread** (toggles based on current state)
- **Snooze** → opens the same snooze options from #3
- **Mute this type** → quick-link into the per-category toggle in Settings

Implementation:
- New `useLongPress` hook (timer-based, cancels on move/scroll) attached to each row's wrapper.
- Tap (short press) keeps existing navigate-and-mark behaviour.
- Sheet is a single component reused for single rows and grouped rows (group actions apply to all items in the group).
- Haptic tap on long-press fire (using existing `@/lib/haptics`).

---

## Technical details

### Database (migration)

```sql
-- 1. Notification settings (cadence + smart filters)
create table public.instructor_notification_settings (
  instructor_id uuid primary key references public.instructors(id) on delete cascade,
  delivery_cadence text not null default 'real_time'
    check (delivery_cadence in ('real_time','hourly','daily','important_only')),
  quiet_hours_start time default '22:00',
  quiet_hours_end   time default '07:00',
  category_mutes jsonb not null default '{}'::jsonb,  -- { test_swap: true, message: false, ... }
  notification_rules jsonb not null default '{}'::jsonb, -- horizon_weeks, distance_miles, job_min_value, dedupe_repeat
  updated_at timestamptz not null default now()
);

alter table public.instructor_notification_settings enable row level security;

create policy "self select" on public.instructor_notification_settings
  for select using (instructor_id = public.get_instructor_id_for_user(auth.uid()));
create policy "self upsert" on public.instructor_notification_settings
  for insert with check (instructor_id = public.get_instructor_id_for_user(auth.uid()));
create policy "self update" on public.instructor_notification_settings
  for update using (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- 2. Snooze column
alter table public.instructor_notifications
  add column snoozed_until timestamptz;
create index idx_instructor_notifications_snoozed
  on public.instructor_notifications (instructor_id, snoozed_until)
  where snoozed_until is not null;
```

### Hook changes (`useInstructorNotifications.ts`)

- Filter out `snoozed_until > now()` from the returned list (kept in DB, just not surfaced).
- Add `snoozeNotification(id, until)` and `unsnoozeNotification(id)` helpers.
- Add `snoozedCount` for the chip.

### Settings entry (`InstructorMenu.tsx` / Settings tile list)

Reuses the existing `?open=…` deep-link pattern (same as `?open=terms`). Add a `Notifications` tile in the Account / Preferences section; route id `notifications`.

### New components

- `src/components/instructor/notifications/NotificationPreferencesPanel.tsx` — the Settings card (cadence + channels + quiet hours + per-category mutes + smart filters)
- `src/components/instructor/notifications/SnoozeSheet.tsx` — drawer with the 4 snooze options
- `src/components/instructor/notifications/RowActionSheet.tsx` — long-press bottom sheet
- `src/hooks/useLongPress.ts` — generic long-press detector

### Source-side rule enforcement

Three insertion paths to update (search shows these are the producers):
- `supabase/functions/test-swap-matcher/` — apply horizon + distance rules
- `supabase/functions/job-offer-notify/` (or equivalent) — apply min-value rule
- Wherever messages create notifications — apply repeat-sender rule

Each loads the instructor's `notification_rules` row once per invocation and short-circuits the insert when a rule matches. `delivery_cadence = 'important_only'` is also honoured here (only allow inserts of types in the important-only allowlist; for digest modes notifications are still stored but a `notify_channel` field is set so push/email functions can decide whether to fan out — push/email batching is out of scope for this prompt).

### Page changes (`InstructorNotifications.tsx`)

- Replace the 2-pill `SegFilter` with a scrollable category pill row.
- Insert `Snoozed (n)` chip when applicable.
- Wrap row `<button>` with long-press handler; preserve existing `onClick` for short tap.
- No visual restyling of existing rows, hero, categories card, or grouping.

---

## Out of scope

- Push/email batching engines for `Hourly` / `Daily` digests — this prompt adds the preference + storage; the actual digest send job is a follow-up.
- Restyling the Notifications page (already redesigned in the previous prompt).
- Pupil-side notification preferences.
- Server-side undo for snooze beyond `unsnoozeNotification`.
