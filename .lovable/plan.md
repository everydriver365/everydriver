
# Remove Traccar from Application

## Overview

This plan removes all Traccar-specific code and references from the application while preserving the GPSgate integration that has replaced it. The system has already migrated to GPSgate Cloud for GPS tracking, making Traccar functionality obsolete.

## Current State Analysis

### Files Containing Traccar References (48+ files found)

**Edge Functions to Delete:**
| Function | Lines | Purpose |
|----------|-------|---------|
| `supabase/functions/traccar-poller/` | 788 | Legacy Traccar API polling |
| `supabase/functions/traccar-webhook/` | 532 | Legacy Traccar webhook handler |

**Frontend Pages:**
| File | Action |
|------|--------|
| `src/pages/InstructorTraccarSession.tsx` | Rename to `InstructorLiveSession.tsx` |
| `src/pages/InstructorTraccarSetup.tsx` | Rename to `InstructorGPSSetup.tsx` |

**Components:**
| File | Action |
|------|--------|
| `src/components/instructor/TraccarLiveMap.tsx` | Rename to `LiveTrackingMap.tsx` |
| `src/components/instructor/TraccarConnectionChecklist.tsx` | Rename to `GPSConnectionChecklist.tsx` |

**Hooks (Compatibility Wrappers):**
| File | Action |
|------|--------|
| `src/hooks/useTraccarPoller.ts` | Delete (re-exports `useGPSPoller`) |
| `src/hooks/useTraccarConnectionStatus.ts` | Delete (re-exports `useGPSConnectionStatus`) |

**Database Tables (currently named with "traccar" prefix):**
- `traccar_devices` - GPS device registrations
- `traccar_battery_history` - Battery telemetry history
- `traccar_ignition_events` - Ignition event logs

**Secrets to Remove:**
- `TRACCAR_EMAIL`
- `TRACCAR_PASSWORD`
- `TRACCAR_SERVER_URL`

---

## Implementation Plan

### Phase 1: Delete Legacy Edge Functions

1. **Delete `supabase/functions/traccar-poller/`** - The entire directory (788 lines)
   - This legacy function polled the Traccar API
   - Replaced by `gpsgate-poller` edge function

2. **Delete `supabase/functions/traccar-webhook/`** - The entire directory (532 lines)
   - This legacy function handled Traccar webhooks
   - No longer needed with GPSgate integration

### Phase 2: Rename Database Tables

Create a migration to rename tables from `traccar_*` to `gps_*`:

```sql
-- Rename tables
ALTER TABLE public.traccar_devices RENAME TO gps_devices;
ALTER TABLE public.traccar_battery_history RENAME TO gps_battery_history;
ALTER TABLE public.traccar_ignition_events RENAME TO gps_ignition_events;

-- Update indexes
ALTER INDEX idx_traccar_devices_identifier RENAME TO idx_gps_devices_identifier;
ALTER INDEX idx_traccar_devices_instructor RENAME TO idx_gps_devices_instructor;

-- Update foreign key constraints (auto-renamed with table)
```

### Phase 3: Rename Frontend Files

| Original | New Name |
|----------|----------|
| `src/pages/InstructorTraccarSession.tsx` | `src/pages/InstructorLiveSession.tsx` |
| `src/pages/InstructorTraccarSetup.tsx` | `src/pages/InstructorGPSSetup.tsx` |
| `src/components/instructor/TraccarLiveMap.tsx` | `src/components/instructor/LiveTrackingMap.tsx` |
| `src/components/instructor/TraccarConnectionChecklist.tsx` | `src/components/instructor/GPSConnectionChecklist.tsx` |

### Phase 4: Delete Compatibility Hooks

Delete these files (they only re-export GPS hooks):
- `src/hooks/useTraccarPoller.ts`
- `src/hooks/useTraccarConnectionStatus.ts`

### Phase 5: Update Routing & Imports

**Update `src/App.tsx`:**
- Change import from `InstructorTraccarSession` to `InstructorLiveSession`
- Change import from `InstructorTraccarSetup` to `InstructorGPSSetup`
- Update routes:
  - `/instructor/traccar` → `/instructor/live` (keep old path as redirect)
  - `/instructor/settings/traccar` → `/instructor/settings/gps`

**Update Navigation:**
- `src/components/instructor/InstructorBottomNav.tsx` - Update path references
- `src/components/layout/InstructorPortalLayout.tsx` - Update sidebar links
- `src/components/instructor/InstructorMobileHome.tsx` - Update dropdown links

### Phase 6: Update All Database References

Search and replace across ~26 files:
- `traccar_devices` → `gps_devices`
- `traccar_battery_history` → `gps_battery_history`
- `traccar_ignition_events` → `gps_ignition_events`

**Files requiring updates:**
- `src/hooks/useVehicleHealth.ts`
- `src/hooks/useGPSConnectionStatus.ts`
- `src/hooks/useInstructorLastPosition.ts`
- `src/hooks/useRunningCosts.ts`
- `src/hooks/useDeviceTelemetryHistory.ts`
- `src/components/instructor/InstructorDetailsEditor.tsx`
- `src/components/instructor/InstructorBottomNav.tsx`
- `supabase/functions/gpsgate-poller/index.ts`
- And ~18 more files...

### Phase 7: Update Interface/Type Names

Rename TypeScript interfaces:
- `TraccarDevice` → `GPSDevice`
- `TraccarDeviceHealth` → `GPSDeviceHealth`
- `TraccarLiveMapProps` → `LiveTrackingMapProps`

### Phase 8: Clean Up Secrets

Remove unused Traccar secrets (via Lovable Cloud settings):
- `TRACCAR_EMAIL`
- `TRACCAR_PASSWORD`
- `TRACCAR_SERVER_URL`

---

## Files Summary

### Files to Delete (4 files/folders)
1. `supabase/functions/traccar-poller/` (entire directory)
2. `supabase/functions/traccar-webhook/` (entire directory)
3. `src/hooks/useTraccarPoller.ts`
4. `src/hooks/useTraccarConnectionStatus.ts`

### Files to Rename (4 files)
1. `InstructorTraccarSession.tsx` → `InstructorLiveSession.tsx`
2. `InstructorTraccarSetup.tsx` → `InstructorGPSSetup.tsx`
3. `TraccarLiveMap.tsx` → `LiveTrackingMap.tsx`
4. `TraccarConnectionChecklist.tsx` → `GPSConnectionChecklist.tsx`

### Files to Modify (~35 files)
All files referencing:
- `traccar_devices` table
- `TraccarDevice` types
- `/instructor/traccar` routes
- Traccar component imports

### Database Migration
- Rename 3 tables from `traccar_*` to `gps_*`
- Update associated indexes and constraints

---

## Risk Mitigation

1. **URL Redirects**: Keep `/instructor/traccar` as a redirect to `/instructor/live` for existing bookmarks
2. **Staged Rollout**: Database rename migration runs first, then code updates
3. **Type Safety**: TypeScript will catch any missed references during compilation

## Estimated Scope

| Category | Count |
|----------|-------|
| Edge functions deleted | 2 |
| Hook files deleted | 2 |
| Files renamed | 4 |
| Files modified | ~35 |
| Database tables renamed | 3 |
| Secrets removed | 3 |
| Total lines removed | ~1,400 |
