

## Fix: Card payment iframe form submission fails silently

### Root Cause

The `CardstreamPayButton` component has two separate `<form ref={formRef}>` elements — one in the `showIframe=false` branch (line 197) and one in the `showIframe=true` branch (line 176). Here's what happens:

1. `handlePay` captures `const form = formRef.current` — this is the form from the **non-iframe** render
2. It populates this form with action, method, target, and hidden inputs
3. It calls `setShowIframe(true)` — React re-renders, **unmounting the old form** and mounting a new empty one
4. `requestAnimationFrame(() => form.submit())` fires — but `form` points to the **old detached DOM element** that's no longer in the document
5. Submitting a detached form does nothing — the iframe stays blank

### Fix

**File: `src/components/payments/CardstreamPayButton.tsx`**

Store the gateway URL and form data in state. Use a `useEffect` to populate and submit the form **after** the iframe has rendered and the new form ref is live.

```text
1. Add state: formPayload = { gatewayUrl, formData } | null
2. In handlePay: instead of populating the form directly, save the payload to state, then setShowIframe(true)
3. Add useEffect: when showIframe && formPayload && formRef.current → populate form, submit, clear payload
```

This ensures the form is populated and submitted only after React has mounted the iframe and the new form element.

### Scope
- Single file change: `src/components/payments/CardstreamPayButton.tsx`
- No other files affected

