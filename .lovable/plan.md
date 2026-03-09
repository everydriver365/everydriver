

## Plan: Searchable Instructor Combobox

### Problem
The current `<Select>` dropdown loads all instructors at once and renders them in a flat list. With hundreds or thousands of instructors, this is slow to load and impossible to navigate.

### Solution
Replace the `<Select>` with a searchable combobox using the existing `cmdk` (Command) component already in the project. This gives pupils a type-to-search input that filters instructors as they type.

### Changes

**`src/components/pupil/PupilRegister.tsx`**
- Replace the `<Select>` with a `<Popover>` + `<Command>` combobox pattern (commonly used with shadcn/ui)
- Add a search input that filters the instructor list client-side
- Show a "No instructor found" empty state
- Display the selected instructor name in the trigger button
- Keep the same dark styling to match the existing form

The `cmdk` library (already installed) handles fuzzy search filtering automatically, so no server-side search is needed -- the full list is fetched once and filtered in the browser, which handles thousands of items efficiently.

### No other files need changes
The data fetching, edge function, and routing all remain the same. This is a purely UI-level improvement to the instructor selector.

