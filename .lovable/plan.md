

## Plan: Split Routes into Domain-Specific Modules

The 450-line `App.tsx` has ~200 routes across 6 domains all in one file. This is the primary source of confusion. Splitting into separate route files makes each domain self-contained and easy to navigate.

### New Files

**1. `src/routes/publicRoutes.tsx`**
- Learner-facing routes: `/courses`, `/book/:id`, `/theory`, `/faqs`, `/news`, etc.
- Mini-website routes: `/i/:slug/*`
- Public utility routes: `/availability/:token`, `/sign/:token`, `/quote/:token`, `/pay/:id`
- Legal pages: `/privacy-policy`, `/terms-of-service`
- ~30 routes

**2. `src/routes/instructorPortalRoutes.tsx`**
- All `/instructor/*` routes (the authenticated portal)
- ~80 routes — the largest group

**3. `src/routes/instructorAppRoutes.tsx`**
- SaaS marketing pages: `/instructor-app/*`, `/driving-schools`
- Onboarding flow
- ~18 routes

**4. `src/routes/adminRoutes.tsx`**
- `/admin/login`, `/admin` (with ProtectedAdminRoute wrapper)
- 2 routes

**5. `src/routes/demoRoutes.tsx`**
- All `/demo/*` routes plus the inline demo routes under `/instructor/*` (schedule-design-demo, hero-redesign, etc.)
- ~30 routes — clearly separated so you can delete them later

### Modified File

**`src/App.tsx`** — Reduced from ~450 lines to ~50 lines:
```tsx
<Routes>
  <Route path="/" element={<ConditionalHome />} />
  <Route path="/drive365" element={<Index />} />
  {publicRoutes}
  {instructorPortalRoutes}
  {instructorAppRoutes}
  {adminRoutes}
  {demoRoutes}
  <Route path="*" element={<NotFound />} />
</Routes>
```

Each route file exports a `ReactNode[]` array of `<Route>` elements with their lazy imports co-located. No behavioral changes — just reorganization.

### Why This Helps
- Each file is focused on one domain (max ~80 routes instead of 200)
- Finding a route means opening the right file, not scrolling through 450 lines
- Demo routes are isolated and can be toggled with a single line
- Adding new routes to a domain is obvious — open the matching file

