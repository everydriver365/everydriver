## Goal
Add proper **Disconnect** + **Reconnect** controls (with `AlertDialog` confirmations) to each integration on the Integrations hub. Replace the existing native `confirm()` prompts and ensure stored credentials are cleared.

## 1. Square — `src/components/instructor/SquareConnectSettings.tsx`
- Replace native `confirm()` with shadcn `<AlertDialog>` for **Disconnect** ("Future payments collected by platform…").
- Add a new **Reconnect** button (visible when connected): calls `square-oauth { action: "disconnect" }`, refreshes instructor state, then immediately calls the existing `handleConnect` flow to re-open the OAuth popup.
- Both actions wrapped in AlertDialog with Cancel / confirm; destructive styling on Disconnect.
- Existing edge function already supports `disconnect` and `authorize`.

## 2. Google Calendar — `src/components/instructor/GoogleServiceAccountSetup.tsx`
- Wrap the existing **Disconnect** button in an `<AlertDialog>` ("Stop syncing lessons to Google Calendar?").
- Add a **Reconnect** button beside it: calls `disconnect()` from `useGoogleServiceCalendar`, then re-renders the setup form so the instructor enters a fresh Calendar ID.
- Keep "Sync Now" untouched.

## 3. Xero — `src/components/instructor/XeroExport.tsx`
- Xero is **CSV-only** (no stored credentials/OAuth), so a true "disconnect" doesn't apply. Add a small banner clarifying this: *"Xero export is manual — no credentials are saved."*
- Wrap the existing **Mark All Expenses as Synced** button in an `<AlertDialog>` confirmation, since that is the only persistent state.
- Add a **Reset Sync State** action (also AlertDialog-confirmed) that flips `xero_synced` back to `false` for all of the instructor's expenses, so they can re-export.

## Out of scope
- No new edge functions, no schema changes.
- No mobile layout changes.
- No changes to the broader Integrations hub layout.
