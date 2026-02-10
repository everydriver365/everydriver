

# Collapsible Sidebar Sections

## What Changes
The desktop sidebar currently shows all section groups (TEACHING, BUSINESS, COMMUNICATION, TOOLS) expanded with a static label. This will change so each group label becomes a clickable toggle that expands/collapses to show or hide its sub-items.

## How It Will Work
- Each section header (e.g. "TEACHING", "BUSINESS") becomes a clickable row with a chevron indicator
- Clicking a header toggles that section open/closed
- The section containing the **currently active page** will automatically start open
- All other sections start collapsed
- When the sidebar is in collapsed/icon-only mode, the expand/collapse behaviour is skipped (icons stay visible)
- Smooth transition animation on the content reveal

## What Gets Modified

| File | Change |
|------|--------|
| `src/components/layout/InstructorPortalLayout.tsx` | Update the desktop sidebar section (lines 813-870) to use collapsible group headers with local state tracking which sections are open |

## Technical Details

- Add a `openGroups` state (`string[]`) initialised by checking which group contains the current `location.pathname`
- Each group header becomes a `<button>` that toggles its label in/out of `openGroups`
- The items list renders only when the group is open (or sidebar is collapsed to icon-only mode)
- A small `ChevronDown` icon rotates to indicate open/closed state
- The existing notification badges, active styling, and highlight logic remain unchanged
- Mobile sidebar (Sheet) is unaffected -- this only applies to the desktop `<aside>` sidebar

