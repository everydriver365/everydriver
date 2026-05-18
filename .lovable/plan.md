# Smoke tests for instructor V3 settings slugs

## Goal
Automated test that, for every V3 sidebar slug, confirms `SettingsShellV3` resolves it to the correct `AreaItem` (title + breadcrumb group) and renders its detail view without throwing — catching the "Profile fallback" / "complete mess" class of bug.

## Approach
Unit-level React test with `@testing-library/react` rendered against `<MemoryRouter initialEntries={["/instructor/settings/<slug>"]}>`. Avoids the full portal shell (which pulls live Supabase data) by mounting `SettingsShellV3` directly inside a `Routes` config matching `/instructor/settings/:categoryId`.

For each `id` in `ALL_ITEM_IDS` plus every key in `LEGACY_ID_MAP`:
1. Render shell at that slug.
2. Assert the rendered breadcrumb / heading equals `activeItem.title` (and group label) — proves resolution worked.
3. Assert the detail container exists (no crash, no landing-grid fallback).
4. Assert no React error boundary fired (catch via `console.error` spy).

Section editors inside the detail view hit Supabase via `useInstructorAuth` + react-query. Mock both at the test boundary:
- `@/context/InstructorAuthContext` → returns a fake instructor id.
- `@/integrations/supabase/client` → minimal stub that returns empty data for any `.from(...).select(...)` chain, so editors render their loading/empty state without network.
- `@tanstack/react-query` → wrap in a `QueryClientProvider` with retry disabled.

## Files added
- `src/test/setup.ts` — add `@testing-library/jest-dom`, `matchMedia` polyfill (currently empty/missing).
- `src/test/mocks/supabase.ts` — chainable stub returning `{ data: null, error: null }`.
- `src/components/instructor/settings/v3/__tests__/SettingsShellV3.slugs.test.tsx` — the parametrized test.
- Update `vitest.config.ts`: switch `environment` from `node` to `jsdom`, add `setupFiles: ["./src/test/setup.ts"]`.

## Dependencies to install (devDependencies)
- `@testing-library/react`
- `@testing-library/jest-dom`
- `jsdom`
- `@vitejs/plugin-react-swc` (already in project; reuse for the test transform)

## Out of scope
- Mobile drill-down (different component, separate sweep).
- Admin / School portals.
- E2E browser tests (Playwright) — overkill for the routing assertion.
- Asserting actual save persistence (would need full Supabase mock harness).

## Deliverable
`bunx vitest run` produces one passing test per slug (~24), each failing loudly if a future change breaks resolution or detail rendering.
