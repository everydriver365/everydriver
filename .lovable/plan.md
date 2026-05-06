## Fix: Start lesson button stuck on "Waiting for GPS connection"

### Problem
On `/instructor/tracking` with the **Phone** tracker selected, the Start lesson button stays disabled forever. The gate requires `isConnected === true`, but `isConnected` is computed from the hardware device's GPS timestamp. With no Radius device, `device` is `null`, `secondsSinceTrack = 9999`, and `isConnected` is permanently `false`.

### Change
**`src/pages/InstructorLiveSession.tsx`** (around lines 1665–1669): treat the phone provider as always ready to start; phone GPS streaming begins after the session starts (and is already gated by the location-permission dialog).

```ts
const requiresPupil = selectedMode !== "testRoute";
const connectionReady = isPhoneProvider ? true : isConnected;
const canStart =
  (!requiresPupil || !!selectedPupilId) &&
  !isStarting &&
  (selectedMode === "recordTest" || connectionReady);
```

Radius behaviour unchanged — still waits for hardware heartbeat.
