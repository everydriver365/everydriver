

## Fix: Cardstream form submission

**Problem**: `instanceRef.current.submit()` fails because the SDK instance doesn't expose `.submit()`. The HTML form itself should be submitted — the Hosted Fields plugin intercepts the native form submit to tokenize card data before posting.

**Change**: In `src/components/payments/CardstreamEmbeddedCardForm.tsx`, update `handleSubmit` (~line 139):

Replace:
```ts
instanceRef.current.submit();
```
With:
```ts
formRef.current.submit();
```

Also update the guard to check `formRef.current` instead of `instanceRef.current`:
```ts
if (!formRef.current || submitting) return;
```

One-line fix, no other changes needed.

