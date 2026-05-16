## Plan

Redesign `PostcodeAutocomplete` so the suggestions panel stays visible during lookups instead of disappearing.

### Behaviour changes
1. Open the dropdown as soon as the user has typed at least 2 characters and the input is focused — not only after results arrive.
2. While `isLoading` is true, render the dropdown with 3 skeleton rows (animated shimmer matching the suggestion row layout: pin icon + postcode line + area line).
3. Keep the previously returned suggestions on screen while a new fetch is in flight; only swap them in once the new response lands. This avoids the empty flash between keystrokes.
4. If the lookup completes with zero results, show a single muted “No matches for ‘WD17 3…’” row instead of closing the panel.
5. Move the inline spinner from inside the input to the dropdown header (small `Searching…` label on the right) so the input itself stays clean.
6. Preserve keyboard nav, outside-click close, geolocation button, and the `onSelect` flow exactly as today.

### Visual polish
- Match the existing search-card tokens (`#DDE3ED` border, navy text, subtle shadow).
- Skeleton rows use `bg-muted` with a soft pulse, same row height as a real suggestion (44px) so the panel doesn’t resize when results arrive.
- Header strip inside the dropdown: 10px uppercase label (“Suggestions” / “Searching”) on the left, spinner + “Looking up…” on the right while loading.

### Scope
- Only `src/components/PostcodeAutocomplete.tsx` changes.
- No edits to `CourseSearchHeader` or the search hook — the dropdown lives entirely inside the autocomplete component, so every consumer (courses page, homepage, mini-website, pupil portal, etc.) gets the fix automatically.
