

## Two fixes for the Course Planner

### 1. Allow booking lessons (the real blocker)

When opened from the instructor app's quick-access tile, no pupil is attached, so the "Book all lessons" button is hidden and any attempt errors with *"Open the planner from a pupil to book lessons directly"*.

Fix: add an inline **pupil picker** at the top of the planner when `mode === "instructor"` and no `defaultPupilId` was passed.

- New section "Pupil" with a searchable Combobox (same pattern already used for test centres) listing the instructor's active pupils (`pupils` table filtered by `instructor_id`, ordered by name).
- Selecting a pupil sets local `selectedPupilId` + `selectedPupilName`, prefills the name field, and unlocks the green **"Book all N lessons into diary"** button on the result step.
- "Book all" uses `selectedPupilId ?? defaultPupilId`. Same for the proposal `pupil_id`.
- If still no pupil chosen when they hit Generate, that's fine — they can still save as draft. Booking just stays disabled with helper text *"Pick a pupil to enable direct booking"*.

### 2. Mobile layout fixes

At 390×495 the sheet (`h-[92vh]` ≈ 455px) cuts off the form and the action buttons get stuck below the fold inside an inner `ScrollArea`.

Changes to `CoursePlannerSheet.tsx`:

- **Sheet height**: switch to `h-[100dvh] max-h-[100dvh]` with safe-area padding, so it uses the full mobile viewport reliably (dvh handles iOS URL-bar resize).
- **Sticky footer**: lift the primary action buttons (`Generate plan` on form step, `Book all / Save draft / Revise` on result step) **out of** the `ScrollArea` into a sticky bottom bar inside the sheet — `border-t bg-card px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]`. They're always tappable.
- **Replace ScrollArea with native scroll** on mobile (`overflow-y-auto overscroll-contain`) — the Radix ScrollArea inside flex columns has known measurement bugs in embedded webviews and is what's causing the form to look "broken".
- **Responsive grids**: 
  - "Hours / Lesson length / Per week" → `grid-cols-1 sm:grid-cols-3` so each control gets full width on mobile.
  - "Date / Time" → keep `grid-cols-2` but ensure the date button truncates with `truncate` and uses shorter format `d MMM` on `<sm`.
- **Availability rows**: on narrow widths the two time inputs + switch + label overflow. Tighten with `text-xs`, `h-9`, and allow the time inputs to shrink (`min-w-0`).
- **Calendar ref warning** (visible in console) — wrap the `Calendar` component export in `React.forwardRef` so Radix Popover's ref-forwarding stops warning. Quick stability fix.

### Files touched

- `src/components/course-planner/CoursePlannerSheet.tsx` — pupil picker section, sticky footer, mobile grid tweaks, dvh height.
- `src/components/ui/calendar.tsx` — wrap in `forwardRef` to silence the warning.

### Outcome

- From any pupil-less entry point (instructor home tile), users can pick a pupil inside the planner and book the whole course straight into the diary.
- Sheet fills the screen, scrolls smoothly, and the Book/Save buttons are always reachable on a 390-wide phone.

