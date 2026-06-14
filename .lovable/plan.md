## Arlo course creation spike

Throwaway, additive only. No DB writes, no existing files touched, no nav links.

### Step 1 — Secrets (you do this)
You'll be prompted to add three runtime secrets after the plan is approved:
- `ARLO_PLATFORM` — your Arlo subdomain (the part before `.arlo.co`)
- `ARLO_USERNAME` — Arlo API username
- `ARLO_PASSWORD` — Arlo API password

Nothing else proceeds until those three are saved.

### Step 2 — New edge function `arlo-spike-create-course`
File: `supabase/functions/arlo-spike-create-course/index.ts`

Behavior (exactly as you specified):
- Basic auth against `https://{platform}.arlo.co/api/2012-02-01/auth/resources`
- Step A: GET `/eventtemplates/` → grab first template href
- Step B: GET `/venues/` → grab first venue href
- Step C: GET `/presenters/` → grab first presenter href
- Step D: POST XML to `/events/` with code `ED-SPIKE-001`, location `Winchester`, status `Draft`, linked to template + presenter
- Step E: if event created (201), POST XML to `{eventHref}sessions/` with tomorrow 09:00–17:00 UTC, linked to venue + presenter
- Returns one big JSON `results` object with every status, body excerpt, parsed href, and a top-level `FINAL_RESULT` of `SUCCESS` / `PARTIAL` / `FAILED` / `ERROR`

Notes vs your snippet (small, non-behavioural):
- Use `Deno.serve` (the `std/http/server.ts` import is deprecated). Same handler, same output.
- Add CORS headers so the page can call it from the browser.
- No auth on the function (set `verify_jwt = false` in `supabase/config.toml` for this function only).

### Step 3 — New page `/arlo-spike`
Files:
- `src/pages/ArloSpike.tsx` — heading, subheading, "Run Arlo spike test" button, "Testing…" state, big bold `FINAL_RESULT` at top, full JSON in `<pre style="white-space: pre-wrap">`
- Route registered in the appropriate router file (likely `src/routes/everydriverRoutes.tsx` — confirmed at build time). Page is reachable only by typing the URL; no nav entry anywhere.

Calls the function via `supabase.functions.invoke('arlo-spike-create-course')`.

### Step 4 — Out of scope (will NOT touch)
- No changes to `instructor_courses`, `scheduled_lessons`, `pupils`, or any existing table
- No changes to existing components, hooks, routes, or styling
- No DB migration
- No memory updates
- No mobile layout changes

### Step 5 — After you run it
Paste the JSON back here. I'll read `FINAL_RESULT` + any non-200 steps and tell you what to fix in Arlo (usually: create an EventTemplate / Venue / Presenter in the Arlo dashboard).

### Technical detail
- Function deploys with `verify_jwt = false` via a small block added to `supabase/config.toml` (only that one function's block, no project-level changes).
- Tomorrow's session times sent as ISO UTC; Arlo accepts and stores in tenant timezone. Fine for a spike.
- Page does not gate on auth, so it works whether you're logged in or not.
