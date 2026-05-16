## Goal

Bring `/courses` (Drive 365 search results page) into colour alignment with the new white home page. Desktop only. Course cards and overall layout stay exactly as-is.

The header is already the reusable `Drive365Header` (white on desktop) — no work needed there beyond visual confirmation.

## Files to edit

1. `src/components/courses/CourseSearchHeader.tsx` — heading area, search bar, search button, filter pills
2. `src/pages/Courses.tsx` — "Showing results for" banner, sort/view toggle row
3. `src/components/courses/SidebarCalendar.tsx` — available/selected day colours and legend

(Instructors Nearby panel already uses neutral white/card tokens — will spot-check and only adjust if it visibly clashes. Orange status dot stays.)

## Token mapping (applied via inline styles to match existing pattern in these files)

```text
brand blue        #2D3FE7
brand blue hover  #1F2DC9
pale blue tint    #EAF0FF
pale blue hover   #D6DFFF
ink               #0A0A0A
muted grey        #9CA3AF
secondary text    #4B5563
hairline border   #E5E7EB / #EAF0FF
```

## Changes

### 1. `CourseSearchHeader.tsx`
- Update `tokens` object: `navy → #0A0A0A`, `blue → #2D3FE7`, `red → #2D3FE7`, `muted → #9CA3AF`, `border → #EAF0FF`. Leave `mid` for secondary text but replace usages on pills with `#0A0A0A`.
- Eyebrow "Driving courses": colour `#9CA3AF`, keep small accent bar but recolour to `#2D3FE7`.
- Title: colour `#0A0A0A`, size `32px`, weight `700`, `marginTop: 8px` from eyebrow.
- Search button: background `#2D3FE7`, hover `#1F2DC9`, radius `2px`, padding `14px 28px`.
- Filter pills:
  - Active: bg `#2D3FE7`, text white.
  - Inactive: bg white, border `#E5E7EB`, text `#0A0A0A`; hover border + text `#2D3FE7`.
  - Padding `8px 16px`, radius `20px`.

### 2. `Courses.tsx`
- "Showing results for" banner (≈ line 1484): change container to `bg-[#EAF0FF] border border-[#2D3FE7]/20`, drop emerald classes. Icon circle bg `#2D3FE7`. Label text `#4B5563`. Heading `#0A0A0A`. Clear button: white bg, `1px solid #E5E7EB`, text `#0A0A0A`, hover border `#2D3FE7`.
- Sort/view toggle group (lines ~1529–1615): replace `#0a1936` active backgrounds with `#2D3FE7`, inactive text `#0A0A0A`, container border `#E5E7EB`. Applies to All/Manual/Automatic, List/Grid, and any other toggle using `#0a1936`.
- Date heading (`format(selectedDate…)`): colour `#0A0A0A`, size `18px`, weight `700`. Subtitle "X courses available": `#4B5563`, `13px`.
- Grep for any remaining `#0a1936`, `bg-emerald`, `text-emerald` within the desktop (non-mobile) branches of this page and swap to the new palette. Skip course-card components entirely.

### 3. `SidebarCalendar.tsx`
- Available days: replace `bg-emerald-500/20 text-emerald-700 hover:bg-emerald-500/30` with inline `background: #EAF0FF`, `color: #0A0A0A`, `hover: #D6DFFF`, radius `4px`.
- Selected day: replace `bg-primary text-primary-foreground` with `background: #2D3FE7`, `color: #fff`.
- Weekday header text colour `#9CA3AF`.
- Legend swatches: "Available" → `#EAF0FF`, "Selected" → `#2D3FE7`, label text `#4B5563`.

### 4. Instructors Nearby panel
- Verify it already renders on a white card with neutral text. If a navy heading or accent is present, swap heading to `#0A0A0A` and any accent to `#2D3FE7`. Status dot stays `#F59E0B`.

## Out of scope (explicitly untouched)

- Mobile breakpoints (anything inside `isMobile` branches / `lg:` overrides for small screens).
- Course card components (`CourseRowCard`, `CourseGrid`, `MobileCourseCard`, `CourseTableList`) — ribbons, tags, pricing all stay.
- Home page, instructor profile, booking flow, other routes.
- `Drive365Header` (already done in a previous turn).

## Verification

- After edits, load `/courses?postcode=SO302TD` in the preview at desktop width and confirm: white header, blue search button, blue active pills, pale-blue results banner, blue selected calendar day, pale-blue available days, no mint green or red remaining in the chrome.
