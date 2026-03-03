

## Diagnosis: Persistent Blank Preview

The previous fix lazy-loaded ~28 demo pages, but there are still **~90 eager imports** at the top of `App.tsx`. This is still too many synchronous modules for Vite to transform at once, causing 503s.

## Plan: Aggressive Lazy Loading

Convert **all** page imports to `React.lazy()` except the absolute minimum needed for first render (`ConditionalHome` dependencies and critical shared components). This means:

**Keep eager (needed immediately):**
- UI providers, layout components, auth contexts (~10 imports)
- `Index`, `HomepageRedesignDemo`, `MiniWebsiteHome` (used by `ConditionalHome`)
- `NotFound` (catch-all)

**Convert to lazy (~80 imports):**
- All `/instructor/*` pages (~50 imports)
- All `/instructor-app/*` pages (~15 imports)  
- All mini-website sub-pages, pupil/parent portals
- All utility pages (Theory, FAQs, Help, Privacy, etc.)
- The already-lazy demo pages stay lazy

This reduces Vite's initial transform workload from ~120 modules to ~15, which should permanently fix the 503 overload.

### Implementation
Single file change: `src/App.tsx` -- move all page `import` statements (lines 3-4, 17-121) to `lazy()` declarations, keeping only the handful needed by `ConditionalHome` and the app shell as eager imports.

