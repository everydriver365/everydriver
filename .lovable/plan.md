

## Fix: Cardstream Hosted Fields SDK Loading and Error Recovery

### Root Cause

Two issues:

1. **`loadScript` race condition**: The function checks if a `<script>` tag with the given `src` already exists and immediately resolves. But during HMR or component re-mounts, the tag may exist while the script hasn't finished executing yet. So `window.jQuery` is undefined when checked.

2. **"Kicks you out"**: When the SDK init fails, the error toast fires but the component offers no recovery. The user likely taps back or the modal closes, triggering `navigate(-1)` back to `/instructor`.

### Fix

**File: `src/components/payments/CardstreamCheckout.tsx`**

1. **Fix `loadScript`** to wait for already-inserted scripts that haven't loaded yet, and also verify `window.jQuery` is actually available after loading (with a small poll/retry):

```typescript
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existing) {
      // Script tag exists — but is it loaded?
      if (existing.dataset.loaded === "true") return resolve();
      // Still loading — listen for it
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), { once: true });
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => { s.dataset.loaded = "true"; resolve(); };
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}
```

2. **Add a retry wait for `window.jQuery`** after scripts load — poll up to ~2 seconds before giving up:

```typescript
// After both loadScript calls
let attempts = 0;
while (!(window.jQuery || window.$)?.fn?.hostedForm && attempts < 20) {
  await new Promise(r => setTimeout(r, 100));
  attempts++;
}
```

3. **Add an error state with retry button** instead of just toasting and leaving the user stuck. Show a "Retry" button when SDK init fails, so the user isn't kicked out:

```typescript
const [sdkError, setSdkError] = useState(false);
// In catch: setSdkError(true) instead of just toast
// In render: show retry button when sdkError is true
```

### Files to modify
- `src/components/payments/CardstreamCheckout.tsx`

