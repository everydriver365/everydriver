export type GpsDeviceStatus = "active" | "recent" | "stationary" | "offline";

/**
 * Classify a tracker into one of four states:
 *  - active:     last position < 60s ago (vehicle moving)
 *  - recent:     last position < 5 min ago
 *  - stationary: heartbeat < 2 min ago (parked but online), and last position < 30 min
 *  - offline:    no recent heartbeat and no recent position
 */
export function getDeviceStatus(
  lastSeen: string | null | undefined,
  heartbeat: string | null | undefined,
): GpsDeviceStatus {
  if (!lastSeen) return "offline";

  const now = Date.now();
  const trackDiff = (now - new Date(lastSeen).getTime()) / 1000;

  if (trackDiff < 60) return "active";
  if (trackDiff < 300) return "recent";

  if (heartbeat) {
    const beatDiff = (now - new Date(heartbeat).getTime()) / 1000;
    if (beatDiff < 120 && trackDiff < 1800) return "stationary";
  }

  return "offline";
}

export function isDeviceConnected(status: GpsDeviceStatus): boolean {
  return status === "active" || status === "recent" || status === "stationary";
}

export const STATUS_LABEL: Record<GpsDeviceStatus, string> = {
  active: "Active",
  recent: "Recent",
  stationary: "Stationary",
  offline: "Offline",
};
