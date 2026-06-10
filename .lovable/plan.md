## Publish to refresh production bundle

The source code for `CourseGrid.tsx` and `useCourseDiscovery.ts` is already correct (no `useMemo` wrapping JSX, no `selectedDate` gate). The live bug only exists in the stale published bundle. The fix is a republish.

### Steps
1. Preflight: confirm site title, meta description, OG/Twitter tags, favicon are already relevant (no changes needed — this is a republish of an existing live app).
2. Call `preview_ui--publish` to produce a new bundle hash and ship the current source to production.
3. Report the new live URL and remind the user that wrapped/PWA clients will auto-refresh via the existing `bundleRefresh` logic on next resume.

### Not doing
- No source edits (already verified clean).
- No migration for `user_roles` RLS (policy already exists; admin login confirmed working in auth logs).
