

## Plan: Merge Fleet Dashboard & Geotab Hub into Unified Telematics Page

### Approach

Replace the two separate pages with a single **unified telematics page** at `/instructor/fleet-dashboard`. The page will:
- Show **general tabs** (Overview, Live Map, Lessons, Mileage, Heatmap, Geofences, Alerts, Dashcam, Reports) for all instructors
- **Conditionally reveal Geotab-specific tabs** (Trips, Diagnostics, Sensors, Faults, Speeding, Behaviour, Fuel, Impact) when a Geotab device is detected
- Redirect `/instructor/geotab` to `/instructor/fleet-dashboard` so existing links still work

### Tab Structure

```text
ALL INSTRUCTORS:
  Overview | Live Map | Lessons | Mileage | Heatmap | Geofences | Alerts | Dashcam | Reports

GEOTAB ONLY (appended):
  Trips | Diagnostics | Sensors | Faults | Speeding | Behaviour | Fuel | Impact
```

### Files Changed

| Action | File | Detail |
|--------|------|--------|
| **Rewrite** | `src/pages/InstructorFleetDashboard.tsx` | Merge all Geotab Hub tabs into the existing Fleet Dashboard. Add `useActiveTrackingProvider` check to conditionally render Geotab tabs. Import all Geotab tab components. |
| **Rewrite** | `src/pages/InstructorGeotabHub.tsx` | Replace with a redirect component: `Navigate to="/instructor/fleet-dashboard"` |
| **Edit** | `src/components/instructor/InstructorDesktopSidebar.tsx` | Remove "Geotab Hub" sidebar entry, keep "Fleet Dashboard" renamed to "Telematics" |
| **Edit** | `src/components/layout/InstructorPortalLayout.tsx` | Same sidebar change in mobile nav |
| **Edit** | `src/pages/InstructorMenu.tsx` | Remove Geotab Hub menu item if present, or update label |

### Key Implementation Details

- Use `useActiveTrackingProvider(instructor.id)` to detect if provider is `"geotab"`
- Geotab-specific tabs render conditionally: `{isGeotab && <TabsTrigger ...>}`
- The overview tab uses `FleetDashboard` for all users; Geotab users also see `GeotabOverviewTab` content merged or as a sub-section
- No database changes needed — purely UI consolidation

