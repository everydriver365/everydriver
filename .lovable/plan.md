I found the likely cause: the Home header greeting is using a very tight line-height (`leading-[1.05]`) combined with `truncate` overflow behavior. On mobile/iOS font rendering, descenders and anti-aliased pixels can get clipped at the bottom when the line box is too shallow.

Plan:

1. Update the Home header greeting text only
   - Keep the same layout and content.
   - Slightly increase the greeting line-height from the current tight value to a safer compact value.
   - Remove or avoid vertical clipping behavior on the greeting line while preserving single-line behavior where needed.

2. Preserve the recent header polish
   - Keep the reduced top spacing.
   - Keep greeting-to-meta spacing at 6px.
   - Keep meta-to-date spacing around 10px.
   - Keep the date alignment unchanged.

3. Add a small safety buffer if needed
   - Add minimal bottom padding or overflow-visible styling to the greeting element/header so letters like `g`, `y`, `j`, and `p` cannot be cut off.
   - Avoid making the header feel loose again.

Technical target:
- File: `src/components/instructor/PremiumIOSHomeView.tsx`
- Current issue location: the `<h1>` around the greeting, currently using `text-[26px] leading-[1.05] ... truncate`.
- Proposed fix: use a safer line-height such as `leading-[1.16]` or equivalent inline style, plus non-clipping overflow handling.