## Confirmed component filenames

| Section | File |
|---|---|
| Search results page | `src/pages/everydriver/CourseResults.tsx` |
| Top search bar | `src/components/courses/CourseSearchHeader.tsx` |
| Sidebar (calendar + filter chrome) | `src/components/courses/SidebarCalendar.tsx` |
| Results header (eyebrow / title / sort / view toggle / day heading / transmission tabs) | `src/components/courses/CourseGrid.tsx` |
| List-view row component | `src/components/everydriver/EDCourseList.tsx` |

The current list-view row used in the Drive 365 results is `EDCourseList`, rendered by `CourseGrid` when `viewMode === "list"`. `CourseRowCard.tsx` is **not** used here (it's the mini-website list) — leaving it untouched.

No other components, routes, hooks, or data layers will be modified. All search / filter / sort / calendar / pagination / click handlers remain intact.

## Scope

Desktop-only CSS + JSX-structure changes inside the five files above. Mobile branch in `CourseGrid` (the flip-card stack + Load More) is left as-is. Grid view and map view untouched.

## Section-by-section plan

### 1. `CourseSearchHeader.tsx` — top search bar
- Wrap header in `bg-[#0A2B6B] h-16 px-8 flex items-center gap-3`.
- Replace existing logo block with the DRIVE / 365 split badge (two `<span>`s with the specified colours, 13px / 800 / `px-2 py-1 rounded-[3px]`, `mr-4`).
- Wrap existing search fields in a white pill (`bg-white rounded-lg px-2 py-1.5 flex`).
- Each field group: `flex flex-col gap-0.5 px-2 border-r border-[#E5E7EB] last:border-r-0`, label `text-[9px] font-bold tracking-[0.08em] uppercase text-[#9CA3AF]`, value `text-[13px] font-medium text-[#0A0E27]`.
- Search button: `bg-[#D12E2E] text-white rounded-md px-5 py-2.5 text-[13px] font-bold` — keep `onSearch` handler.
- Filter tab bar (Weekly / Semi / Intensives, currently inside this component): `bg-white border-b border-[#E5E7EB] px-8 py-2.5`; "Filter:" label `text-[11px] text-[#9CA3AF] font-medium`; pills `px-3.5 py-1.5 rounded-full text-xs font-semibold border border-[#E5E7EB] text-[#4B5563] bg-white`; active state `bg-[#0A2B6B] text-white border-[#0A2B6B]`. Existing `activeFilter` / `setActiveFilter` props untouched.

### 2. `CourseResults.tsx` — page layout
- Replace the current `container` / `flex lg:flex-row` shell on desktop with `grid grid-cols-[260px_1fr] gap-0` (lg+). Mobile stays single-column.
- Drop horizontal container padding so the sidebar sits flush against viewport edges (matches the spec's "no gap, sidebar border-right divides them").

### 3. `SidebarCalendar.tsx` — sidebar chrome
- Container: `bg-white border-r border-[#E5E7EB] p-5 flex flex-col gap-5`.
- Section labels: `text-[10px] font-bold tracking-[0.1em] uppercase text-[#9CA3AF]`.
- Restyle the existing calendar grid (no behavioural changes to `onSelectDate`, `selectedDate`, `availableDates`):
  - Month header `text-[13px] font-semibold text-[#0A0E27]`.
  - Nav arrows 24×24 with `border border-[#E5E7EB] rounded text-[#6B7280]`.
  - Day labels `text-[9px] text-[#9CA3AF] font-semibold`.
  - Available days `text-[#0A0E27] font-medium hover:bg-[#EFF6FF]`.
  - Selected `bg-[#EFF6FF] text-[#0070C0] rounded-full font-bold`.
  - Today `bg-[#0A2B6B] text-white rounded-full font-bold`.
- Toggle groups (transmission / lesson times) and chip groups (skills / languages) restyled per spec; only visual classes change — existing toggle state and handlers stay.
- Add Pass Promise block + Matched-instructors list **only if those data sources already exist on this surface**. From inspection they don't currently render here, so they will be omitted (per "Do not create new data fields"). Will flag in a code comment so it's obvious where to slot them in if a later task wires the data.
- Section dividers: `h-px bg-[#F3F4F6]`.

### 4. `CourseGrid.tsx` — results header, transmission tabs, day heading
- Top block restructured into two halves:
  - Left: eyebrow `text-[10px] font-bold tracking-[0.1em] uppercase text-[#0070C0]` "Driving courses near"; title `text-[22px] font-extrabold text-[#0A0E27] tracking-[-0.5px]` (location name from `searchedAreaName` || `searchedPostcode`); inline detail `text-sm text-[#9CA3AF]` (postcode + nearest distance, both already available).
  - Right: sort button + list/grid toggle + Filters button restyled per spec. Existing `setSortBy` / `setViewMode` handlers preserved.
- Below the header: optional transmission pill row (only renders if the existing `setActiveFilter` prop is passed) — same handlers, new chip styling.
- Day heading: `text-[15px] font-bold text-[#0A0E27] mb-1`; course count `text-xs text-[#9CA3AF] mb-3.5`.

### 5. `EDCourseList.tsx` — course row card (main change)
Replace existing row JSX with the five-section card laid out via flex. All fields read from existing `EDCourse` shape — no new data.

```text
┌─┬────┬─────────────────────────────────┬───────────────┬─────────┐
│A│ B  │ C (course + instructor strip)   │ D (BNPL pills)│ E (£+CTA│
└─┴────┴─────────────────────────────────┴───────────────┴─────────┘
 5  64           flex-1                       160            110
```

- **A — Colour bar** `w-[5px] shrink-0` with bg derived from `hours` (10→#059669, 20→#0070C0, 30→#F59E0B, 40→#D12E2E, else #7C3AED).
- **B — Hours** `w-16 shrink-0 border-r border-[#F3F4F6] py-3 flex flex-col items-center justify-center`: number `text-[22px] font-extrabold text-[#0A0E27] leading-none`; "hours" label `text-[9px] font-semibold uppercase tracking-[0.05em] text-[#9CA3AF]`; "POPULAR" badge rendered only when `isPopular` truthy, per spec colours.
- **C — Details** `flex-1 min-w-0 px-3.5 py-3 flex flex-col justify-between`:
  - Top line: `"Intensive · Manual"` from `isIntensive` + `transmissionLabel(car_type)` — both already in props. `text-[13px] font-bold text-[#0A0E27]`.
  - Sub line: `Starts {format(bookableDate, "EEE d MMM")} · {areaName/postcode || home_postcode} · {distance.toFixed(1)} mi` — all exist. `text-[11px] text-[#9CA3AF]`.
  - Instructor strip: 28px avatar (photo if `profile_image_url` exists, else initials on `#1E4D9B`), name 12/600, "Drive 365 verified · {years} yrs" only when corresponding fields exist on instructor, star rating from existing rating data, pass-rate badge (`ml-auto`) **only if pass-rate value is present** on the instructor record.
  - Note: `EDCourse` currently exposes a minimal instructor shape (id, name, car_type, klarna/clearpay, hourly_rate). To surface verification / experience / rating / pass-rate, will widen the prop type and pass these from `CourseGrid` using the `CourseWithInstructor.instructor` data that's already fetched — no new queries. Any field still absent on a given row simply doesn't render (no placeholders).
- **D — BNPL pills** `w-40 shrink-0 border-l border-[#F3F4F6] p-3 flex flex-col justify-center gap-1.5`. Klarna pill always rendered when `klarna_enabled` and Clearpay when `clearpay_enabled` (existing gating preserved). Amounts: `Math.round(price / 3)` and `Math.round(price / 4)` from the row's resolved price (`discountedPrice ?? price ?? hourly_rate * hours`). Colours per spec.
- **E — Price + CTA** `w-[110px] shrink-0 border-l border-[#F3F4F6] p-3 flex flex-col items-end justify-center gap-2`. Price `text-[22px] font-extrabold text-[#0A0E27] tracking-[-0.5px] leading-none`. "View →" button `w-full bg-[#0070C0] text-white rounded-[7px] px-4 py-2 text-xs font-bold` wired to the existing navigate-to-booking handler.
- Card shell: `bg-white border border-[#E5E7EB] rounded-xl flex items-stretch overflow-hidden transition-[box-shadow,border-color] duration-150 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:border-[#0070C0] mb-2.5 cursor-pointer` — `onClick` unchanged.

## Guardrails

- No new tables, hooks, queries, or data fields. Any spec-mentioned signal whose data isn't already available will simply not render (verified-pro chip, pass-rate badge, popular badge, etc.).
- Mobile rendering untouched: list view on mobile keeps its current cards; new layout only activates at `lg:` (or wherever the desktop branch already lives).
- Grid view, map view, mini-website list (`CourseRowCard`), `Intensives` / `SemiIntensive` heroes — all left exactly as they are.
- All hex values used as Tailwind arbitrary classes (`bg-[#…]`, `text-[#…]`) because the spec mandates literal Drive 365 brand hexes on this one-off whitelabel surface, consistent with the existing `EDCourseList` comment about intentionally bypassing semantic tokens.
- `Math.round()` everywhere instalments are computed — never decimal pounds.

## Files touched

- `src/components/courses/CourseSearchHeader.tsx`
- `src/components/courses/SidebarCalendar.tsx`
- `src/components/courses/CourseGrid.tsx`
- `src/components/everydriver/EDCourseList.tsx`
- `src/pages/everydriver/CourseResults.tsx` (grid-shell only)

No other files, no migrations, no route changes.
