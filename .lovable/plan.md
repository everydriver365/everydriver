## Plan: Add new EveryDriver logo to the "See who's teaching you" hero section

**Target:** `src/components/home/SeeWhoIsTeaching.tsx` only. Header and footer logos remain untouched.

### Steps
1. Upload the new logo (`ED_Logo_7th_june-removebg-preview.png`) as a Lovable asset via `lovable-assets create` from `/mnt/user-uploads/`, saving the pointer JSON to `src/assets/everydriver-logo-jun7.png.asset.json`. This avoids committing the binary.
2. In `SeeWhoIsTeaching.tsx`:
   - Import the asset pointer.
   - Add a centered `<img>` of the logo above the "Before you book" eyebrow text inside the header block (lines ~114-126), sized appropriately for the dark `#0A1628` background (e.g. height ~36-44px, auto width, with bottom margin).
3. No other files touched — homepage header, footer, JSON-LD, and any other logo references stay as they are.
