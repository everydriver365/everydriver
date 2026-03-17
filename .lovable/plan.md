
Problem identified:
- The SDK is loading, but the integration is using the wrong API shape.
- `window.hostedFields.classes.Forms` is not a valid constructor in this SDK build.
- The SDK is built as a jQuery plugin around the `hostedform` namespace, not as a direct `new ...Forms(...)` class API.
- The current form markup is also mismatched: the SDK auto-setup scans `INPUT` elements (`type="hostedfield:..."` / `data-hostedfield`), but the component currently renders `div` placeholders.
- That is why the form immediately flips from “Loading secure form…” to “Failed to load payment SDK”.

What I would change:
1. Rebuild `CardstreamEmbeddedCardForm.tsx` to use the SDK the way this build expects:
   - load jQuery, then hostedfields.js
   - initialize with `window.jQuery(formEl).hostedForm({...})`
   - fetch the instance via `window.jQuery(formEl).hostedForm("instance")`
   - call `instance.getPaymentDetails()`
2. Replace the current hosted-field containers from `div`s to real input elements the SDK can discover, using the field pattern it expects.
3. Add exact SDK-state logging and user-visible errors:
   - “jQuery failed to load”
   - “Hosted Fields plugin missing”
   - “Hosted form instance not created”
   - tokenisation / gateway decline errors separately
4. Keep the existing `payment-direct-sale` backend flow, since it already supports `card_token` and balance crediting.
5. Add a safe fallback path:
   - if hosted fields fail to initialise, show a clear fallback button to use the redirect card flow instead of leaving checkout dead.

Files to update:
- `src/components/payments/CardstreamEmbeddedCardForm.tsx`
- `src/components/payments/CardstreamCheckout.tsx`
- possibly reuse existing redirect button/component as the fallback in checkout

Implementation outline:
```text
CardstreamCheckout
  ├─ wallet buttons
  ├─ embedded card form (primary)
  └─ redirect card fallback (only if embed init fails)

Embedded form lifecycle
  1. load jQuery
  2. load hostedfields SDK
  3. verify $.fn.hostedForm exists
  4. init plugin on <form>
  5. obtain plugin instance
  6. wait for hostedform:ready
  7. on submit -> getPaymentDetails()
  8. send paymentToken to payment-direct-sale
  9. reuse existing onPaid flow
```

Technical notes:
- The minified SDK shows namespace `hostedform` and plugin-style methods, which is why the current `new window.hostedFields.classes.Forms(...)` call fails.
- The same SDK code also shows auto-setup scanning `INPUT[type^="hostedfield:"]` and `INPUT[data-hostedfield]`, not `div[data-hostedfield]`.
- The React ref warning is likely secondary noise from the broken init path; I would re-check it after correcting the SDK integration before making any unrelated refactor.

Expected outcome:
- The embedded card form should render correctly instead of erroring during mount.
- Tokenisation should succeed using the proper plugin instance.
- Successful card payments should continue through the existing direct sale path, including the existing payment intent update and pupil balance credit logic.
- If the gateway SDK still fails in some environments, users will still be able to complete payment via the fallback redirect flow.
