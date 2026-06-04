## Plan: Add Accord ExtraBold font

### Steps
1. **Upload font to CDN** via `lovable-assets create` from `/mnt/user-uploads/Accord-ExtraBold.ttf` → `src/assets/fonts/Accord-ExtraBold.ttf.asset.json`.
2. **Register `@font-face`** in `src/index.css` pointing at the CDN URL (font-family: `Accord`, weight 800, `font-display: swap`).
3. **Wire into Tailwind** (`tailwind.config.ts`): add `Accord` as the first entry in the `heading` fontFamily stack so existing heading classes pick it up automatically.
4. **Apply to key headings** — at minimum the homepage hero "See who's teaching you before you book." and the "How it works" heading, plus the EveryDriver wordmark in the nav and hero. (Body text stays on the current system stack.)

### Questions before I build
- Apply Accord to **all headings sitewide**, or **only the hero + nav wordmark**?
- You've only sent ExtraBold (800). Headings using lighter weights will fall back to the next font in the stack. OK, or do you have other weights to upload?
