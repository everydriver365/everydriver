# Use Google Calendar's own colours for events

Right now the Google-Calendar-style Schedule view picks a colour for each external (Google) event from a 6-category keyword map (e.g. "holiday", "course", "admin"). The events already store their actual Google Calendar hex colour on ingest (mapped from Google's `colorId` 1–11). This change uses that real colour instead, so what you see in the app matches what you see in Google Calendar.

## What changes (visual)

- **External Google events**: chip border = the exact Google colour. Background = a light tint of that colour. Title/time text = a darker shade of it. So a "Lavender" event in Google shows up as a lavender chip; a "Tomato" event shows up red, etc.
- **All-day Google events**: same treatment.
- If a Google event has no colour set (uses the calendar default), it falls back to the current category-based palette so it still looks intentional.

## What stays the same

- **Lessons** keep the blue "lesson" palette (they aren't Google events).
- **Manual blocks / tasks / holidays / courses** added inside the app keep their semantic palette.
- All click behaviour, expand/collapse, swipe-to-delete, FAB, "now" indicator, week headers, gap fills — unchanged.
- No data, schema, edge function, or sync logic is touched. We're only changing how the existing `color` field on each event is rendered.

## Technical details

1. **`src/components/instructor/scheduleGoogleStyle.ts`**
   - Add `styleFromGoogleColor(hex)` helper that returns `{ bg, text, border }`:
     - `border` = the hex itself (strong stripe).
     - `bg`    = hex tinted ~88% toward white (soft chip fill).
     - `text`  = hex shaded ~55% toward black (WCAG-AA at 13px).
   - Returns `null` if the input isn't a valid `#rrggbb`.

2. **`src/components/instructor/MultiDayScheduleView.tsx`**
   - Extend `EventChip` to accept an optional `colorOverride?: CategoryStyle` and use it in place of the category lookup when present.
   - When rendering external events (both timed and all-day), compute `styleFromGoogleColor(evt.color)` and pass it as `colorOverride`. If it returns `null`, fall back to the category palette (current behaviour).
   - Lessons, manual blocks, and tasks: no change — they keep using their semantic category.

3. **Accessibility**: text colour is derived to keep ≥4.5:1 contrast on the tinted background at 13px. Screen-reader category label (`<span class="sr-only">…</span>`) stays.

No new files, no schema changes, no new dependencies.
