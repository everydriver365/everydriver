Replace the Drive365 hero image with the newly uploaded panoramic photo (learner + car + phone mockup on a rooftop).

## Steps
1. Copy `user-uploads://d365_new_hero.png` to `src/assets/drive365-hero-driver.webp` (overwrite existing), so the existing import in `HeroSearchSection.tsx` picks it up automatically.
2. Since the new image is a wide panorama (~3.5:1), switch the image fit from `object-contain` with `inset-4` padding back to `object-cover` filling the frame edge-to-edge — this avoids large empty bands around the image.
3. No other changes; headline, search box, and layout stay the same.

## Files
- `src/assets/drive365-hero-driver.webp` (replaced)
- `src/components/homepage/HeroSearchSection.tsx` (image classes only)