

The user says the published site doesn't match the preview. They're on `/instructor-app/login` at 390px viewport. Tile redesign work was done recently. Likely cause: frontend changes require clicking "Publish → Update" to push to the live `.lovable.app` domain. Backend changes auto-deploy, frontend doesn't.

Let me also check if there's a route-level issue (e.g. `/instructor-app/login` vs published path).

## Why the published site looks different

In Lovable, **frontend changes don't auto-deploy**. Only backend changes (edge functions, database migrations) go live immediately. Everything visual — tile redesign, shadow tweaks, Course Planner page, route changes — sits in the preview until you push it.

### To sync the published site

1. Click **Publish** (top-right on desktop, or `...` → Publish on mobile)
2. In the dialog click **Update** (not just "view live")
3. Wait ~30s for the build, then hard-refresh `everydriver.lovable.app` (Cmd/Ctrl+Shift+R) to bypass cache

### What's currently un-published

Based on the last ~24h of work, these are sitting in preview only:
- Quick Access tile shadow softening
- Course Planner moved to `/instructor/course-planner` full-screen route
- Any `IOSTile` redesign tweaks
- Tile visual changes across instructor portal

### If it still looks wrong after publishing

Two other possible causes:
- **Browser cache** — hard-refresh, or test in an incognito window
- **Custom domain caching** — your custom domains (drive365.co.uk, drivingschoolmanager.co.uk, winchesterdrivingschool.co.uk, everydriver.co) sit behind their own DNS/CDN cache. The `.lovable.app` URL updates first; custom domains can lag a few minutes.

### What I need from you

Confirm one of:
- "I've clicked Update, still wrong" → I'll diff preview vs published and find the specific component that's off
- "I see a specific difference" → Tell me which tile/page and I'll investigate that component
- "Already published, custom domain is stale" → Wait 5 min and hard-refresh; if still stale I'll check the publish settings

No code changes needed yet — this is almost certainly the publish step.

