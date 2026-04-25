import { WifiOff, RefreshCw, Radio, Car } from "lucide-react";
import { ConnectionStatusCard, type ConnectionState } from "@/components/instructor/ui/ConnectionStatusCard";

/**
 * GPS device connection card on the Tracking screen.
 *
 * Premium tile-system spec — see <ConnectionStatusCard>. State, label,
 * device name, and reconnect handler stay bound to the parent's logic.
 */

interface GPSStatusHeroProps {
  deviceName: string | null;
  isConnected: boolean;
  isParked?: boolean;
  lastSeenLabel: string;
  isReconnecting?: boolean;
  retryCount?: number;
  onManualReconnect?: () => void;
  trackingProvider?: string | null;
}

export function GPSStatusHero({
  deviceName,
  isConnected,
  isParked = false,
  isReconnecting = false,
  onManualReconnect,
  trackingProvider,
}: GPSStatusHeroProps) {
  const cleanDeviceName = deviceName
    ?.replace(/geotab/gi, "GPS")
    .replace(/\s+/g, " ")
    .trim() || null;

  const showReconnecting = isReconnecting && !isConnected && !isParked;

  // State drives icon tint + status dot.
  const state: ConnectionState = isConnected
    ? "connected"
    : isParked || showReconnecting
    ? "disconnected"
    : "error";

  const Icon = isConnected
    ? Radio
    : isParked
    ? Car
    : showReconnecting
    ? RefreshCw
    : WifiOff;

  const title = isConnected
    ? "Connected"
    : isParked
    ? "Parked"
    : showReconnecting
    ? "Reconnecting…"
    : "Offline";

  const deviceLabel = trackingProvider
    ? trackingProvider === "radius"
      ? "RADIUS"
      : trackingProvider.toUpperCase()
    : null;

  const detail = isParked
    ? cleanDeviceName || "Ignition off"
    : cleanDeviceName || "GPS tracker";

  const trailing =
    !isConnected && !showReconnecting && onManualReconnect ? (
      <button
        type="button"
        onClick={onManualReconnect}
        aria-label="Retry connection"
        style={{
          background: "transparent",
          border: "0.5px solid #E5E5EA",
          borderRadius: 8,
          padding: "6px 10px",
          fontSize: 12,
          fontWeight: 500,
          color: "#2B7BC8",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 4,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif',
        }}
      >
        <RefreshCw size={12} strokeWidth={2} />
        Retry
      </button>
    ) : undefined;

  return (
    <ConnectionStatusCard
      icon={Icon}
      state={state}
      title={title}
      deviceLabel={deviceLabel}
      detail={detail}
      trailing={trailing}
    />
  );
}
