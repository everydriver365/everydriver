## Goal
Make Poppins the default font across the entire site (currently Inter/Accord are the defaults; Poppins is only used for headings).

## Changes

1. **`tailwind.config.ts`** — Put `Poppins` first in `fontFamily.sans` so all default `font-sans` usage resolves to Poppins (heading stack already starts with Poppins).

2. **`src/index.css`** — Update the base font stacks to lead with Poppins:
   - `--font-sans` (line 118): lead with `'Poppins'`.
   - `body` rule (line 214): replace `"Accord", "Manrope", ...` with `"Poppins", ...` so the global body font becomes Poppins instead of the Accord custom face.
   - `.font-sans` style block (line 688): lead with `Poppins`.
   - Leave the mono stack and the `.font-dyslexic` (Atkinson Hyperlegible) accessibility class alone.

3. Poppins is already loaded via Google Fonts in `index.html` and `src/index.css`, so no new font imports are needed.

## Out of scope
- Components that intentionally pin a different font (e.g. mono code blocks, dyslexic-friendly mode) remain unchanged.
- No layout, color, or spacing changes.
