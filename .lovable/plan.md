## Goal

Restyle the "New Lesson" sheet (`src/components/instructor/AddLessonSheet.tsx`) to match the premium tile design system used elsewhere in the instructor portal, and wire the Save button's disabled state to the existing Phase-1 hard-overlap check. **No business logic, validation rule, picker behaviour, or save flow changes.** Only visuals + the existing Save handler's gating reflect more accurately on the button itself.

## What stays untouched

- Lesson type list, pupil selection, new-pupil form fields, date/time/duration pickers and their state.
- Phase-1 overlap detection effect (lines 280–446) and `pendingCheckRef` race fix.
- Phase-2 amber travel warning + expandable details panel — already in place, not touched.
- `handleAddLessonExisting` / `handleAddLessonNew` save flow, validation, recurring lessons, driving-test mode, post-payment dialog, analytics, and the Sheet open/close behaviour with `onOpenChange`.
- All edge functions, DB writes, and `useEffect` dependencies.

## Visual changes (all inside `AddLessonSheet.tsx`)

### 1. Header bar
Replace lines 587–617 with:

- Drop the grab-handle div.
- Sticky header: `background: #FFFFFF`, `border-bottom: 0.5px solid #E5E5EA`, `padding: 12px 16px`, flex with `gap: 12px`.
- Left **Cancel** — transparent, no border, `font-size: 14px, weight: 500, color: #2B7BC8`. `onClick={() => onOpenChange(false)}` (unchanged).
- Centre title — `flex: 1, text-align: center, font-size: 15px, weight: 500, color: #000`, sentence case: `"New lesson"` / `"Edit lesson"` / `"Schedule test"` driven by existing `isDrivingTest` flag.
- Right **Save** — same colour `#2B7BC8`, `font-size: 14px, weight: 500`. **Disabled state** (see §4) applies `opacity: 0.4, cursor: not-allowed` and short-circuits `onClick`. Loading state shows `"Saving…"`, `opacity: 0.6, cursor: wait`.

Wraps the existing `onClick={tab === 'existing' ? handleAddLessonExisting : handleAddLessonNew}` — handler unchanged.

### 2. Sheet container
- Background of the scroll area becomes `#F2F2F4`.
- Wrap form sections in a single white card: `background: #FFFFFF, border-radius: 0 0 12px 12px, padding: 16px, gap: 18px between sections`.
- Remove the existing 1-px grey divider between sections (line 645) — the gap handles separation.

### 3. Section eyebrow labels
Convert every `<SectionLabel>` to: `font-size: 11px, weight: 500, color: #6E6E73, letter-spacing: 0.3px, text-transform: uppercase, margin: 0 0 8px`. Update copy:
- "Lesson Type" → "Lesson type"
- "Start Time" → "Start time"
- "New Pupil" → "New pupil"

### 4. New shared local primitive: `FormInputCard`
Defined inline at the bottom of the file (alongside the existing `Section` / `InputField` helpers) — not a separate file unless you'd prefer otherwise.

```text
[28×28 tinted icon tile]  Label / Value (flex:1, 15px/500 #000)  [chevron 12×12 #6E6E73]
```

Container: `background: #FFFFFF, border: 0.5px solid #E5E5EA, border-radius: 10px, padding: 12px 14px`, full-width tappable button. Used for: lesson type trigger, pupil picker trigger, date trigger.

A compact variant (`padding: 12px`) is used for the side-by-side Start time + Duration grid cell.

### 5. Lesson type selector (lines 622–642)
- Use `FormInputCard` as the `<SelectTrigger>`.
- Icon container: `28×28, border-radius: 7px`. Background colour comes from a small palette map keyed by lesson type: standard `#E6F1FB`/icon `#2B7BC8`, test prep `#E8F3E8`/`#3B8B3B`, courses `#FBF1DE`/`#B8801F`, mock `#FBEAEC`/`#C8434F`, other `#F1ECFA`/`#8A5BC9`. Fall back to `#F2F2F4`/`#6E6E73` for unknown types.
- Drop the decorative `10×10` colour dot inside each `<SelectItem>` (line 635). Use a small tinted icon tile inside dropdown items instead, or just the label.

### 6. Pupil tab toggle (lines 650–681)
Replace the inline custom toggle with the existing `<SegmentedControl>` (`@/components/instructor/ui/SegmentedControl`):
- Two options: `existing` (label "Existing", with line `Users` icon) and `new` (label "New pupil", with `UserPlus` icon).
- `value={tab}`, `onChange={setTab}`. No drop shadow, no boxShadow on the active pill — the component already matches the spec.

### 7. Pupil picker (lines 690–709)
Wrap the `<SelectTrigger>` in `FormInputCard` styling. Selected-state visual:
- Avatar 28×28, deterministic colour from `@/lib/pupilAvatarColor` (already in repo), white initials inside (11px/500). Pupil name `15px/500 #000` in proper case (use existing `toProperCase` if present, otherwise add a tiny inline helper that runs only at render — no DB write).
- Empty state: small line `Users` icon `18×18 #6E6E73` + placeholder "Select pupil" `15px/400 #6E6E73`.

### 8. New pupil entry (lines 711+)
Visually wrap each existing `<InputField>` in the white hairline card: `background: #FFFFFF, border: 0.5px solid #E5E5EA, border-radius: 10px, padding: 12px 14px`; label `12px/#6E6E73, margin-bottom: 6px` above the input; focus ring on the container becomes `border: 0.5px solid #2B7BC8`. Keep all existing fields, validators, address autocomplete, postcode, etc.

### 9. Date & time section
- New section header "Date & time" (currently the date and time live in separate sections — collapse them under one eyebrow).
- Date row uses `FormInputCard` with line `CalendarIcon` (already imported). Display formatted date via existing date-formatter (`format(lessonDate, 'EEEE, d MMMM yyyy')` or whatever's already in use).
- Below it, a 2-col grid (`gap: 8px`) of compact `FormInputCard`s for Start time (`Clock` icon) and Duration (`Clock` again — `Hourglass` is not in lucide, so use `Clock` for both, which the spec accepts as a fallback).
- Small `11px/#6E6E73` label above each grid cell.
- Time format follows the existing rendering in the file (no locale changes here).

### 10. Conflict banner restyle (around lines 794–830)
Replace the current red box with the spec'd structure:
- Container: `background: #FBEAEC, border: 0.5px solid #C8434F, border-radius: 10px, padding: 12px`, flex `align-items: flex-start, gap: 10px`.
- Left: `20×20` red filled circle (`background: #C8434F`) with white `X` icon inside (`lucide-react` `X`, 12×12, stroke white).
- Headline `13px/500 #C8434F` — derive label from the existing `conflictWarning` text (Phase 1 already produces "Overlaps with X" / "Too close to X"). Keep the existing message as the description; the headline is a short prefix:
  - if message starts with "Overlaps" → headline "Lesson clash" (or "Calendar clash" / "Test clash" if we can detect the source — not blocked on this).
  - else → headline "Heads up".
  
  Implementation: a tiny pure helper `getConflictHeadline(conflictWarning)` near the component top.
- Description line: render the existing `conflictWarning` text as the description with `12px/#000`.
- Keep the existing "Book anyway (override buffer)" checkbox **inside the banner** — it preserves the Phase-1 override path (which the current banner already supports). The new prompt forbids new override affordances but says "do not change behaviour"; this checkbox already exists, so we keep it. No new "Save anyway" link is added.

### 11. Save button disabled wiring (the only behaviour change)
Add a derived flag `const saveDisabled = loading || (!!conflictWarning && !overrideBuffer)`. Wire the header Save button to:
- `disabled={saveDisabled}`
- `style={{ opacity: saveDisabled ? 0.4 : 1, cursor: saveDisabled ? 'not-allowed' : 'pointer', ... }}`
- `onClick`: noop when `saveDisabled`, otherwise unchanged dispatch to `handleAddLessonExisting` / `handleAddLessonNew`.

The existing handlers already have an internal `if (conflictWarning && !overrideBuffer) { toast.error(...); return; }` defence — we keep that as the synchronous re-check at save time. The visible disabled state is the new layer; the handler guard remains the source of truth.

We do **not** add additional required-field gating to `saveDisabled` because today's handlers raise inline `toast.error` for missing fields and that flow is unchanged. (Adding required-field gating risks subtle regressions in the new-pupil flow where field-level validation already lives in the handlers.)

### 12. Optional clear-state confirmation
**Skip for now** — the spec says "If you'd rather not render anything in the clear state, that's also fine." The absence of a banner already means "you're good." Avoiding it keeps scope tight and prevents flicker as the conflict check runs.

## Things explicitly removed

- Sheet grab-handle bar.
- Title-Case copy (replaced sentence-case throughout the form chrome).
- Inline `boxShadow` on the active toggle segment (handled by `SegmentedControl`).
- Decorative blue dot beside the lesson type icon.
- The 1-px grey divider between sections (replaced with section gap).
- Heavy `font-weight: 600/700` titles in the header and section labels.

## Out of scope (do not touch)

- The Phase-1 overlap detection effect and Phase-2 travel warning + expandable panel.
- Edge functions, RPCs, DB schema.
- The destination screens that the pickers open.
- Reschedule sheet, post-payment dialog, recurring-lesson logic, driving-test extras.
- Travel-time logic on Save (still soft, never blocks).

## Files touched

- `src/components/instructor/AddLessonSheet.tsx` — visual restructure of the header, sections, lesson-type trigger, pupil tab toggle, pupil picker, date/time row, and conflict banner; new local `FormInputCard` helper; new `saveDisabled` derived flag bound to the Save button.

No new files unless review prefers `FormInputCard` extracted to `src/components/instructor/ui/FormInputCard.tsx` — happy to split it on request.
