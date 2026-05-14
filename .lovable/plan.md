# Lesson scheduler visual polish

Pure CSS/styling pass on `src/components/booking/LessonScheduler.tsx`. No layout, structure, prop, or logic changes.

## Changes

### Calendar (workspace card, left)
- Add `pl-1.5 pr-1.5` inset around the calendar block (issue 6).
- `head_cell`: render single-letter labels via `formatters={{ formatWeekdayName: (d) => format(d, "EEEEE") }}` and style `text-[10px] font-semibold normal-case text-[#9CA3AF]` (issue 8).
- Cell base `day` class reset to weight 400, colour `#D1D5DB`, no bg, `cursor-default` (past/unavailable default — issue 1).
- Replace `modifiersClassNames` with explicit hex states using `!important` to beat shadcn defaults:
  - `available`: `!bg-[#E8F5EE] !text-[#0F6E56] !font-semibold cursor-pointer hover:!bg-[#DCEFE3]`
  - `hasLesson`: `!bg-[#F0F4FB] !text-[#0A2B6B] !font-semibold relative` + `after:content-[''] after:absolute after:left-1/2 after:-translate-x-1/2 after:bottom-[2px] after:h-1 after:w-1 after:rounded-full after:bg-[#0A2B6B]` (issue 1, dot fix).
  - `selected` (via `day_selected` classNames override): `!bg-[#0A2B6B] !text-white !font-semibold` — must come last in modifier order so it wins over `available`/`hasLesson`.
- Disabled state: `day_disabled: "!text-[#D1D5DB] !bg-transparent !font-normal cursor-default hover:!bg-transparent"`.

### Legend (issue 7)
- Replace `rounded-full` dots with `h-2.5 w-2.5 rounded-[3px]` swatches in `#E8F5EE`, `#F0F4FB` (with the navy dot inside for "Has lesson"), and `#0A2B6B`.

### Toolbar (issue 5)
- Bump month label to `text-[16px] font-bold`.
- Add `border-b border-[#E5E7EB] pb-3 mb-3` under the toolbar row to define the space.

### Workspace card (issue 9)
- Change `p-4` → `p-[18px]`.

### Time slots column (issue 4)
- Drop `min-h-[280px]` to `min-h-0`.
- Empty state: 28px `CalendarDays` in `text-[#D1D5DB]`, `text-[13px] text-muted-foreground` below, stacked, vertically aligned to top with `pt-6`, total block ≈100px. Replace the current `h-full min-h-[260px] flex items-center justify-center`.

### Scheduled lessons card (issues 2, 3, 9)
- Card: `bg-white border border-[#E5E7EB] p-4` (16px). Force white over any `bg-card` token.
- Lesson row:
  - `bg-[#F9FAFB]` (replace `bg-muted/60`)
  - `rounded-lg p-2.5 mb-1.5` (10px / 6px)
  - Number badge: `h-[22px] w-[22px] rounded-md bg-[#0A2B6B] text-white text-[11px] font-bold`.
  - Date/time text: `text-[#0A2B6B]`.
  - Metadata text: `text-[#6B7280]`.
  - × button: `text-[#9CA3AF] hover:text-[#E63946]`.

### Workspace card background
- Keep `bg-white border border-[#E5E7EB]` consistent with lessons card so both sit on the page-grey background.

## Files touched
- `src/components/booking/LessonScheduler.tsx` only.

## Verification
- Reload `/book/c9843b58…?hours=10&date=2026-06-02`, click a date, confirm the three states are visually distinct, the navy dot renders on has-lesson days, the lessons card is white and rows are pale.
