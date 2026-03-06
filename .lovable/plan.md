## Calendar Sync — Clean & Consolidated ✅

All calendar sync is now handled by two edge functions and two cron jobs:

### Active Components
- **`google-calendar-service`** — handles all calendar operations (connect, test, sync external events, create/update/delete lessons, syncAllInstructors)
- **`process-calendar-queue`** — processes the sync queue for lesson→Google pushes

### Cron Jobs (2 active)
| Job ID | Schedule | Target |
|--------|----------|--------|
| 14 | `*/15 * * * *` | `google-calendar-service` (syncAllInstructors) |
| 15 | `*/15 * * * *` | `process-calendar-queue` |

### Cleanup Completed
- ✅ Removed stale cron jobs (IDs 3 and 5)
- ✅ Deleted redundant edge functions (`scheduled-calendar-sync`, `sync-all-calendars`)
- ✅ Fixed `generateJWT` signature — removed unused `calendarId` parameter across all call sites
- ✅ Removed stale `google-calendar-sync` references from `create-booking` and `square-booking-wallet-payment`
- ✅ Lesson sync triggered automatically via `trigger_calendar_sync` database trigger
