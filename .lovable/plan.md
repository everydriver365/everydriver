

## Plan: Speed Up Active Session Refresh

### Change
**File: `src/hooks/useActiveSession.ts`** — Change `refetchInterval` from `30000` (30s) to `5000` (5s) so the tracking bar updates near-instantly.

This is the hook that powers the live tracking session indicator. 5 seconds strikes a good balance between responsiveness and avoiding excessive queries.

### Files to modify
- `src/hooks/useActiveSession.ts` — line 98: `30000` → `5000`

