

## Fix: Cardstream Hosted Fields CSS Syntax Error

### Problem
The error `Syntax error, unrecognized expression: https://gateway.cardstream.com/sdk/web/v1/css/hostedfields.min.css` occurs because jQuery's selector engine is trying to parse the stylesheet URL as a CSS selector inside the `hostedForm()` plugin. This crashes SDK initialization, leaving the spinner spinning forever.

### Solution
Remove the `stylesheet` option from the `hostedForm()` configuration and instead load the CSS via a standard `<link>` tag in the document head (same pattern as `loadScript`).

### Changes

**File: `src/components/payments/CardstreamCheckout.tsx`**

1. Add a `loadStylesheet` helper that appends a `<link rel="stylesheet">` to `<head>` (idempotent, same pattern as `loadScript`)
2. Call `loadStylesheet("https://gateway.cardstream.com/sdk/web/v1/css/hostedfields.min.css")` before initializing the SDK
3. Remove the `stylesheet` property from the `hostedForm()` config object (line 173)

This stops jQuery from choking on the URL and ensures the hosted field iframes still get their styling.

