## Scope
Mobile only (≤768px), on `/booking/:slug` with the Chapmans variant. Desktop layout untouched. All existing handlers, state, dropdown values, filter ids, geolocation, dictation and search triggers remain wired to the same props.

## Files
- `src/pages/PublicBookingPortal.tsx` — orange hero block (lines 129–140).
- `src/components/courses/CourseSearchHeader.tsx` — search card + filter tabs, `variant="chapmans"` branch (lines 67–474).
- `src/pages/Courses.tsx` — verified only as the pass-through that forwards `searchVariant="chapmans"` and the existing filter props; no edits needed.

No other files touched.

---

## 1. Hero — `PublicBookingPortal.tsx`

Replace the existing hero block with a Chapmans-specific mobile hero rendered only when `slug === "chapmans"`. For all other slugs the current hero stays exactly as-is. Desktop (`md:` and up) for Chapmans keeps the existing gradient/heading/description rendering — the new styles live inside a `md:hidden` wrapper.

Mobile hero structure (inside `md:hidden`):
- Container: `position: relative; overflow: hidden; padding: 16px 20px 32px; text-align: center; background: linear-gradient(160deg, #F07C2A 0%, #E8641A 50%, #D95A10 100%);`
- Two non-interactive decorative circles via absolutely-positioned `<span>`s (no pseudo-elements — Tailwind/inline styles only):
  - Top-right: 160×160, `rgba(255,255,255,0.06)`, `top:-40px; right:-40px; border-radius:9999px; pointer-events:none;`
  - Bottom-left: 120×120, `rgba(0,0,0,0.06)`, `bottom:-20px; left:-30px; border-radius:9999px; pointer-events:none;`
- Drive 365 inline lockup, centred, `margin-bottom: 14px`:
  - "DRIVE" pill: `background: rgba(0,0,0,0.25); color:#FFF; padding:3px 8px; border-radius:3px; font-weight:800; font-size:12px;`
  - "365" pill: `background:#FFF; color:#E8641A;` same sizing
  - 2px gap, inline-flex
- H1: literal copy `Find a course. Choose your instructor.` — `font-size:24px; font-weight:800; color:#FFF; letter-spacing:-0.5px; line-height:1.15; margin-bottom:8px;`
- Subheading: render `{page?.description || "See who's teaching you before you book — verified pass rates and real reviews."}` so dynamic copy still wins — `font-size:13px; color:rgba(255,255,255,0.8); line-height:1.5; max-width:280px; margin:0 auto 16px;`
- Trust pills row: flex, wrap, centred, gap 6px. Three literal pills:
  - `✓ Test swap free`
  - `✓ Klarna & Clearpay`
  - `✓ Re-test guarantee`
  Each: `background: rgba(0,0,0,0.18); border:1px solid rgba(255,255,255,0.2); border-radius:20px; padding:4px 10px; font-size:10px; font-weight:600; color:rgba(255,255,255,0.9);` with the tick in `color:#FFF; font-weight:700;`

The existing logo `<img>` is dropped on mobile (the DRIVE/365 lockup replaces it). Desktop still renders it.

---

## 2. Search card — `CourseSearchHeader.tsx` (chapmans branch)

The existing `isChapmans` form already holds Postcode / Radius / Transmission / Search and is used by both mobile and desktop. To keep desktop intact, we render two variants inside the `isChapmans` branch:
- `<div className="hidden md:block">` → existing form unchanged.
- `<div className="md:hidden">` → new mobile card described below.

Also, on mobile only:
- The outer `<section>` wrapper drops its `px-5 pt-3 pb-2` padding (use `md:px-5 md:pt-5 md:pb-3` + `px-0 pt-0 pb-0` on mobile) so the card can sit edge-to-edge with its own margins and overlap the hero.
- The outer search-card `<div>` (border + 20px padding + radius 4) is hidden on mobile (`hidden md:block` applied to that wrapper) — the new mobile card supplies its own chrome.
- The eyebrow + "Chapman's Driving School Courses" H1 block above the card is hidden on mobile (`hidden md:block`) — the new hero already names the school.

Mobile card markup:
- Wrapper: `background:#FFF; margin:-16px 16px 0; border-radius:14px; box-shadow:0 4px 24px rgba(0,0,0,0.12); overflow:hidden; position:relative; z-index:2;` (the negative top margin pulls it over the hero's bottom edge).
- Stacked field groups, each: `padding:12px 16px; border-bottom:1px solid #F3F4F6;`
  - Label row: `font-size:9px; font-weight:700; color:#9CA3AF; text-transform:uppercase; letter-spacing:0.8px; margin-bottom:6px; display:block;`
  - Value row: `display:flex; align-items:center; justify-content:space-between;`
  - Value text: `font-size:15px; font-weight:500; color:#0A0E27;` placeholder `#C4C9D4`
- **Postcode field** — label `POSTCODE`. Left = `MapPin` 14px `#C4C9D4` + `<PostcodeAutocomplete>` (same props as current, `placeholder="Enter postcode"`, `inputClassName` updated for 15px). Right = 40×40 button, `border-radius:10px; background:#F3F4F6; border:1px solid #E5E7EB;` containing the existing geolocation icon. The autocomplete keeps `showGeolocation` and `enableDictation` so its handlers still fire.
- **Radius field** — label `SEARCH RADIUS`. Reuses the existing native `<select value={radius} onChange={setRadius}>` with the current 5/10/15/20/30 options (no hardcoded value). Trailing `ChevronDown` on the right.
- **Transmission field** — label `TRANSMISSION`. Reuses the existing native `<select value={transmission} onChange={setTransmission}>` with the current Any/Manual/Automatic options. Trailing `ChevronDown`.
- **Search button** — sits below the last field, outside the card row but inside the same form so submit still runs `handleSearch`. `margin:14px 16px 16px; padding:14px; background:#E8641A; color:#FFF; border:none; border-radius:12px; font-size:15px; font-weight:700; width:calc(100% - 32px);` with `Search` icon left of label `Search courses`. Disabled state swaps to `Loader2` and keeps existing `isSearching` gating.

---

## 3. Filter tabs — `CourseSearchHeader.tsx` (mobile only)

Inside the `showFilters` block, render two variants:
- `<div className="hidden md:flex …">` → existing flex-wrap row unchanged (preserves "More filters" button and current desktop look).
- `<div className="md:hidden">` → new mobile row:
  - Wrapper: `padding:16px 16px 0;`
  - Label: literal `Filter by course type:` — `font-size:11px; color:#9CA3AF; font-weight:500; margin-bottom:10px;`
  - Track: `display:flex; gap:8px; overflow-x:auto; padding-bottom:14px;` with a one-off utility class (added inline via a `<style>` tag at the top of the component, or via `className` + a small `style` rule using `scrollbarWidth:'none'` inline and a `before` no — simplest: inline `style={{ scrollbarWidth:'none' }}` plus a tiny `<style>{`.chapmans-tabs::-webkit-scrollbar{display:none}`}</style>` adjacent). Tabs render from the existing `FILTER_OPTIONS` array — no hardcoded labels.
  - Each tab: `padding:7px 16px; border-radius:20px; font-size:12px; font-weight:600; white-space:nowrap; flex-shrink:0;`
    - Inactive: `background:#FFF; border:1px solid #E5E7EB; color:#4B5563;`
    - Active: `background:#E8641A; color:#FFF; border:1px solid #E8641A;`
  - `onClick` and `data-active` keep using the existing `setActiveFilter` + `activeFilter` props — no behaviour change.
  - "More filters" button is not rendered in the mobile row (desktop keeps it).

---

## Constraints honoured
- All gating wrapped in `md:hidden` / `hidden md:block` so the desktop chapmans layout is byte-identical to today.
- No new state, no new props, no new handlers — `postcode`, `radius`, `transmission`, `activeFilter`, `onSearch`, geolocation, dictation, `isSearching` all reused.
- Filter labels come from `FILTER_OPTIONS`; radius/transmission values come from current `<select>` options.
- Subheading uses the dynamic `page?.description` first and only falls back to the prescribed copy when empty.
- Light mode only; no dark-mode tokens added.
- Touches only the three files named above.

## Verification
Reload `/booking/chapmans` at 390×844: hero is the new compact orange band with Drive 365 lockup, headline, subheading and three trust pills; the white search card overlaps its bottom edge, fields stack full-width, the orange `Search courses` button sits below, and the filter row scrolls horizontally with the active tab in orange. Switch to 1280px and confirm the existing desktop layout (eyebrow, "Chapman's Driving School Courses" title, single-row search, wrap filter row, "More filters") is unchanged.
