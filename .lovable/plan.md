
# Park Network Instructors + Add Out-of-Area Waitlist

Goal: stop the 5,796 `is_network_placeholder = true` rows from appearing on any public surface, replace them with a friendly "we don't cover your postcode yet — join the waitlist" experience, and preserve SEO via redirects.

## 1. Soft-park the placeholder rows (migration)

- Set `is_active = false` on every `instructors` row where `is_network_placeholder = true`.
- Add a partial index on `(home_postcode)` filtered to `is_network_placeholder = false AND is_active = true` to keep public searches fast.
- **No hard delete.** Rows stay so we can re-activate any area later when a real instructor onboards.

## 2. Filter them out everywhere public (code)

Add `.eq("is_network_placeholder", false)` (and where relevant `.eq("is_active", true)`) to every public-facing query. Audit and patch:

- `src/hooks/useFeaturedCourses.ts` (already done — verify)
- `src/hooks/useInstructorAvailabilitySearch.ts` — `public_instructors` query
- Course search / postcode search hooks (`src/components/home/PostcodeSearch.tsx` and downstream)
- Mini-website sitemap edge function `supabase/functions/mini-website-sitemap-index/index.ts` and the paginated `mini-website-sitemap`
- Any `/instructor/:slug` mini-site loader — return 404/redirect when the row is a placeholder

I'll grep `from("instructors")` and `from("public_instructors")` and patch every public call site in one sweep. Admin and the dedicated `NetworkInstructors` admin page remain unchanged.

## 3. Out-of-area waitlist UI

When a pupil searches a postcode and zero real instructors match:

- Render an `OutOfAreaWaitlistCard` instead of the empty grid:
  - Headline: "We're not in **[postcode area]** yet"
  - Sub: "Leave your details and we'll let you know the moment we cover your area."
  - Fields: name, email, phone (optional), postcode (pre-filled), what you're looking for (intensive / weekly / refresher).
  - Submit writes to existing `booking_enquiries` table with `source = 'out_of_area_waitlist'` and the postcode area.
  - Success state: "Thanks — we'll be in touch."
- Zod validation client + server-side; rate-limit via existing `auth_rate_limits` pattern (1 submission per email per hour).

Used by:
- Homepage `PostcodeSearch` no-results state
- `/courses?postcode=…` no-results state
- `WhitelabelAreaPage` is unaffected (those are curated brand areas).

## 4. SEO preservation

- **301 redirect** any `/instructor/network-*` slug → `/contact?postcode={area}&reason=out-of-area`. Implemented in the mini-site route loader (return `<Navigate>` with `replace`) plus a server-side redirect in the mini-site edge function for crawlers.
- **Sitemap**: update `mini-website-sitemap` count + page queries to filter `is_network_placeholder = false AND is_active = true`. Drops ~5,796 URLs.
- **robots.txt**: add `Disallow: /instructor/network-` as a belt-and-braces measure for any cached crawler queue.

## 5. Admin UX tweak

- `src/pages/admin/NetworkInstructors.tsx`: add a status badge ("Parked — hidden from public") and a "Re-activate" button next to "Promote" that flips `is_active = true` for that single row when a real instructor takes over the area.
- Add a small banner at the top: "Parked: 5,796 placeholders — invisible to pupils. Use Re-activate when onboarding a real instructor in this area."

## 6. Memory update

Replace the current `mem://constraints/network-placeholder-instructors` rule with: *"Network placeholders are soft-parked (`is_active=false`). All public queries must filter `is_network_placeholder = false`. Admin can re-activate per row. Out-of-area searches show the waitlist card writing to `booking_enquiries`."*

## Technical details

- Migration is a single `UPDATE instructors SET is_active = false WHERE is_network_placeholder = true;` plus the partial index — no schema changes.
- `booking_enquiries` already has the columns we need (name, email, phone, postcode, source, notes). No new table.
- Redirect at React Router level is enough for users; the edge-function redirect handles Googlebot fetching mini-site URLs directly.
- Files touched (approx): 1 migration, ~6 hook/component edits, 2 edge function edits, 1 new `OutOfAreaWaitlistCard.tsx`, 1 admin page edit, `robots.txt`, 1 memory file.

## Out of scope

- No change to whitelabel area pages or per-area landing SEO pages.
- No change to admin Instructors list (already filters placeholders).
- No change to mobile layouts (per project rule).
- No deletion of any data.
