## Remove the "Force Google refresh" button

The user wants the ICS-only model and doesn't want token rotation. The "Force Google refresh" button I added implies a re-sync exists when it doesn't (Google URL subscriptions can't be forced). Remove it to avoid confusion.

### Changes

1. **Remove `forceResync` function** from `src/components/instructor/IcsCalendarSync.tsx` (lines ~89–111).
2. **Remove the button UI** added at the bottom of the outbound feed card (the border-t row with "Times looking wrong after a clock change?" text + button).
3. Keep the timezone fix (`VTIMEZONE` block + `TZID=Europe/London` on lessons) already deployed in the edge function — that's the real fix.

No DB changes. No other files touched.