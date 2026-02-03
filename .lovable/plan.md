
# Enhance GPS Tracker Connection Status on Mobile Tracking Page

## Overview

This plan improves the visibility of the GPSgate Tracker app connection status on the mobile tracking page (`/instructor/live`). Currently, the status is shown as a small inline bar - we'll make it more prominent with clearer visual indicators, real-time updates, and actionable troubleshooting guidance when offline.

## Current State

The connection status bar (lines 877-898) is:
- A small single-line bar at the top of the map
- Shows "Connected" or "Last: Xm Xs ago"
- Uses subtle color coding (emerald/destructive)
- No troubleshooting guidance or actionable steps

## Proposed Design

### 1. Enhanced Connection Status Card (Pre-Session)

Replace the simple status bar with an expanded, more prominent status card:

```text
When Connected:
┌────────────────────────────────────────────────┐
│  📡  GPSgate Tracker                           │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━           │
│  ● Connected • Updated 5s ago        [Pulsing] │
│                                                │
│  Speed: 32 mph  •  Road: High Street           │
└────────────────────────────────────────────────┘

When Offline:
┌────────────────────────────────────────────────┐
│  📵  GPSgate Tracker                    ⚠️     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━           │
│  ✕ Offline • Last seen 3m ago                  │
│                                                │
│  Tap to open GPSgate Tracker app →             │
│  [Open Tracker App]                            │
└────────────────────────────────────────────────┘
```

### 2. Key Visual Improvements

| Element | Before | After |
|---------|--------|-------|
| Size | Single line, 48px height | Expanded card, ~100px height |
| Status Indicator | Small text badge | Large animated dot with label |
| Device Name | Small text | Prominent heading |
| Last Update | "Last: 3m 20s ago" | "Updated 5s ago" or "Last seen 3m ago" |
| Troubleshooting | None | "Open Tracker App" button when offline |
| Real-time Data | Not shown | Speed + Road name when connected |

### 3. Deep Link Integration

When offline, include a prominent button to open the GPSgate Tracker app (reusing logic from `TrackerReminderBanner`):
- Attempts deep link to `gpsgate://`
- Falls back to App Store/Play Store

### 4. Active Session Status

During an active session, show a more prominent floating status indicator:
- Larger pulsing dot when connected
- Prominent warning banner with countdown when offline
- Clear visual feedback for data freshness

## Implementation Details

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/InstructorLiveSession.tsx` | Replace inline status bar with enhanced status card component |

### New UI Components Within Page

Create inline components/sections in `InstructorLiveSession.tsx`:

**1. Pre-Session Status Card**
```tsx
{/* Enhanced Connection Status Card */}
<div className="pointer-events-auto flex-shrink-0 p-3 pb-0">
  <div className={`rounded-2xl border-2 backdrop-blur shadow-lg ${
    isConnected 
      ? "bg-emerald-50/95 border-emerald-300" 
      : "bg-amber-50/95 border-amber-300"
  }`}>
    <div className="p-4 space-y-3">
      {/* Header with icon and device name */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${...}`}>
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">GPSgate Tracker</h3>
            <p className="text-xs text-muted-foreground">{device.device_name}</p>
          </div>
        </div>
        {/* Pulsing status indicator */}
        <StatusDot isConnected={isConnected} />
      </div>
      
      {/* Connection details */}
      <div className="flex items-center justify-between text-sm">
        <span>{isConnected ? "Connected" : "Offline"}</span>
        <span className="text-muted-foreground">{lastSeenLabel}</span>
      </div>
      
      {/* Live data when connected */}
      {isConnected && device.last_speed_kmh != null && (
        <div className="flex items-center gap-4 text-sm">
          <span>🏎️ {speedMph} mph</span>
          {device.last_road_name && <span>📍 {device.last_road_name}</span>}
        </div>
      )}
      
      {/* Open app button when offline */}
      {!isConnected && (
        <Button onClick={openTrackerApp} className="w-full">
          <ExternalLink className="h-4 w-4 mr-2" />
          Open GPSgate Tracker
        </Button>
      )}
    </div>
  </div>
</div>
```

**2. Active Session Status Badge**
```tsx
{/* Enhanced session status - top left */}
<div className="absolute top-4 left-4 z-30">
  <div className={`flex items-center gap-2 px-3 py-2 rounded-xl backdrop-blur shadow-lg ${
    isConnected 
      ? "bg-emerald-500/90 text-white" 
      : "bg-amber-500/90 text-white"
  }`}>
    <span className="relative flex h-3 w-3">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
        isConnected ? "bg-white" : "bg-red-300"
      }`}></span>
      <span className={`relative inline-flex rounded-full h-3 w-3 ${
        isConnected ? "bg-white" : "bg-red-400"
      }`}></span>
    </span>
    <span className="text-sm font-semibold">
      {isConnected ? "Recording" : "Signal Lost"}
    </span>
  </div>
</div>
```

### Deep Link Function

```typescript
const openTrackerApp = () => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const deepLink = "gpsgate://";
  const appStoreLink = isIOS 
    ? "https://apps.apple.com/app/gpsgate-tracker/id434645675"
    : "https://play.google.com/store/apps/details?id=com.gpsgate.tracker";
  
  window.location.href = deepLink;
  setTimeout(() => {
    window.location.href = appStoreLink;
  }, 1500);
};
```

## Visual Comparison

### Before
- Small inline bar, easy to miss
- No troubleshooting when offline
- No live data preview

### After
- Prominent card with clear visual hierarchy
- Actionable "Open Tracker" button when offline
- Shows live speed and road when connected
- Animated status indicators for visual feedback
- Consistent with existing UI patterns (GPSConnectionChecklist styling)

## Benefits

1. **Immediate visibility**: Instructors can instantly see if tracking is active
2. **Actionable**: One-tap to open GPSgate Tracker when offline
3. **Contextual data**: Shows live speed/road when connected (confirms data is flowing)
4. **Consistent design**: Matches the amber/emerald styling used elsewhere in the app
