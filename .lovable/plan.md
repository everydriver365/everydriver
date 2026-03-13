

## Plan: Auto-search courses when location is detected

**Problem**: When the user taps the location button in the course search, the postcode is filled in but they still need to manually tap "Search" to load courses.

**Solution**: Pass `onSearch` as the `onSelect` callback to `PostcodeAutocomplete` in `CourseSearchHeader.tsx`. The `PostcodeAutocomplete` component already calls `onSelect` after geolocation succeeds, so wiring it to trigger the search will auto-load courses.

### Changes

**`src/components/courses/CourseSearchHeader.tsx`** (~line 44-48):
- Add `onSelect` prop to `PostcodeAutocomplete` that calls `onSearch` after setting the postcode:
```tsx
<PostcodeAutocomplete
  value={postcode}
  onChange={setPostcode}
  onSelect={(pc) => {
    setPostcode(pc);
    // Small delay to ensure state updates before search fires
    setTimeout(() => onSearch(), 100);
  }}
  placeholder="Enter postcode..."
  className="flex-1"
  inputClassName="h-11 border-0 bg-secondary"
/>
```

This single change ensures that whenever the geolocation button resolves a postcode (or a user selects from autocomplete suggestions), the search fires automatically.

