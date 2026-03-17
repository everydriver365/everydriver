

## Fix: HPP iframe still too tall on mobile

The iframe height was reduced from 480px to 360px but on a 525px viewport that's still consuming most of the screen, especially with the wallet buttons, dividers, header, and other UI above it.

### Change

**`src/components/payments/CardstreamPayButton.tsx` (line 188)**

Reduce mobile iframe height to `240px` with `minHeight: 200px`. The Cardstream HPP form content (card number, expiry, CVV, submit) fits within ~220px when `formResponsive: true` is set. Desktop stays at 480px.

```tsx
style={{ height: isMobile ? "240px" : "480px", minHeight: isMobile ? "200px" : "400px" }}
```

This gives the iframe just enough space for the card fields while leaving room for the header, wallet buttons, and cancel button on a 525px mobile viewport.

