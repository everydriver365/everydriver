# Redesign Test Request form (premium tile system)

## Scope
Restyle `TestRequestForm.tsx` and its host dialogs in `InstructorTestRequests.tsx`, `TestRequestList.tsx`, and `PupilTestRequests.tsx` to match the premium tile system. Behaviour, validation, save API, query invalidations, pupil selector, notes field, and all data fields stay exactly as today — only chrome and a test-centre picker upgrade.

## What changes (visual + UX)

**Form container chrome** — replace `DialogHeader`/`DialogTitle` in all three host sites with a sticky in-form header bar:
- 12/16 padding, 0.5px `#E5E5EA` bottom border
- Left `Cancel` (#2B7BC8, 14/500) — closes dialog; if any field is dirty vs. initial state, show a small native confirm "Discard changes?" before closing
- Centre dynamic title — sentence case "New test request" / "Edit test request"
- Right `Save` (#2B7BC8, 14/500) — disabled (opacity 0.4, cursor not-allowed) when validation fails or `submitting`; label flips to "Saving…" while in flight
- The dialog's own X close button is hidden via custom DialogContent (or replaced by rendering the bar inside and removing default header)

**Section 1 – Type toggle** — replace the two outline buttons with the shared `<SegmentedControl>` from `src/components/instructor/ui/SegmentedControl.tsx`. Two segments: `Have one` (have_test) and `Need one` (want_test). Eyebrow label "What do you need?" using existing `<SectionLabel>`. State binding to `requestType` unchanged.

**Section 2 – Test centre picker** (data-integrity upgrade):
- New shared component `src/components/instructor/ui/TestCentrePicker.tsx`
- Trigger: white card row, 0.5px hairline border, 10px radius, MapPin icon left, value/placeholder middle, ChevronDown right
- Tap opens a `vaul` bottom sheet (`IOSSheet`) with `<SearchInput>` at top and a scrollable list of `test_centres` (already fetched from Supabase as today)
- Selecting a row writes both `selectedCentreId` and `manualCentreName` (preserves current backend contract — both columns continue to be saved)
- Backwards-compat: if `editData.test_centre_name` does not match any picker row by id, the trigger displays the existing free-text value as-is with a small grey "Update" hint chip; tapping opens the picker. Save still works without re-selecting (existing `test_centre_id` and `test_centre_name` are preserved).
- Free-text typing path is removed in favour of picker (per prompt's preferred option). The underlying string field is unchanged.

**Section 3 – Date range** — two-column grid (`From` / `To`):
- Eyebrow label "Date range"
- Each input: white card with calendar icon left, formatted date middle. Tap opens existing `<Calendar>` Popover (picker UI itself unchanged).
- Format helper applied on render only:
  - both dates in current year → "18 Feb"
  - same future year → omit year on From, show on To
  - cross-year → show year on both
  - Always short month names
- For `have_test` (single date), only the From column renders — preserves current behaviour where `dateRangeEnd` is only used for `want_test`.
- Invalid (To < From) → To input gets `border-color: #C8434F` and Save disables.

**Section 4 – Time window** — two-column grid (`Earliest` / `Latest`):
- Eyebrow label "Time window"
- Same card pattern with Clock icon left; tap opens native `<input type="time">` (existing picker reused, just wrapped)
- Default times for new requests only: Earliest 09:00, Latest 17:00. Edit mode uses stored values verbatim (no overwrite).
- For `have_test`, only Earliest renders (maps to current `testTime` single-value behaviour).
- Invalid (Latest ≤ Earliest) → Latest gets red border and Save disables.

**Notes field** — keep as today, restyled with the same white hairline card pattern. Eyebrow label "Notes (optional)".

**Pupil selector** (instructor mode, new requests only) — keep as today, restyled to match the card pattern.

## Validation rules (unchanged logic, surfaced visually)
Save disabled when:
- Missing: type, test centre (id OR name), From date, From/Earliest time
- For `want_test`: missing To date or Latest time
- To < From, or Latest ≤ Earliest
- `submitting` true

All current toast errors and the existing `handleSubmit` Supabase update/insert + `queryClient.invalidateQueries` calls are kept verbatim.

## Components created/reused
- Reuse: `SegmentedControl`, `SectionLabel`, `SearchInput`, `IOSSheet`, existing `Calendar`/`Popover`, existing `Input type="time"`
- New: `TestCentrePicker.tsx` (shared, also reusable in future job-offer/lesson flows)
- New small helpers: `formatDateRange(from, to)` co-located in `src/components/test-requests/shared/formatSwap.ts` (file already exists)
- New: `FormInputCard` primitive in `src/components/instructor/ui/FormInputCard.tsx` for the white hairline tappable rows (date, time, test centre)

## Files touched
- `src/components/test-requests/TestRequestForm.tsx` — full restyle, behaviour preserved
- `src/pages/InstructorTestRequests.tsx` — drop `DialogHeader/Title`; let form render its own Cancel/Save header; pass `onCancel`
- `src/components/test-requests/TestRequestList.tsx` — same drop of DialogHeader for edit dialog
- `src/components/test-requests/PupilTestRequests.tsx` — same
- New: `src/components/instructor/ui/TestCentrePicker.tsx`
- New: `src/components/instructor/ui/FormInputCard.tsx`
- Update: `src/components/test-requests/shared/formatSwap.ts` (add `formatDateShort`, `formatDateRangeLabels`)

## Out of scope (explicitly NOT doing)
- No data model changes, no new fields
- No changes to date/time picker components themselves
- No auto-correction of legacy free-text test centre values
- No changes to save API contract, analytics events, or post-save navigation
- No reordering of sections; no new flexibility/preferred-instructor fields
