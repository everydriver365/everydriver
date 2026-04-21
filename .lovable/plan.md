

## Plan: Daily health check for live-data tiles

Add a scheduled health check that verifies every live-data source feeding the instructor mobile tiles is responding and returning fresh data, then surfaces any outage as an alert in the app.

### What gets checked

For each instructor (active in the last 30 days), the job pings the live data sources behind the dashboard tiles and records pass/fail + latency:

1. **Scheduled lessons** — `scheduled_lessons` query for today (drives Next Up, Today's Schedule, Week at a Glance lessons count).
2. **Pupils / balances** — `pupils` row count + `account_balance` sum (drives Action Needed totals, payment widgets).
3. **Payments this week** — `payment_history` sum for the current ISO week (drives Week at a Glance "Earned").
4. **Messages** — unread `messages` + `live_chat_messages` counts (drives Action Needed + Messages widget).
5. **Job offers** — `course_enquiries` pending count.
6. **Test swap requests** — same query as `useTestSwapNotifications`.
7. **Calendar sync queue** — checks `calendar_sync_queue` isn't backlogged (>50 unprocessed older than 1h = warn).
8. **WhatsApp** — reuses existing `whatsapp-health-check` per connected instructor.
9. **Payment gateways** — reuses existing `payment-health` (global, once per run).
10. **Telematics poller** — checks last `telematics_gps_points.recorded_at` is within 10 min for any instructor with an active session.

A check **fails** if the query errors, times out (>5s), or returns clearly stale data (e.g. lesson row updated_at older than expected for an active instructor).

### New backend pieces

**Table `tile_health_checks`** (new migration):
- `id`, `instructor_id` (nullable for global checks), `source` (text, e.g. `scheduled_lessons`), `status` (`ok` | `warn` | `fail`), `latency_ms` (int), `details` (jsonb), `checked_at` (timestamptz default now()).
- RLS: instructor can SELECT own rows; admins via `has_role`; service role inserts.
- Index on `(instructor_id, source, checked_at desc)` for fast latest-status lookup.

**Edge function `tile-health-check`** (new, `verify_jwt = false`):
- Runs all 10 checks above per active instructor in batches of 25.
- Writes one row per (instructor, source) into `tile_health_checks`.
- For any `fail` (or 2 consecutive `warn`s), inserts a row into the existing `instructor_forum_alerts`-style notification path — actually we'll use a dedicated `instructor_health_alerts` table to avoid mixing concerns:
  - `instructor_health_alerts` (id, instructor_id, source, severity, message, created_at, resolved_at).
- Auto-resolves any open alert for a source that comes back `ok`.

**pg_cron schedule** (separate SQL run via insert tool, not migration, per project rules):
- `'tile-health-daily'` at `0 6 * * *` UTC (07:00 BST) — full sweep.
- `'tile-health-hot'` every 15 min — runs only the live message/lesson/payment checks (cheap subset) for instructors active in the last 24h, so outages are caught fast, not 24h later.

### Frontend surfacing

**New hook `useTileHealth(instructorId)`** — subscribes to `instructor_health_alerts` for unresolved rows, returns `{ alerts, hasOutage }`.

**Banner component `TileHealthBanner`** — thin amber strip rendered above `WarmHomeTiles` on `/instructor` when `hasOutage`. Copy: `Some live data is delayed — last checked {time ago}`. Tapping expands to a list of affected sources with retry button (calls `tile-health-check` ad-hoc for that instructor).

**Per-tile dot indicator** — tiny 6px amber dot in the top-right of any tile whose underlying source has an unresolved `warn`/`fail` alert. Implemented in `WarmHomeTiles.tsx`, `NextUpTile.tsx`, `UnifiedAgendaTile.tsx`, `MessagesWidget` by reading `useTileHealth` and matching the tile's source key. No dot when everything is `ok`.

**Admin view** — extend the existing instructor admin dashboard (if present) to show the latest `tile_health_checks` summary per instructor; otherwise add a simple `/admin/tile-health` table view for ops visibility.

### Files to create

- `supabase/migrations/<ts>_tile_health.sql` — `tile_health_checks` + `instructor_health_alerts` tables, RLS, indexes.
- `supabase/functions/tile-health-check/index.ts` — the checker.
- `src/hooks/useTileHealth.ts` — realtime hook.
- `src/components/instructor/TileHealthBanner.tsx` — outage banner.
- `src/pages/admin/TileHealthDashboard.tsx` — admin overview (route `/admin/tile-health`, gated by `has_role('admin')`).

### Files to edit

- `src/components/instructor/InstructorPortalLayout` (or the `/instructor` page wrapper) — mount `<TileHealthBanner />`.
- `src/components/instructor/WarmHomeTiles.tsx` — add per-tile health dot.
- `src/components/instructor/NextUpTile.tsx` — add health dot.
- `src/components/instructor/dashboard/UnifiedAgendaTile.tsx` — add health dot.
- `src/App.tsx` (or admin router) — register `/admin/tile-health` route.

### Cron setup

After the function deploys, run (via the insert tool, not migration):

```sql
select cron.schedule('tile-health-daily', '0 6 * * *', $$
  select net.http_post(
    url := 'https://qyqeibovdhyohkfagujv.supabase.co/functions/v1/tile-health-check',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer <ANON>"}'::jsonb,
    body := '{"mode":"full"}'::jsonb
  );
$$);

select cron.schedule('tile-health-hot', '*/15 * * * *', $$
  select net.http_post(
    url := 'https://qyqeibovdhyohkfagujv.supabase.co/functions/v1/tile-health-check',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer <ANON>"}'::jsonb,
    body := '{"mode":"hot"}'::jsonb
  );
$$);
```

### QA at 390px on `/instructor`

- With everything healthy → no banner, no dots, tiles render as today.
- Simulate outage by inserting a `fail` row in `instructor_health_alerts` → amber banner appears above tiles, dot appears on the affected tile, realtime update without refresh.
- Resolve the alert → banner and dot disappear within 1s.
- Cron logs in `pg_cron` show successful invocations daily and every 15 min.

