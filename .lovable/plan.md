# Embeddable `/courses` clone with working payments

Generic, unbranded, iframe-friendly clone of the existing Drive365 `/courses` page. Same search, filters, results, availability — and the full booking + payment flow continues to work because checkout always happens on the top-level drive365.co.uk window, not inside the iframe.

## Route

`src/routes/publicRoutes.tsx`:

```
<Route path="/embed/courses" element={<CourseResults embed />} />
```

Reuses the existing `CourseResults` component, no duplicate page.

## Changes to `src/pages/Courses.tsx`

Add one prop: `embed?: boolean`. When true:

1. **No `MainLayout`** — render in a bare `<div className="min-h-screen bg-transparent">`. Removes `Drive365Header`, `Footer`, all Drive365 branding.
2. **Transparent background** — `useEffect` sets `html` + `body` background to transparent on mount and restores on unmount, so the embed inherits the host page colour.
3. **`noindex`** via `SEOHead` so `/embed/courses` doesn't compete with `/courses` in search.
4. **Height reporter** — `ResizeObserver` posts `{ type: 'drive365:embed:height', height }` to `window.parent` so hosts can auto-resize the iframe.

## Payments handling (the critical part)

Payments today run via `/book/:instructorId` and redirect out to Square / Klarna / Clearpay / GoCardless hosted checkout. Inside a third-party iframe those redirects break (X-Frame-Options on the gateway pages, third-party-cookie blocks, popup blockers).

Fix: **in embed mode, every booking navigation breaks out of the iframe to the top window.**

- Add optional `onBookClick?: (href: string) => void` to:
  - `src/components/DynamicCourseCard.tsx`
  - `src/components/courses/CourseTableList.tsx`
- In embed mode `CourseResults` passes:
  ```ts
  onBookClick={(href) => {
    const abs = new URL(href, window.location.origin).toString();
    try { window.top!.location.href = abs; }
    catch { window.open(abs, '_blank', 'noopener'); } // cross-origin top blocked → new tab fallback
  }}
  ```
- Default behaviour (`/courses`, `/i/:slug/courses`, `/booking/:slug`) unchanged — they keep using `navigate(href)`.

Result: the user picks a course inside the iframe → the parent page navigates (or a new tab opens) to `https://drive365.co.uk/book/:id?hours=…` where the existing, fully-tested checkout runs first-party. Square, Klarna, Clearpay, GoCardless, SumUp, Cash all keep working with zero changes to payment code.

The iframe `allow="payment *"` attribute is documented for host pages (not required for our redirect-based flow but recommended for any future in-page Payment Request usage).

## Iframe-ability

Lovable hosting does not send `X-Frame-Options` or restrictive `frame-ancestors`, so `/embed/courses` is embeddable from any origin out of the box. Host snippet (documented at top of `Courses.tsx`):

```html
<iframe
  src="https://drive365.co.uk/embed/courses"
  style="width:100%;border:0;min-height:1200px"
  allow="payment *; clipboard-write"
  referrerpolicy="no-referrer-when-downgrade"
></iframe>
```

## Files touched

- `src/pages/Courses.tsx` — `embed` prop, conditional bare layout, transparent bg effect, height reporter, `onBookClick` wiring
- `src/components/DynamicCourseCard.tsx` — optional `onBookClick` prop
- `src/components/courses/CourseTableList.tsx` — optional `onBookClick` prop
- `src/routes/publicRoutes.tsx` — register `/embed/courses`

## Out of scope

- No DB / RLS / migration changes
- No edge-function changes
- No changes to existing `/courses`, `/i/:slug/courses`, `/booking/:slug`, or any `/book/:id` checkout code
- No new design tokens — purely a layout/bootstrap variant
- Whitelabel `/courses` behaviour untouched; embed route always renders the generic global `CourseResults`
