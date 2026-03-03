

## Diagnosis

The `lazyWithRetry` utility retries the `import()` call 3 times, but the Vite dev server returns persistent 503s for certain modules (not transient). When all retries fail, the error propagates to the `AppErrorBoundary` which shows the crash screen. The user must manually reload, but the same module often fails again.

The core issue: after all retries exhaust, there is no graceful recovery path -- the error boundary catches it and the app is dead until a full page reload clears Vite's stuck transform pipeline.

## Plan: App-wide Lazy Import Hardening

Two changes to make the app resilient:

### 1. Upgrade `lazyWithRetry` to force-reload on final failure

When all 3 retries fail, instead of throwing (which crashes the app), do a single automatic page reload with a sessionStorage guard to prevent infinite reload loops.

**File:** `src/utils/lazyWithRetry.ts`

```typescript
// After all retries exhausted:
// 1. Check sessionStorage for a "reloaded" flag with the module path
// 2. If not set: set the flag and call window.location.reload()
// 3. If already set: clear the flag and throw (to show error boundary)
```

This gives one automatic recovery attempt per failed module before falling back to the error screen.

### 2. Add per-route error boundary via Suspense fallback improvement

**File:** `src/App.tsx`

Wrap the `<Suspense>` fallback to show a loading spinner instead of an empty div, so users see feedback during retries rather than a blank screen.

### Summary

- **Files changed:** 2 (`lazyWithRetry.ts`, `App.tsx`)
- **Risk:** Very low -- only changes error recovery behavior, no functional changes
- **Effect:** Failed module imports auto-reload once, preventing the crash screen in most cases

