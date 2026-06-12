Upload the new logo as a Lovable Asset and swap only the logo used inside `src/components/home/SeeWhoIsTeaching.tsx` (lines 5 + 117–118) to point at the new asset. No other component references this asset, so the logo change is scoped to that tile only.

Steps:
1. `lovable-assets create --file /mnt/user-uploads/ed_logo_2-removebg-preview.png --filename ed-logo-teaching-tile.png > src/assets/ed-logo-teaching-tile.png.asset.json`
2. In `src/components/home/SeeWhoIsTeaching.tsx`, change the import to the new `ed-logo-teaching-tile.png.asset.json` (leave `everydriver-logo-jun7-v3.png.asset.json` in place — still used elsewhere).

No other files touched.
