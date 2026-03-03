

## Design Consistency Audit: Instructor Mobile App

After reviewing all instructor pages, here are the design inconsistencies found compared to the homepage reference style (navy gradient header, rounded-2xl cards, `bg-card rounded-xl border` surfaces, icon badges in colored circles, consistent spacing):

### Pages That Follow the Design System (no changes needed)
- **InstructorPay** -- gradient hero card, 3-col stats, rounded-xl cards with icon badges
- **InstructorPupils** -- gradient hero card, rounded-2xl stats, consistent header
- **InstructorExpenses** -- consistent header with icon badge, proper spacing
- **InstructorGaps** -- consistent header, proper tabs
- **InstructorHealth** -- consistent header, stats grid, proper tabs
- **InstructorSchedule** -- consistent mobile toggle, proper layout

### Pages With Inconsistencies

| Page | Issues |
|------|--------|
| **InstructorFuel** | Does NOT use `InstructorPortalLayout` at all -- has its own `min-h-screen bg-background` wrapper with custom sticky header + ArrowLeft. Missing bottom nav, missing mobile header. |
| **InstructorNearbyFriends** | Does NOT use `InstructorPortalLayout` -- uses `flex flex-col h-screen bg-background` with custom header. Missing bottom nav, missing mobile header. |
| **InstructorVehicleHealth** | Has ArrowLeft back button in header instead of relying on layout's built-in back button. Header style doesn't match (no icon badge circle). |
| **InstructorTestResults** | Header uses `text-2xl` instead of `text-xl`. Has description text below title. Stats cards use raw `Card` without rounded-xl styling. Desktop-oriented layout (5-col grid, table) not optimised for mobile. |
| **InstructorTestRequests** | Has ArrowLeft back button + `p-4 max-w-4xl mx-auto` wrapper. No icon badge in header. |
| **InstructorTodos** | Todo items use `bg-white` hardcoded (breaks dark mode). Filter chips use `bg-white` hardcoded. No rounded corners on items (square borders). |
| **InstructorJobs** | Uses raw `Card` components instead of `rounded-xl border` cards. No gradient hero stats card like Pay/Pupils pages. |
| **InstructorLocations** | Has ArrowLeft in header pointing to `/instructor` (should use layout back). Uses `GlassCard` component (inconsistent with rest of app using `bg-card rounded-xl border`). Extra `p-4` padding wrapper. |
| **InstructorSatNav** | Header uses plain `Navigation` icon without colored circle badge. Uses raw `Card` components. No hero/stats section. |
| **DashcamGallery** | Uses `text-lg sm:text-2xl` header sizing. Extra `p-3 sm:p-4 md:p-6 pb-24` padding. |
| **InstructorAccounts** | No header icon badge. Uses scrollable TabsList that doesn't match mobile tab patterns. |

### Standardisation Plan

All pages will be updated to follow this consistent pattern:

```text
<InstructorPortalLayout>
  <div className="space-y-4 pb-24">
    {/* Header: icon badge + title + optional action button */}
    <div className="flex items-center justify-between">
      <h1 className="text-xl font-bold flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-{color}-100 
             dark:bg-{color}-900/30 flex items-center 
             justify-center">
          <Icon className="h-4 w-4 text-{color}-600 
               dark:text-{color}-400" />
        </div>
        Page Title
      </h1>
      {/* Optional action button */}
    </div>

    {/* Optional gradient hero stats card */}
    
    {/* Content in bg-card rounded-xl border cards */}
  </div>
</InstructorPortalLayout>
```

### Specific Changes

**1. InstructorFuel** -- Wrap in `InstructorPortalLayout`, remove custom header/back button, add standard icon badge header, keep fuel type selector and content as-is.

**2. InstructorNearbyFriends** -- Wrap in `InstructorPortalLayout`, remove custom header, add standard icon badge header with "Friends" action button.

**3. InstructorVehicleHealth** -- Remove ArrowLeft back button (layout handles this), add icon badge to header (`bg-sky-100` with `Car` icon).

**4. InstructorTestResults** -- Change `text-2xl` to `text-xl`, remove description paragraph on mobile, change stats grid from 5-col to 3-col on mobile with `rounded-xl` cards.

**5. InstructorTestRequests** -- Remove ArrowLeft and `p-4 max-w-4xl mx-auto` wrapper, add icon badge header (`bg-amber-100` with `Award` icon).

**6. InstructorTodos** -- Replace `bg-white` with `bg-card` throughout for dark mode support. Add `rounded-xl` to todo items and filter chips.

**7. InstructorJobs** -- Convert `Card` components to `bg-card rounded-xl border` divs for consistency.

**8. InstructorLocations** -- Remove ArrowLeft back button, add standard icon badge header, replace `GlassCard` with `bg-card rounded-xl border` pattern, remove extra `p-4` wrapper.

**9. InstructorSatNav** -- Add icon badge circle around Navigation icon, convert `Card` wrappers to `bg-card rounded-xl border`.

**10. DashcamGallery** -- Standardise header to `text-xl font-bold`, normalise padding to `space-y-4 pb-24`.

**11. InstructorAccounts** -- Add icon badge to header (`bg-emerald-100` with `Wallet` icon).

This is purely a visual consistency pass -- no functional changes, no database changes, no new components. Just aligning CSS classes and layout wrappers across ~11 files.

