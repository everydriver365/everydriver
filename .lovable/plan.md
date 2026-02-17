

## Add "Earlier Test Guarantee" Badge to Course Tiles

### What will change
The uploaded "Earlier Test Guarantee" gold badge image will be added as a small overlay icon on the **Intensive Courses** and **Semi-Intensive** tiles on the Drive365 homepage.

### How it will look
- On the **Intensive Courses** tile (full-width): the badge will appear as a small circular icon (approx. 36x36px) positioned in the top-right corner of the tile, overlapping slightly.
- On the **Semi-Intensive** tile (half-width grid): the badge will appear slightly smaller (approx. 28x28px) in the top-right corner.
- The badge will NOT appear on the Weekly Lessons tile.

### Technical Steps

1. **Copy the uploaded image** into `src/assets/early_test_guaranteed.png`
2. **Edit `src/components/MobileHomepage.tsx`**:
   - Import the new badge image
   - Add the badge as an absolutely-positioned `<img>` element inside both the Intensive and Semi-Intensive tile `motion.div` containers (which already have `overflow-hidden` and can receive `relative` positioning)
   - Size: `w-9 h-9` on the intensive tile, `w-7 h-7` on the semi-intensive tile
   - Position: `absolute top-1 right-1` with a subtle drop shadow for visibility
