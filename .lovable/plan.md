## Problem

When a user on `drive365.co.uk` clicks the Test Swap banner (linking to `/test-swap`), the `DomainRouter` component redirects them to `everydriver.co.uk/test-swap` because `/test-swap` is not in the `LEARNER_ALLOWED_ROUTES` list.

## Fix

1. **Add `/test-swap` to `LEARNER_ALLOWED_ROUTES`** in `src/components/DomainRouter.tsx` (line 25) so Drive365 no longer redirects it.
2. **Add `/test-swap` to `everydriverRoutes.tsx`** so the route also resolves on EveryDriver domains (currently it would 404 there since only `publicRoutes` has it).

## Files to change

- `src/components/DomainRouter.tsx` — add `"/test-swap"` to `LEARNER_ALLOWED_ROUTES`
- `src/routes/everydriverRoutes.tsx` — add `const TestSwap = lazy(...)` and `<Route path="/test-swap" element={<TestSwap />} />`