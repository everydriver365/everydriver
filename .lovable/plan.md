## Clean up the ICS calendar sync page

The user wants "add once and forget". The `Rotate URL` button is a security action that breaks the existing subscription and should not be prominent. Tuck it away.

### Changes

1. In `src/components/instructor/IcsCalendarSync.tsx`:
   - Remove the `Rotate URL` icon button from the main feed URL row.
   - Add a collapsed **Advanced** `<details>` block below the feed instructions.
   - Inside it: show a text warning ("Only rotate if your URL was shared with the wrong person. Your calendar app will need re-adding.") + the **Rotate URL** button.
2. No other files touched. No DB changes. No edge function changes.

### Result

- Default view: Copy button + URL only. Clean and simple.
- Advanced section hidden unless explicitly opened. Safety action no longer in accidental reach.