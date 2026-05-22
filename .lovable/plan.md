## MTD deadline reminders — implementation plan

Mirror `send-deletion-reminders` pattern. Daily cron checks `mtd_quarterly_periods` for periods whose `deadline` falls exactly 30, 7, or 1 day from today (Europe/London), dedupes via a new table, and sends push via `notify-instructor`.

---

### PART 1 — Notification type constants

**`supabase/functions/_shared/notification-types.ts`** and **`src/lib/notificationTypes.ts`** (mirrored):
- Add `PushDataType.MTD_DEADLINE_REMINDER = "mtd_deadline_reminder"`.
- Add `NotifyCategory.MTD = "mtd"`.

**`supabase/functions/_shared/notify-gate.ts`**:
- Extend `NotifyCategory` union with `"mtd"`.

**`supabase/functions/notify-instructor/index.ts`**:
- Extend `NotifyRequest.type` with `"mtd_deadline_reminder"`.
- Add fields: `quarterLabel?: string`, `daysRemaining?: number`, `deadline?: string`, `periodId?: string`.
- Add `case "mtd_deadline_reminder"` in switch with tier-specific copy:
  - 30: "Your {quarterLabel} MTD return is due in 30 days ({deadline}). Start gathering your figures."
  - 7: "Your {quarterLabel} MTD return is due in 7 days. Don't leave it too late."
  - 1: "Your {quarterLabel} MTD return is due tomorrow. Submit now to avoid a penalty."
  - Title: "MTD filing deadline"
  - Push `data`: `{ type: "mtd_deadline_reminder", quarterLabel, daysRemaining, deadline, periodId, url: "/instructor-app/mtd/dashboard" }`
  - `tag: "mtd-deadline"` (per-tier suffix `mtd-deadline-{tier}` to allow stacking).
- Extend `categoryMap`: `mtd_deadline_reminder: "mtd"`.
- Importance: `important` when `daysRemaining <= 7`, else `normal`.

### PART 2 — Deduplication table (migration)

```sql
CREATE TABLE public.mtd_deadline_reminders_sent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id uuid NOT NULL REFERENCES public.mtd_quarterly_periods(id) ON DELETE CASCADE,
  tier int NOT NULL CHECK (tier IN (30, 7, 1)),
  sent_at timestamptz NOT NULL DEFAULT now(),
  sent_ok boolean NOT NULL,
  detail text,
  UNIQUE (period_id, tier)
);
CREATE INDEX ON public.mtd_deadline_reminders_sent (period_id);
ALTER TABLE public.mtd_deadline_reminders_sent ENABLE ROW LEVEL SECURITY;
```

RLS:
- Instructor SELECT own: `EXISTS (SELECT 1 FROM mtd_quarterly_periods p WHERE p.id = period_id AND p.instructor_id = public.get_instructor_id_for_user(auth.uid()))`.
- Admin SELECT all: `public.has_role(auth.uid(), 'admin')`.
- No INSERT/UPDATE/DELETE policies → service role only (bypasses RLS).

### PART 3 — Edge function `send-mtd-deadline-reminders`

`supabase/functions/send-mtd-deadline-reminders/index.ts`:
- CORS, OPTIONS handling.
- Service-role client.
- Compute `today` as `YYYY-MM-DD` in `Europe/London` via `Intl.DateTimeFormat`.
- Compute `horizon = today + 31 days` (string).
- Query `mtd_quarterly_periods` where `status = 'open'` AND `deadline > today` AND `deadline <= horizon`, select `id, instructor_id, tax_year, quarter, deadline`.
- For each period: `daysUntil = floor((Date(deadline) - Date(today)) / 86400000)`; skip if not in `{30, 7, 1}`.
- Pre-check `mtd_deadline_reminders_sent` for `(period_id, tier)` → skip if present.
- Build `quarterLabel = "Q{quarter} {taxYear}/{(taxYear+1)%100 padded}"`.
- Call `notify-instructor` via `supabase.functions.invoke` with type `mtd_deadline_reminder` (the gate inside notify-instructor handles the `category_mutes.mtd` check).
- Insert `mtd_deadline_reminders_sent` row with `sent_ok: true/false` + error detail.
- Use `Promise.allSettled` for parallelism.
- Return `{ processed, sent, skipped, today }`.

### PART 4 — Cron registration

Via **insert tool** (contains anon key, must not be a migration):
```sql
SELECT cron.unschedule('send-mtd-deadline-reminders-daily')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-mtd-deadline-reminders-daily');
SELECT cron.schedule(
  'send-mtd-deadline-reminders-daily',
  '0 9 * * *',
  $$ SELECT net.http_post(
       url := 'https://qyqeibovdhyohkfagujv.supabase.co/functions/v1/send-mtd-deadline-reminders',
       headers := '{"Content-Type":"application/json","apikey":"<anon>"}'::jsonb,
       body := '{}'::jsonb
     ); $$
);
```

### PART 5 — Instructor opt-out UI

**`src/hooks/useInstructorNotificationSettings.ts`**: extend `CategoryKey` union with `"mtd"`.

**`src/components/instructor/notifications/NotificationPreferencesPanel.tsx`**: append to the `CATEGORIES` array:
```ts
{ key: "mtd", label: "MTD filing reminders", subtitle: "Notified 30, 7, and 1 day before each quarterly deadline" }
```
If the panel doesn't currently render a subtitle, add a small muted line under the label for the new row only (or for all rows if minimal). Default unchecked-in-mutes = on.

### PART 6 — Verified clean

Will not touch: `send-deletion-reminders`, deletion code paths, `mtd_quarterly_periods` schema, `InstructorTax.tsx`, `ukTax.ts`, tax calculation helpers, `MTDSetup.tsx` enrolment logic, `MTDDashboard.tsx` display, `seed-mtd-periods` function.

### PART 7 — Deferred

- HMRC OAuth + actual submission edge function.
- Email channel for MTD reminders (push-only for now; SMS path already exists via `notify-instructor` if instructor has phone + Twilio configured).
- Backfill of `mtd_deadline_reminders_sent` for already-elapsed periods (none exist — table is empty).
- Admin observability view of reminder send log.

---

### Technical notes
- First real send under live data: **Wed 8 Jul 2026** (30-day tier for Q1 2026/27, deadline 7 Aug 2026), provided at least one instructor has completed enrolment by then.
- Cron fires daily at 09:00 UTC. Idempotent: the unique `(period_id, tier)` constraint guarantees no double-send even if the function runs twice in a day.
- The `notify-instructor` gate already honours quiet hours and category mutes — we delegate to it rather than re-implementing.