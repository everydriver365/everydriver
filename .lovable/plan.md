## Goal

Make every course card across the site (homepage, /courses, whitelabel /courses, mini-website, DemoCourseCards) match the uploaded design:

- Hero photo on top with rounded top corners
- Below the photo: a **dark navy left rail** with the start date stacked vertically (`2` over `MAR`)
- White content area with a bold uppercase title and an **icon list**:
  - Clock → time range + date
  - Pin → location (clickable blue)
  - Person → "With {Instructor}" (name in blue)
  - £ → price
- Soft pale-blue outer wash, subtle border, gentle shadow

Keep every existing function — nothing in the booking flow changes.

## What stays the same (functional, not visual)

- Click-through: Book Now / card tap still calls `navigate(`/book/${instructor.id}?hours=${hours}&date=${...}`)`.
- **Klarna / Clearpay badges** via `CompactPaymentBadges` (kept under the icon list).
- **Discount handling**: original price strike-through + "Save £X" pill when `discountedPrice` is set.
- **Popular / Intensive / Semi-Intensive / Transmission** badges (relocated as small chips on the photo overlay, same data).
- **Distance** ("X.X mi away") — small chip on the photo overlay.
- **Available-from delayed availability** logic and date formatting (unchanged).
- All existing props on both `IOSCourseCard` and `DynamicCourseCard` continue to work — no call-site changes required.

## Files touched

1. **`src/components/IOSCourseCard.tsx`** — rewrite the JSX/markup to the new layout. Props unchanged.
2. **`src/components/DynamicCourseCard.tsx`** — same rewrite so the homepage, /courses, whitelabel /courses and mini-website all share the look. Props unchanged.
3. **`src/pages/DemoCourseCards.tsx`** — no code change needed (it already feeds these components); will visually update automatically.

No design-token changes needed — the navy rail uses `bg-foreground` / `bg-slate-900` via existing tokens, blue accents use `text-primary`, photo background uses `bg-muted`. Outer pale wash uses `bg-secondary/40` so it adapts to dark mode and to whitelabel brand colours.

## Layout detail

```text
┌──────────────────────────────────────┐
│  [ hero photo, rounded-top ]         │  ← chips overlay: Popular, Intensive, Transmission, distance
│                                      │
├────────┬─────────────────────────────┤
│        │  1 HOUR DRIVING LESSONS     │
│   2    │  🕐 10:30 AM – 11:30 AM     │
│  MAR   │  📍 Winchester              │  ← location in primary blue
│        │  👤 With Ken D              │  ← name in primary blue
│        │  £ £45.00                   │
│        │                             │
│        │  [ Klarna ] [ Clearpay ]    │  ← CompactPaymentBadges, unchanged
│        │  [ Book Now → ]             │  ← primary CTA, unchanged behaviour
└────────┴─────────────────────────────┘
```

- The navy rail is a fixed ~72px column on `sm+`, collapses to a horizontal date strip on very narrow widths so mobile doesn't squash the title.
- Discount pill (`Save £X`) stays top-right on the photo.
- When there's no `nextAvailable` and no `availableFrom`, the rail shows `TBC` / `—` instead of the day/month.

## Open questions (answer inline or I'll use the defaults)

1. **Book Now button** — the screenshot doesn't show one, but every current card has it. Default: keep the button below the icon list. Say "remove" if you want a fully tap-the-whole-card design instead.
2. **Klarna/Clearpay placement** — default: small badges row between the price and the Book Now button (same as today). Alternative: tuck them into the icon list as a "Pay in 3" row.
3. **Mobile behaviour** — default: same layout, navy rail shrinks to ~56px and title font drops one step. Confirm or ask for a different mobile treatment (the project rule is to leave mobile alone unless told).

I'll use the defaults above unless you tell me otherwise — say the word and I'll implement.