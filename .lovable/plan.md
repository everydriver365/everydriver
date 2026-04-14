

## Plan: Switch Activity Tile Icons to Phosphor Icons

Replace Lucide icons with **Phosphor Icons** for the four activity tiles to get a closer SF Symbols aesthetic with duotone/fill weight options.

### Changes

**Install**: `phosphor-react` package

**File: `src/components/instructor/ActivityTilesGrid.tsx`**
- Replace Lucide imports (`Briefcase`, `MessageSquare`, `FileText`, `CalendarPlus`, `HelpCircle`) with Phosphor equivalents in "fill" weight:
  - Job Offers → `BriefcaseFill` (or `Briefcase` with `weight="fill"`)
  - Messages → `ChatCircle` with `weight="fill"`
  - Tests → `Exam` or `ClipboardText` with `weight="fill"`
  - Fill Gaps → `CalendarPlus` with `weight="fill"`
- Keep existing gradient circle containers, white icon color, and all tile logic unchanged
- Update the fallback icon to a Phosphor equivalent

### What stays the same
- White tile design, gradient circles, badge counters, layout, animations — all untouched
- Only the icon shapes change to Phosphor's rounder, more iOS-like style

