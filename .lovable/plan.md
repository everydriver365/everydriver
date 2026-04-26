## Goal

Split the existing combined "conflict warning" into two distinct layers in `AddLessonSheet`:

- **Hard overlap** (Phase 1 — unchanged): blocks Save, no override allowed except via the existing "Book anyway" checkbox **only for buffer-shortfall** (kept as today). Direct time clashes with another lesson or Google Calendar busy event still cannot be overridden by travel-time logic.
- **Travel-time concerns** (new soft layer): an amber, dismissible warning that informs the instructor "tight travel from X" or "tight travel to Y", **never blocks Save**, and never sets `conflictWarning`.

Phase 1's overlap detection, calendar-event scan, debounce race fix, and effective-buffer logic all remain intact.

## What changes

All changes in `src/components/instructor/AddLessonSheet.tsx`. No DB, no edge function changes.

### 1. New parallel state

Add alongside existing `conflictWarning` / `travelSuggestion`:

```ts
type TravelWarning = {
  direction: 'before' | 'after';
  fromName: string;
  toName: string;
  travelMinutes: number;
  gapMinutes: number;
  shortfallMinutes: number;        // required - gap
  suggestedTime?: string;          // only for 'before' direction
};
const [travelWarning, setTravelWarning] = useState<TravelWarning | null>(null);
```

`travelSuggestion` is kept (used for the "Use suggested time" tap action) but is no longer the **only** way travel info surfaces.

### 2. Rework the travel sections of the conflict-check effect

Inside `run()` in the existing `useEffect`:

- **Step 1 (overlap check)** — UNCHANGED. Still sets `conflictWarning` for hard overlap or buffer-shortfall against lessons/events; still `return`s early.
- **Step 2 (travel from previous)** — when `gap < required`:
  - **Do NOT set `conflictWarning`.**
  - Set `travelWarning` with direction `'before'`, `shortfallMinutes`, `suggestedTime`.
  - Keep populating `travelSuggestion` (so the "Use suggested time" button still works).
  - Do NOT `return`; continue to step 3 so a "before" + "after" situation can both be considered (last-write-wins favours the more severe one — see ranking below).
- **Step 3 (travel to next)** — when `gapAfter < required`:
  - **Do NOT set `conflictWarning`.**
  - If no `travelWarning` yet, set one with direction `'after'`.
  - If a `'before'` warning already exists, keep whichever has the larger `shortfallMinutes` (more urgent wins). Tie → keep `'before'`.

At the top of `run()`, reset `setTravelWarning(null)` alongside the existing resets.

### 3. Save handlers — keep Phase 1 hard block, ignore travel warning

`handleAddLessonExisting` and `handleAddLessonNew`:

- Keep the existing `await pendingCheckRef.current` race fix.
- Keep `if (conflictWarning && !overrideBuffer) { toast.error(...); return; }` — unchanged.
- Do **nothing** with `travelWarning`. Save proceeds even when it is set. (Optional: a `console.debug` for traceability, no UI block.)

### 4. UI — add an amber soft-warning banner

Right after the existing red `conflictWarning` block (around line 800), add a new banner that renders when `travelWarning` is set AND `conflictWarning` is null (so we never stack two warnings about the same time):

```text
[icon]  Tight travel — only {gap} min {before {nextName} | after {fromName}}
        for a {travelMinutes} min drive. You can still book this.
        [Use suggested time HH:MM]   ← only for 'before' direction
```

Styling: amber palette to clearly differ from the red hard-block:
- background `#FFFBEB`, border `#FDE68A`, icon/text `#92400E` (Tailwind amber-50/200/800 family)
- `Clock` or `Car` icon from `lucide-react` (already imported set — pick whichever is already in scope; fall back to `AlertTriangle` styled amber if not).
- No "Book anyway" checkbox (Save is never blocked by this).
- The "Use suggested time" link sets `lessonStartTime` and clears both `travelWarning` and `travelSuggestion`.

The existing blue `Sparkles` "tap to start at HH:MM" suggestion banner (line 804) stays, but its render condition becomes `!conflictWarning && !travelWarning && travelSuggestion` so it doesn't duplicate the amber warning.

### 5. Wording inside the existing red banner

The "Book anyway (override buffer / travel)" label currently mentions travel. Trim it to **"Book anyway (override buffer)"** since travel no longer routes through this banner. The override checkbox itself is unchanged.

## What stays exactly the same

- `instructor_calendar_events` scan and merging into `allSlots`.
- `effectiveBuffer = max(bufferMinutes, 1)` for overlap detection.
- `pendingCheckRef` debounce-race fix on Save.
- Hard overlap message text and red banner.
- The "Use suggested time" tap behaviour.
- All edge function contracts (`check-travel-buffer` unchanged).

## Out of scope

- No new fields, no DB migrations, no edge function edits.
- Reschedule sheet — not touched.
- No change to how travel time is computed (still TomTom via `check-travel-buffer`).

## Files touched

- `src/components/instructor/AddLessonSheet.tsx` — add `travelWarning` state, split travel branches off `conflictWarning`, add amber banner, adjust override-checkbox label and blue-suggestion render condition.
