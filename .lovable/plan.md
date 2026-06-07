## Sync Health Dashboard + Booking Guard

Two changes, one pass. Both target the real reliability gap: **no visibility, and one missing validation that let an out-of-hours lesson through**.

---

### 1. Admin Sync Health page — `/admin/sync-health`

A single screen that answers "is it broken right now, and for who?" without me having to dig through logs.

**Per-instructor table** (one row per instructor with Google connected):

| Column | Source |
|---|---|
| Instructor | `instructors.name` |
| Last sync | `instructor_google_calendars.last_synced_at` — red dot if > 30 min |
| Webhook expiry | `instructor_google_calendars.webhook_expiration` — amber < 24h, red if expired |
| Sync error | `instructor_google_calendars.sync_error` — red if present |
| Queue pending | count from `calendar_sync_queue` where `processed_at IS NULL` |
| Queue failed | count where `error IS NOT NULL AND error != 'Deduplicated'` |
| Token age | computed from `token_refreshed_at` |
| Actions | "Force sync" / "Renew webhook" buttons |

**Top summary cards:** total instructors connected • stale (>30 min) • webhooks expiring in 24h • failed queue items • cron status (last run + ok/fail for each of the 5 jobs).

**Cron panel:** pulls from `cron.job` + `cron.job_run_details` for the 5 sync-related jobs, shows last run, status, duration.

Page auto-refreshes every 60s. Route added to `adminRoutes.tsx` behind `ProtectedAdminRoute`. Tile added to the admin dashboard next to `EdgeErrorsTile` so it's the first thing visible.

---

### 2. Working-hours guard (fixes the 08:30 Ken D booking)

The 08:30 phantom wasn't a sync bug — Ken's Monday hours are 10:30–16:00 and the booking flow let it through anyway. Add a server-side check in the booking edge function (and the matching client validator) that rejects any lesson whose start/end falls outside the instructor's `instructor_availability` window for that weekday, returning a clear "Outside working hours" error. No silent fallback.

This is the only validation gap I'm closing in this pass — everything else flagged in the investigation is already working.

---

### Technical notes

- New page: `src/pages/admin/SyncHealthDashboard.tsx`
- New tile: `src/components/admin/SyncHealthTile.tsx` (mirrors `EdgeErrorsTile`)
- New edge function: `sync-health-stats` — aggregates the per-instructor + cron data in one call (avoids 50+ client queries)
- Route added to `src/routes/adminRoutes.tsx`
- Booking guard: edit existing booking edge function + `src/lib/booking-validation.ts`
- No schema changes. No new tables. Uses data we already write.

### Out of scope

- Nylas migration (revisit only if this dashboard shows real recurring failures)
- Rewriting the sync engine
- Mobile layout changes

Approve and I'll build it.