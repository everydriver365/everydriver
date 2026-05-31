# Add Instructor Logo to Invoice PDF

## What changes
Show the instructor's logo (from `instructors.logo_url`) in the header of the PDF produced by `generateInvoicePdf`. If the instructor has no logo, fall back to the current text-only header (no change in appearance).

## Scope
- File: `src/lib/invoices/generateInvoicePdf.ts`
- File: `src/pages/invoices/SquareInvoicesPage.tsx` (pass `logo_url` through)

Square's hosted invoice page is **not** changed — that branding is controlled in the Square Dashboard (Account & Settings → Business → add a logo there to brand the emailed invoice).

## Implementation

1. **Extend `InvoicePdfInput`**
   Add `instructor?.logo_url?: string | null` alongside `name`.

2. **Fetch the image as a data URL inside `generateInvoicePdf`**
   - Make the function `async`.
   - If `logo_url` is set, `fetch()` it, read as Blob, convert to base64 data URL.
   - Use jsPDF's `doc.addImage(dataUrl, 'PNG'|'JPEG', x, y, w, h)`.
   - Detect format from the response `content-type` (default PNG). SVG logos are skipped (jsPDF can't render SVG); we'd fall back to the text header. If many instructor logos are SVG, we can rasterize via a canvas — flag this and I'll add it.

3. **Header layout**
   - Logo: top-left at `(margin, 40)`, max 120pt wide × 48pt tall, preserving aspect ratio.
   - Shift the "INVOICE" title to the right side (top-right) when a logo is present; keep it top-left when no logo.
   - Invoice number + issued date stay under the title.
   - Status pill moves to the same right column under "INVOICE" so it doesn't collide.

4. **Pass the logo through from the page**
   `SquareInvoicesPage` already has the instructor row in scope (it filters invoices by instructor). Add `logo_url` to the object passed into `generateInvoicePdf({ ..., instructor: { name, logo_url } })`.

5. **Handle await**
   Update the click handler that calls `n(r)` to `await n(r)` (or `.then()`); show a toast on failure.

## Edge cases
- CORS: instructor logos are served from Supabase storage (public bucket) which sends permissive CORS — `fetch` + `blob()` works in the browser.
- Missing/broken URL: catch the fetch error and proceed with the text-only header.
- Very tall logos: clamp to 48pt height, scale width proportionally.

## Out of scope
- Square-hosted invoice branding (Dashboard-controlled).
- Email template branding.
- Adding a logo uploader (instructors already have `logo_url` via the existing branding/profile settings).
