## Problem

The previous edits added `bg-[#3082cf]` to the three "Read more" buttons (Intensive, Semi-Intensive, Weekly Lessons) in `src/components/home/Drive365Home.tsx`, but the buttons still render in their original red/blue/dark navy colors.

The cause: the same file contains an inline `<style>` block defining `.d365-feat-btn--red`, `.d365-feat-btn--blue`, and `.d365-feat-btn--dark` with hardcoded backgrounds (`#D12E2E`, `#1A6FD4`, `#0A0E27`). That stylesheet loads after Tailwind's utilities, so the modifier classes win over `bg-[#3082cf]`.

## Fix

In `src/components/home/Drive365Home.tsx`, update the inline CSS for all three modifier classes so each "Read more" button uses `#3082cf` with a slightly darker hover:

- `.d365-feat-btn--red`  → background `#3082cf`, hover `#2b6cb0`
- `.d365-feat-btn--blue` → background `#3082cf`, hover `#2b6cb0`
- `.d365-feat-btn--dark` → background `#3082cf`, hover `#2b6cb0`

Also remove the now-redundant `bg-[#3082cf]` utility from the three button `className`s to keep the markup clean.

No other files or behaviors change.
