## Why the banner isn't showing on `/drive365` for you

`src/pages/Index.tsx` has the banner (above "What's Included With Every Course"), but it's only used on **desktop**. On mobile, `Index.tsx` short-circuits and renders a completely separate component — `src/components/MobileHomepage.tsx` — which has its own "What's Included" section (line 240) and **no Test Swap banner**.

```tsx
// src/pages/Index.tsx
const isMobile = useIsMobile();        // breakpoint: 768px
if (isMobile) {
  return <MobileHomepage />;            // <- no banner here
}
```

Even though your reported viewport is 1221px, the Lovable preview iframe often renders narrower than the outer viewport (or you may be checking on a phone), which is why the banner appears to be missing.

## Plan

Add the same Test Swap banner to `MobileHomepage.tsx`, sized appropriately for mobile, directly above its "What's Included" section.

### Change

**File:** `src/components/MobileHomepage.tsx`

1. Import the asset and `Link`:
   ```tsx
   import { Link } from "react-router-dom";
   import testswapBanner from "@/assets/testswap-banner.png";
   ```
2. Insert a new section immediately before the existing `{/* What's Included Section */}` block (around line 240):
   ```tsx
   {/* Test Swap Banner */}
   <Link to="/test-swap" aria-label="Need an earlier driving test? Find a swap match" className="block -mx-4 mb-6">
     <img
       src={testswapBanner}
       alt="Need an earlier driving test? Swap, don't wait."
       className="w-full h-auto block"
     />
   </Link>
   ```

### Notes
- Banner is the same asset as desktop, so no new artwork needed.
- Mobile layout policy (per project memory) usually means "don't restyle the mobile layout" — adding a single in-flow banner in line with the user's explicit request is consistent with that intent. If you'd rather keep mobile untouched and instead force desktop layout on `/drive365`, say the word and I'll do that instead.
- After the edit I'll re-screenshot at mobile width to confirm.