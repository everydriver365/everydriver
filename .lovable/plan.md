Update `src/components/home/SeeWhoIsTeaching.tsx` so the cards render exactly like the reference image.

## Changes

**Card layout (per card)**
- Increase card padding from 14 → 18–20px; gap between cards 14px.
- Top color bar stays (green/orange/blue, 6px).
- Header row: circular avatar (40×40, `borderRadius: 9999px`) + name (14px bold) + sub-line "Winchester · 0.0 mi" (12px, gray).
- "Top rated" badge: keep on the highest-rated card, orange pill top-right.

**Rating + pass rate row**
- Left: ★ `4.8 (47 reviews)` — show the full word "reviews", 12px gray.
- Right: green pill badge `94% pass` — soft mint background `#D1FAE5`, text `#059669`, 11px bold, rounded-full, padding `2px 10px`.
- Pull `pass_rate` from instructors table if present; otherwise omit the badge for that card (no fake values, per live-data rule).

**Price + CTA**
- Price `£45` (16–18px bold) + `/hr` (12px gray).
- "View profile →" button full-width, 10px padding, 13px bold. Middle card uses orange `#E8641A`, others use navy `#0A1628`.

**Distance**
- Compute `0.0 mi`, `0.2 mi` style distance from each instructor's `home_postcode` vs the homepage's detected location if available; if no user location, hide the `· X mi` suffix and just show town. No hardcoded fallbacks.

## Technical notes
- Query `instructors` for additional fields: `pass_rate` (if column exists) and `home_postcode` for town/distance derivation. Use `postcodes.io` for postcode → town lookup only if not already cached; otherwise show outward code.
- All radii via inline styles using `9999px` for avatars/pills, `12px` for cards, `8px` for button.
- No changes to data-fetching logic beyond adding fields. Live-data rule respected: missing pass_rate hides badge, missing distance hides ` · X mi`.
- No other components touched.
