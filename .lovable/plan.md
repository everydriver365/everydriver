

User wants the "Best Mate" tile style from the screenshot: large white rounded card, big bold value, label below, subtitle, and a CTA button bar at the bottom (e.g. "NEW INVOICE"). Two tiles side-by-side with a chevron indicating tap-through.

Looking at the image:
- White card, rounded ~2xl, soft shadow
- Top-left: small coloured icon chip (purple/red rounded square)
- Chevron top-right
- Big bold £ value
- "Invoices" label
- Tiny subtitle ("Outstanding Invoices" / "No upcoming jobs")
- Full-width CTA button at bottom in a soft lavender pill ("NEW INVOICE")
- Two-up grid

This fits the existing iOS tile primitive (memory: `mem://style/ios-tile-primitive`) — extend it rather than create a parallel system.

## Plan

**1. New shared component: `BestMateTile`** (`src/components/ui/BestMateTile.tsx`)
- Props: `icon`, `iconColor` (purple/red/blue/emerald), `value`, `label`, `subtitle`, `ctaLabel`, `onCtaClick`, `onClick`
- Layout: white bg, `rounded-2xl`, `shadow-lift`, padding, chevron top-right, big bold value, label, subtitle, full-width pill CTA at bottom (soft tinted bg matching icon colour)
- Mobile-first, works in 2-col grid on `/instructor`

**2. Wire two real tiles on the instructor home (`/instructor`)**
Replace/augment two existing home tiles with this style:
- **Invoices** → value = outstanding total from `useInvoices`, CTA "NEW INVOICE" → opens invoice creation
- **Jobs** → value = upcoming job offer count or "No upcoming jobs", CTA "VIEW JOBS" → routes to job offers page

**3. Keep it opt-in / additive**
Place the pair near the top of the home page below the greeting, in a 2-col grid. Don't rip out existing tiles — just add this hero pair so the user can review the look first.

## Outcome
A reusable "Best Mate" style tile primitive matching the screenshot, deployed first as the Invoices + Jobs hero pair on `/instructor`. Easy to roll out to other tiles afterwards.

