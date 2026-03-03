

## Diagnosis: Preview Blank Page

The blank preview is caused by the Vite dev server returning **503 errors** on random module requests. Each page load attempt fails on different files (Intensives.tsx, CalendarConnect.tsx, useVehicleHealth.ts, PrivacyPolicy.tsx, etc.), which confirms this is **not a code syntax error** but rather the Vite dev server being overloaded or stuck.

### Evidence
- Vite connects successfully (`[vite] connected.`)
- No JavaScript runtime errors in the console
- 503s appear on different, unrelated files each attempt
- All recently edited files have been reviewed and are syntactically correct
- The 503 pattern is consistent with Vite transform pipeline failure under load

### Root Cause
This is a **transient dev server issue** common with very large codebases (340+ line App.tsx with 100+ route imports, all eagerly loaded). The project has an exceptionally large number of pages and components loaded synchronously.

### Fix Plan

1. **Immediate fix**: Add a trivial no-op change (e.g. add a comment) to `src/main.tsx` to force a Vite server restart and clear any stuck transform cache.

2. **Long-term improvement** (optional, prevents recurrence): Convert the heaviest page imports in `App.tsx` to lazy imports using `React.lazy()` and `Suspense`. This reduces the initial module graph Vite has to process. For example, the ~30 demo pages and rarely-visited pages could be lazy-loaded:

```tsx
const HeroLayoutDemo = React.lazy(() => import("./pages/HeroLayoutDemo"));
const CollageDemo = React.lazy(() => import("./pages/CollageDemo"));
// ... etc for all demo/rarely-used pages
```

Wrapped in a `<Suspense fallback={<div>Loading...</div>}>` around the `<Routes>`.

### Recommended Approach

Start with just the trivial file touch (step 1) to get the preview back. If the issue recurs, proceed with lazy loading (step 2) in a follow-up.

