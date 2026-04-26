## Why no travel-time warning shows today

In `AddLessonSheet.tsx` the conflict-check effect runs the **overlap branch first** (lines 309–337). If the new lesson overlaps an existing lesson or Google Calendar event — or sits inside the buffer — it sets the red `conflictWarning` and `return`s out of the function on line 332, **before** either travel-time check (`previous → new`, `new → next`) gets a chance to run.

On top of that, the amber banner is rendered with the condition `!conflictWarning && travelWarning` (line 833), so even if travel data existed it would be hidden whenever a red banner is showing.

Net result: as soon as there's any time clash, travel time is silently skipped. That's why your current test (which clashes with another lesson) shows only red.

## What this plan changes

Make travel-time warnings independent of the overlap result, so the instructor sees both pieces of information when both are relevant. Hard-overlap blocking behaviour from Phase 1 is **unchanged** — overlap still blocks Save, travel still does not.

### 1. Stop returning early from the overlap branch

In `src/components/instructor/AddLessonSheet.tsx` around line 317–333:

- When a conflict is found, still call `setConflictWarning(...)` with the same red message.
- **Remove** the `setTravelSuggestion(null)` / `setTravelWarning(null)` lines and **remove** the `return;`.
- Let execution fall through to the `previous` / `next` lookups and the two travel checks.

The save guard (`if (conflictWarning && !overrideBuffer) { ... return; }` on lines 495 and 531) is untouched, so hard overlaps still block Save exactly as today.

### 2. Allow the amber banner to render alongside the red one

Around line 833, change the render condition from:

```tsx
{!conflictWarning && travelWarning && ( ... )}
```

to simply:

```tsx
{travelWarning && ( ... )}
```

The blue "tap to start at HH:MM" suggestion banner (line 872) keeps its existing `!conflictWarning && !travelWarning && travelSuggestion` guard so we never stack three banners.

### 3. Visual order in the form

Stack order top-to-bottom: red overlap → amber travel → blue suggestion. The amber banner keeps its current amber-50/200/800 palette so it's clearly distinct from the red block and never looks like it's overriding it.

### 4. What deliberately stays the same

- `effectiveBuffer = max(bufferMinutes, 1)` overlap detection.
- The `pendingCheckRef` race fix on Save.
- The "Book anyway (override buffer)" checkbox — only governs buffer/overlap, never travel.
- `check-travel-buffer` edge function — unchanged.
- Reschedule sheet — not touched.

## Files touched

- `src/components/instructor/AddLessonSheet.tsx` — drop the early return in the overlap branch, drop the `!conflictWarning` guard on the amber banner.

## Out of scope

- No DB or edge function changes.
- No new fields, no copy changes beyond what's already in the amber banner.
