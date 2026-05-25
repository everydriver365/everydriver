## Dead code cleanup — 12 batches

Deletion-only sweep. Every file gets a final `rg` import check before removal. Any file with even one import is skipped and reported. Build verified after each batch; stop on first failure.

### Batch 1 — Orphan admin components (14 files)
`src/components/admin/`: HomepageFeaturesManager, HomepageHeroManager, HomepageSectionsManager, HomepageStatsManager, HomepageTestimonialsManager, IncludedFeaturesManager, InstructorAppFeaturesManager, OnboardingWizardManager, CourseTemplateManager, AdminEmailPanel, AdminSidebar, AdminDesktopSidebar, RecentPaymentsWidget, SOSAlertsPanel.

### Batch 2 — Orphan marketing sections (6 files)
`src/components/instructor-features/`: ComparisonSection, ExtraFeatures, FeatureCategorySection, FeatureHero, ProductShowcase, StatsBar.

### Batch 3 — Orphan money subfolder (7 files)
Delete entire `src/components/instructor/money/`.

### Batch 4 — Unused shadcn primitives (4 files)
`src/components/ui/`: hover-card, menubar, navigation-menu, toggle-group.

### Batch 5 — Orphan custom UI primitives (8 files)
`src/components/ui/`: AnimatedRoutes, BounceBadge, CollapsibleLargeTitle, DrawCheckmark, HapticContextMenu, QuickActionCircle, ThemeIllustration, skeletons/FinanceSkeleton.

### Batch 6 — Orphan pages with no route (17 files)
Pages listed in cleanup prompt under `src/pages/`, `src/pages/pupil/`, `src/pages/public/`, `src/pages/school-website/`, `src/pages/instructor/`.

### Batch 7 — Entire onboarding flow
Delete `src/pages/instructor-app/onboarding/` directory.

### Batch 8 — Unused desktop instructor-app pages (10 files)
All `*Desktop.tsx` + `InstructorAppHome`, `EveryDriverInstructorHome`, `InstructorProfileRouter`.

### Batch 9 — Orphan hooks (12 files)
`src/hooks/`: useAdminDashboardStats, useCancellationRequests, useFuelLog, useGPSAutoReconnect, useHeroVideo, useOfflineData, useOfflineGPSQueue, useOfflineMutation, usePremiumPlacement, useProfitAnalysis, useSkeletonMorph, useWaitlistMatching.

### Batch 10 — Unused npm packages
Remove `@capacitor-community/contacts`, `@capacitor/preferences`, `@react-leaflet/core`, `phosphor-react` via `bun remove`.

### Batch 11 — Admin-gate lab/demo routes
Inspect `src/routes/demoRoutes.tsx` (and any other lab routes). Wrap each `<Route>` element with the existing `ProtectedAdminRoute` guard. Non-admin visitors redirect to `/admin/login` (same behaviour as other admin routes). No deletions.

### Batch 12 — Strip console.logs
Remove only `console.log(...)` lines (preserve `console.error` / `console.warn`) from:
- `src/components/booking/KlarnaExpressButton.tsx`
- `src/components/DomainRouter.tsx` *(corrected path — file is in components/, not pages/)*
- `src/components/PostcodeAutocomplete.tsx`
- `src/pages/InstructorLiveSession.tsx`
- `src/lib/backgroundSync.ts`
- `src/pages/InstructorDocumentTemplates.tsx`

### Explicitly NOT touched
- `instructor/ui/PortalButton|PortalCard|SettingsRow` — flagged for design-system investigation, not deletion.
- All edge functions — cron schedules not yet verified.
- `LiveTrackingMap`, `GoogleLiveTrackingMap`, `WhatsAppInbox`, `WhatsAppBadge`, duplicate lesson cards / payment modals, `window.location` call sites — need individual review.

### Verification protocol per batch
1. For each path: `rg -l --fixed-strings "<basename>" -g '!<self>'` across `src/` and `supabase/functions/`. Skip + report if any hit.
2. Delete confirmed-orphan files (`rm`).
3. Wait for harness build; if errors, restore the offending file from git and report.
4. Report: deleted / skipped (with reason) / build status.

### Risks
- Basename matching can miss dynamic imports built from string concatenation. Mitigation: per-file `rg` check uses fixed-string match on the component/hook name; failures roll back via the harness build.
- Removing packages may break files we didn't think were importing them. Mitigation: build runs after Batch 10; restore from `package.json` history if it breaks.
- Some "orphan pages" may be linked from CMS-stored strings in the DB (not the codebase). Acceptable risk — they'll 404, easy to restore.

Estimated impact: ~80 files removed, 4 packages removed, lab routes gated, ~50 `console.log` lines stripped. No behaviour change for end users.
