

## Fix: Suppress postcode dropdown after geolocation detection

**Problem**: When the location button detects a postcode, it sets the value via `onChange()`, which triggers the `useEffect` (line 72-91) that fetches suggestions and opens the dropdown — showing a redundant popup.

**Solution**: Add a ref flag (`skipNextFetch`) that the geolocation handler sets to `true` before calling `onChange`. The `useEffect` checks this flag and skips fetching when it's set.

### Changes

**`src/components/PostcodeAutocomplete.tsx`**:
1. Add a `skipNextFetchRef = useRef(false)` 
2. In `handleGeolocation` (line 182), set `skipNextFetchRef.current = true` before calling `onChange(formattedPostcode)`
3. Also in `handleSelect` (line 133), set `skipNextFetchRef.current = true` before calling `onChange(suggestion.postcode)` (this already closes dropdown but the useEffect still fires)
4. In the `useEffect` (line 72-91), check `if (skipNextFetchRef.current) { skipNextFetchRef.current = false; return; }` before debouncing

This prevents the autocomplete dropdown from appearing after geolocation or selection, while keeping normal typing behavior intact.

