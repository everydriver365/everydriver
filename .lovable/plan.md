
What I found

- The hero container is still rendering; the image is most likely being visually hidden by the current sizing/overlap setup rather than the component disappearing.
- In `src/components/instructor/HomepageHero.tsx`, these three changes combine to make the photo effectively invisible on mobile:
  1. The hero was shortened to `aspectRatio: "1 / 0.4"` (about 156px tall on a 390px-wide screen).
  2. The stats card is pulled upward with `-mt-14`, covering the bottom ~56px.
  3. A top dark scrim still exists with `h-24`, covering the top ~96px.

Why it looks blank

```text
390px wide screen
hero height ≈ 390 × 0.4 = 156px
bottom overlap ≈ 56px
visible area left ≈ 100px
top scrim = 96px

Result: almost the entire visible hero area is covered.
```

- That matches your screenshot: the hero area is there, but what remains visible is almost entirely the dark overlay plus the greeting text.

Secondary issue I found

- The image source logic only falls back to the default asset when `heroImageUrl` is empty:
  - `heroImageUrl && heroImageUrl.trim() !== '' ? heroImageUrl : instructorHeroImg`
- So if a saved hero URL exists but the file is broken/unavailable, the default image will not be used. That is a separate fallback bug worth fixing too.

Plan to fix

1. Remove the remaining dark scrim from the hero image.
2. Slightly reduce the card overlap or increase the hero height so some photo remains visible above the tile.
3. Add an `onError` fallback on the hero `<img>` so broken saved URLs still show the bundled default image.
4. Recheck the `/instructor` mobile layout at 390x560 to confirm the photo is clearly visible behind the greeting and above the overlapping card.

Main file to update

- `src/components/instructor/HomepageHero.tsx`
