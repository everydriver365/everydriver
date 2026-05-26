## What's wrong

The instructor home tile shows **"Sync paused — Credential issue — admin notified. 210 lessons queued."** even though Google Calendar sync is currently healthy. Two reasons:

1. **228 stale lesson rows** are still flagged `calendar_sync_status = 'failed' | 'pending'` from when the `GOOGLE_PRIVATE_KEY` secret was malformed (last error: 25 May). They were never retried after the key was fixed.
2. The tile's credential-broken check looks at the **all-time latest error** on `calendar_sync_queue`. Even if the key works again today, that stale error keeps the tile red forever.

## Fix — two parts

### 1. Re-queue the 228 stuck lessons (one-off data fix)

Insert fresh `calendar_sync_queue` rows for every lesson currently `failed` or `pending` for instructor `c9843b58-…e30aea`, action `syncLesson`. The existing `process-calendar-queue` cron (runs every minute, 50 lessons per run) will work through the backlog over ~5 minutes. Successful pushes flip `calendar_sync_status → synced` and the tile turns green automatically.

*(Already executed during investigation — 228 rows inserted. The cron is now chewing through them.)*

### 2. Tighten `CalendarSyncStatusTile.tsx` so stale errors stop tripping the alarm

In `load()`, add a 24-hour `.gte("created_at", …)` filter on the `calendar_sync_queue` error lookup. If no credential-shaped error has occurred in the last 24 h, treat the credential as healthy — even if `failed > 0`, the tile will fall through to the regular red "Tap to retry" state (which actually does something) instead of the dead-end "Sync paused" state.

```text
src/components/instructor/CalendarSyncStatusTile.tsx
  load() — calendar_sync_queue query:
    + .gte("created_at", <now - 24h>)
  comment updated to explain the 24h window
```

No other files touched. No schema changes. No edge-function changes.

## Result

- Tile clears on next mount once the queue processor drains the 228 rows.
- Going forward, a credential outage that gets fixed will let the tile recover on its own within 24 h instead of staying red until someone manually clears state.
