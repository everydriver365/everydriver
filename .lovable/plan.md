# Switch embed to everydriver.co + confirm payments

## Booking flow — already works

The existing implementation in `src/context/EmbedContext.tsx` builds the booking URL from `window.location.origin`. That means the embed automatically inherits whichever domain hosts it — no hardcoded `drive365.co.uk` in the runtime code. When the iframe is served from `https://everydriver.co/embed/courses`, clicking Book breaks out of the iframe to `https://everydriver.co/book/:id?...`, and the existing checkout (Square / Klarna / Clearpay / GoCardless / SumUp / Cash) runs first-party there. Both domains are already published from this same project, so `/book/:id` exists on `everydriver.co` identically to `drive365.co.uk`.

So payments will work end-to-end via `https://everydriver.co/embed/courses` with zero logic changes.

## Changes (branding only, no functional changes)

`src/pages/everydriver/CourseResults.tsx`:

1. Update the embed snippet in the doc comment at the top of the file from `https://drive365.co.uk/embed/courses` to `https://everydriver.co/embed/courses`.
2. Rename the height-reporter postMessage type from `"drive365:embed:height"` to `"everydriver:embed:height"` so host pages listening for the event use the everydriver namespace.

That's it. No changes to `EmbedContext`, `DynamicCourseCard`, `CourseTableList`, `EDCourseList`, or `publicRoutes.tsx`.

## Host snippet (for any external site)

```html
<iframe
  src="https://everydriver.co/embed/courses"
  style="width:100%;border:0;min-height:1200px"
  allow="payment *; clipboard-write"
  referrerpolicy="no-referrer-when-downgrade"
></iframe>
```

## Out of scope

- No DB / RLS / edge-function changes
- No checkout code changes — same first-party `/book/:id` flow
- No changes to `/courses`, `/i/:slug/courses`, `/booking/:slug`, or any whitelabel route
