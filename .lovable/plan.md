# Why the home tile shows sync issues

The "Calendar sync" tile on `/instructor` (`src/components/instructor/CalendarSyncStatusTile.tsx`) counts every `scheduled_lessons` row where `calendar_sync_status = 'failed'` (or `'pending'`) for the instructor — with no other filters.

For your account there are **209** such rows, but **all 209 are cancelled** and **203 are soft‑deleted**. They're leftovers from lessons that were removed; the sync failure flag was never cleared. That's why your schedule + next slot look right (those don't read `calendar_sync_status`) but the tile screams red.

The same blind count also exists in the pending branch, and the credential‑broken classifier keys off whether `failed > 0`, so today a pile of stale cancelled rows can also flip the tile into "Sync paused / credential issue".

## Fix

Scope the two counts on the tile to lessons that actually matter:

```ts
// pending
.eq("calendar_sync_status", "pending")
.is("deleted_at", null)
.neq("status", "cancelled")

// failed
.eq("calendar_sync_status", "failed")
.is("deleted_at", null)
.neq("status", "cancelled")
```

File: `src/components/instructor/CalendarSyncStatusTile.tsx` (the two count queries inside `load()`).

No DB migration, no change to the sync pipeline, no change elsewhere on the home screen. After the fix the tile will read **0 failed / 0 pending → "Synced"** for your account, matching what the rest of the dashboard already shows.

## Optional follow‑up (only if you want it)

One‑off cleanup so future tiles/queries aren't polluted:

```sql
update scheduled_lessons
set calendar_sync_status = 'no-calendar'
where calendar_sync_status in ('failed','pending')
  and (status = 'cancelled' or deleted_at is not null);
```

Say the word and I'll include it as a migration; otherwise I'll just ship the tile fix.
