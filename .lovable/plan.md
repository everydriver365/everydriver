## What I found

The wiring is already in place for `/instructor/settings/schedule` on mobile:

- `src/pages/instructor/SettingsPage.tsx` and `src/pages/instructor/InstructorSettingsHub.tsx` both render `SettingsLayout` on mobile.
- `src/components/instructor/settings/SettingsLayout.tsx` (mobile branch, line ~147) short-circuits when `activeCategory.id === "schedule"` to render `ScheduleMobileLayout`.
- `src/components/instructor/settings/mobile/ScheduleMobileLayout.tsx` exists and is exported correctly.

No runtime errors, no console errors. So the new component is rendering — it just isn't visually distinct enough from the previous mobile layout (which already used `rounded-2xl bg-card border` cards with title + description headers and a calendar tile + "Schedule" page header). The only currently visible additions are the small uppercase labels above each card and the extra "Payments" pointer card at the bottom.

That's why it "looks the same" on a quick scan.

## Plan

1. Sanity-check the page is actually rendering the new layout
   - Capture a fresh screenshot of `/instructor/settings/schedule` at 390px in the preview after a hard reload.
   - Confirm the uppercase labels ("WORKING HOURS", "LESSON SETTINGS", …, "PAYMENTS") are present and the sixth Payments card exists. If they are not, the bundle is stale and a manual reload is needed.

2. Make the redesign visually unmistakable so the change reads at a glance
   Update `ScheduleMobileLayout.tsx` only — no logic changes, no edits to existing editors:
   - **Page background**: Force the page surface to `#F4F7F6` (DSM dashboard bg) so cards "lift" off the page.
   - **Page header**: Increase the calendar tile to 48px with a stronger blue tint, and move the title size to 22px / weight 700 so it clearly differs from the old `CategoryHeader`.
   - **Uppercase group labels**: Bump tracking to `0.1em`, add 4px more bottom margin, and tint with `#6B7280` for higher contrast — these are the primary signal that the redesign landed.
   - **Cards**: Switch from `border-border/50` look to an explicit `0.5px solid rgba(15,23,42,0.08)` plus a soft `0 1px 2px rgba(15,23,42,0.04)` shadow so the new cards visibly differ from the legacy ones.
   - **Card header**: Render the icon tile at 36px and add a hairline divider (`0.5px` border-bottom on the header, `rgba(15,23,42,0.06)`) between the header and the editor body — matches the brief's "hairline border between rows" intent.
   - **Payments card**: Replace the muted pointer text with a tappable row styled like the other cards (chevron right, "Configured in Reminders") so the sixth card reads as a real section, not a footnote.

3. Verify
   - Re-screenshot at 390px after the edit.
   - Confirm all 6 labelled sections render, the page header tile is the larger blue tile, and the cards have the new shadow/divider treatment.

## Technical notes

- File touched: only `src/components/instructor/settings/mobile/ScheduleMobileLayout.tsx`.
- No changes to `SettingsLayout.tsx`, `categories.tsx`, or any editor.
- No DB, no routing, no business logic.
- Desktop path remains untouched (still uses `SettingsShellV3` for `/instructor/settings/working-hours`).

If after step 1 the uppercase labels are missing entirely, the cause is a stale preview bundle and the fix is a hard reload, not a code change.
