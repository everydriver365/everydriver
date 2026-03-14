

## Fix: Select Dropdown Hidden Behind Dialog

The pupil `Select` dropdown doesn't visually open because both the `Dialog` overlay and the `SelectContent` use `z-50`. The select portal renders behind the dialog overlay.

### Fix

**File: `src/components/instructor/TakePaymentModal.tsx`**

Add a higher z-index to both `SelectContent` instances (card entry and send link views):

```tsx
<SelectContent className="z-[200]">
```

This ensures the dropdown renders above the dialog overlay. Two occurrences to update (lines ~246 and ~331).

