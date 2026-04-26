## Goal

Redesign `src/pages/InstructorJobs.tsx` (Available Jobs) to a calm, premium tile-style mobile layout with **inline Accept / Decline buttons** on each card. The whole card body remains tappable to open the existing detail sheet — only the action buttons short-circuit propagation and route into confirmation dialogs.

All current behaviour is preserved: same Supabase fetch (`course_enquiries` where status=pending), same accept logic (update enquiry + insert pupil), same decline logic, same toast feedback, same distance computation via `geocode-postcode`, same detail Sheet.

## Page chrome

- Background `#F2F2F4`, padding `16px`, vertical section gap `12px`.
- Keep `InstructorPortalLayout` wrapper.

## Header card (replaces current heavy header)

White card, radius 12, padding 16, horizontal flex:
- 40×40 rounded-10 tile in `#F1ECFA` with line-style `Briefcase` icon (22px, `#8A5BC9`).
- Eyebrow "OPPORTUNITIES" (11px, `#6E6E73`, uppercase, 0.3px tracking) + title "Available jobs" (17px, weight 500, `#000`, sentence case).
- Right pill `#F1ECFA` with `#8A5BC9` text — `"{n} new"`. Hidden when `jobs.length === 0`.

## Offer card — `JobOfferCard`

New component `src/components/instructor/JobOfferCard.tsx`. Container: white, 0.5px `#E5E5EA` border, radius 12, overflow hidden. Stacked with 10px gap.

**Top section (tappable body)** — `padding: 14px 14px 12px`, click handler opens existing detail Sheet.
- Top row:
  - Pupil avatar (36px circle, deterministic colour from new `<UserAvatar>` based on `name` hash, white initials, weight 500).
  - Name (15px, weight 500, `#000`) + lesson type (12px, `#6E6E73`, sentence case via `toSentenceCase` helper).
  - Right hours pill `{n}h` in `#F1ECFA` / `#8A5BC9`.
- Meta row: top-border 0.5px `#E5E5EA`, padding-top 10, three `<MetaItem>` separated by 3px grey bullets:
  1. Location pin → formatted UK postcode (`formatUkPostcode("SO302TD") → "SO30 2TD"`).
  2. Distance → `"2.3 mi"` if ≥ 0.5; **hide entirely** when distance is null/undefined/zero/<0.5 (no "0.0 mi", no "—"). (Same-town "Nearby" path requires data we don't currently have, so we omit rather than fake it.)
  3. Clock → human timing via `formatTiming()`: `"this-week"→"This week"`, `"next-week"→"Next week"`, `"asap"/"urgent"→"Starts ASAP"` (rendered in `#C8434F`), specific date strings → `"From 5 May"`. Falls back to a Title-cased version of the raw value.

**Action row (new)** — top border 0.5px `#E5E5EA`, grid `1fr auto 1fr` with a 0.5px vertical divider in the middle column:
- Decline (left): X icon + "Decline" in `#6E6E73`, padding 12, transparent.
- Accept (right): Check icon + "Accept" in `#2B7BC8`, padding 12, transparent.
- Both handlers call `e.stopPropagation()` then open a shadcn `AlertDialog`:
  - Decline dialog: title "Decline this offer?" + Cancel / Decline (red destructive button) → routes into existing `handleDeclineJob`.
  - Accept dialog: title "Accept this offer?" + summary line (pupil · `{n}h` · lesson type · postcode · timing) + Cancel / Accept → routes into existing `handleAcceptJob`.
- After confirmation, the card animates out (Framer Motion `AnimatePresence` with a 180ms fade+slide), reusing existing state mutation (`setJobs(filter ...)`).

## Empty state — `EmptyState`

New `src/components/instructor/EmptyState.tsx` (generic, reusable). 32px vertical padding, 48×48 `#F1ECFA` rounded square with purple briefcase icon, title "No new opportunities", subtitle "Check back soon — new offers come in regularly". Accepts `icon`, `title`, `subtitle` props.

## Shared helpers (new)

- `src/components/instructor/UserAvatar.tsx` — 36px (configurable) avatar; deterministic HSL from `djb2` string hash → palette of system-friendly colours; renders white initials. Optional `photoUrl` override.
- `src/lib/formatJobOffer.ts` — exports `formatUkPostcode`, `formatTiming` (returns `{ label, urgent }`), `toSentenceCase`, `formatDistanceMiles`.
- `src/components/instructor/MetaItem.tsx` — small icon + label pair, gap 5, label `#6E6E73`, accepts an `urgent` prop to switch label colour to `#C8434F`.

## Preserved behaviour

- Tap card → opens existing `Sheet` detail view (unchanged content/layout).
- Accept and Decline use existing Supabase calls, toasts, list mutation.
- Distance still computed via `geocode-postcode`, same Haversine logic.
- `InstructorPortalLayout`, auth guard, loading state preserved.
- No data shape, schema or API change.
- Detail Sheet content untouched (separate scope as you noted).

## Removed / fixed

- "Available Jobs" Title Case → "Available jobs".
- Decorative grey briefcase header block → replaced with purple-tinted card.
- ChevronRight expand affordance.
- Bold weights (`font-semibold` → 500), drop shadows, non-system colours.
- "0.0 mi" fallback — now hidden.
- Postcode without spaces — formatted on render.
- Kebab-case timing strings — formatted on render.

## Out of scope

- Detail Sheet redesign.
- Adding push/realtime if absent today (current page just refetches once on mount; we keep that).
- Swipe gestures, Maybe / Counter-offer states.

## Files

- Edit: `src/pages/InstructorJobs.tsx`
- Add:  `src/components/instructor/JobOfferCard.tsx`
- Add:  `src/components/instructor/UserAvatar.tsx`
- Add:  `src/components/instructor/MetaItem.tsx`
- Add:  `src/components/instructor/EmptyState.tsx`
- Add:  `src/lib/formatJobOffer.ts`
