

# Fix: Live Map Not Initializing on Desktop

## Root Cause

The map fails because of a timing conflict between loading state and map initialization:

1. The component mounts with `forceMount` (always in the DOM)
2. While `loading=true`, it renders a spinner -- the map `div` doesn't exist yet
3. The map init `useEffect` runs once (empty `[]` deps), sees no container, and exits
4. When loading finishes and the map `div` finally appears, the `useEffect` never re-runs

The map container appears in the DOM but Leaflet is never attached to it.

## Fix

**File: `src/components/instructor/FleetLiveMap.tsx`**

Move the loading/empty states so the map container is **always rendered** in the DOM, and overlay the loading spinner on top. This ensures `mapRef` is never null when the init effect runs.

### Changes:
- Remove the early `if (loading)` and `if (devices.length === 0)` returns that replace the map div with other UI
- Instead, always render the map container div
- Overlay the loading spinner and empty-state message on top of/beside the map using absolute positioning or conditional overlays
- The map init effect will always find a valid container

### Approach:
```
return (
  <div className="space-y-3">
    {/* Legend bar */}
    ...
    <Card className="overflow-hidden relative">
      {/* Map container is ALWAYS in the DOM */}
      <div ref={mapRef} className="h-[500px] w-full" style={{ background: "#f2f2f2" }} />

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <spinner />
        </div>
      )}

      {/* Empty state overlay */}
      {!loading && devices.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <empty message />
        </div>
      )}
    </Card>
  </div>
);
```

This is a single-file fix in `FleetLiveMap.tsx`. No other files need changes.

## Technical Detail

- The key issue is that the early returns on lines 233-251 prevent the `ref={mapRef}` div from being in the DOM
- With the map div always present, the `IntersectionObserver` and `initMap()` logic will work correctly on first visibility
- The loading/empty states become overlays rather than replacements

