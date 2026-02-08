

## Color Enhancement: All Options Applied

Applying all five color enhancements to the Job Offers and Messages tiles for maximum visual impact.

### Changes to `src/components/instructor/InstructorMobileHome.tsx`

**Job Offers tile (line 344):**
- Deeper gradient: `from-amber-100` (was `from-amber-50`)
- Tinted border: `border-amber-200/60 dark:border-amber-800/30` (was `border-border`)
- Accent glow on hover: `hover:ring-1 hover:ring-amber-300/50`
- Stronger icon bg: `bg-amber-500/20` (was `bg-amber-500/15`)
- Tinted label text: `text-amber-900 dark:text-amber-100` (was `text-foreground`)

**Messages tile (line 359):**
- Deeper gradient: `from-blue-100` (was `from-blue-50`)
- Tinted border: `border-blue-200/60 dark:border-blue-800/30` (was `border-border`)
- Accent glow on hover: `hover:ring-1 hover:ring-blue-300/50`
- Stronger icon bg: `bg-blue-500/20` (was `bg-primary/10`)
- Tinted label text: `text-blue-900 dark:text-blue-100` (was `text-foreground`)

### Summary of all enhancements per tile

| Enhancement | Job Offers | Messages |
|---|---|---|
| Gradient depth | `from-amber-100` | `from-blue-100` |
| Border color | `border-amber-200/60` | `border-blue-200/60` |
| Hover glow | `ring-amber-300/50` | `ring-blue-300/50` |
| Icon bg opacity | `bg-amber-500/20` | `bg-blue-500/20` |
| Label text color | `text-amber-900` | `text-blue-900` |

### Files to modify
- `src/components/instructor/InstructorMobileHome.tsx` -- update classNames on both tile buttons and their child elements (~lines 344-372)

