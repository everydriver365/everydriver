

## Make "What's Included" tile images bigger

The current image height on the Drive365 homepage tiles is `h-28 md:h-36` (112px mobile, 144px desktop). I'll increase these to match the course card style (`h-52` = 208px) or a proportional increase.

**File:** `src/pages/Index.tsx` (line 531)

**Change:** Update the image container from `h-28 md:h-36` to `h-36 md:h-48` (144px mobile, 192px desktop) — a significant increase while keeping the 2x3 grid balanced.

