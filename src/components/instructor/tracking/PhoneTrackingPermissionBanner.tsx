import { MapPin, ShieldAlert, ShieldCheck, ShieldQuestion, Loader2 } from "lucide-react";
import { useLocationPermission, LocationPermissionStatus } from "@/hooks/useLocationPermission";
import { useState } from "react";

interface Props {
  /** Whether phone tracking is the currently selected provider. */
  active: boolean;
  /** Optional callback when permission becomes granted. */
  onGranted?: () => void;
}

const META: Record<LocationPermissionStatus, { label: string; tone: string; bg: string; border: string; Icon: any; help: string }> = {
  unknown:     { label: "Checking…",            tone: "#6B7280", bg: "#F3F4F6", border: "#E5E7EB", Icon: Loader2,        help: "Checking location permission." },
  prompt:      { label: "Permission needed",    tone: "#92400E", bg: "#FEF3C7", border: "#FDE68A", Icon: ShieldQuestion, help: "Phone tracking needs permission to read your location." },
  granted:     { label: "Location allowed",     tone: "#047857", bg: "#D1FAE5", border: "#A7F3D0", Icon: ShieldCheck,    help: "Your phone is sharing GPS while a session is active." },
  denied:      { label: "Location blocked",     tone: "#B91C1C", bg: "#FEE2E2", border: "#FECACA", Icon: ShieldAlert,    help: "Enable location for this site in your browser/app settings, then tap Retry." },
  unavailable: { label: "GPS not available",    tone: "#374151", bg: "#F3F4F6", border: "#E5E7EB", Icon: MapPin,         help: "This device doesn't expose GPS to the browser." },
};

export function PhoneTrackingPermissionBanner({ active, onGranted }: Props) {
  const { status, error, request } = useLocationPermission();
  const [busy, setBusy] = useState(false);

  if (!active) return null;

  const meta = META[status];
  const Icon = meta.Icon;

  const handleRequest = async () => {
    setBusy(true);
    const next = await request();
    setBusy(false);
    if (next === "granted") onGranted?.();
  };

  return (
    <div
      role="status"
      style={{
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        padding: "12px 14px",
        background: meta.bg,
        border: `0.5px solid ${meta.border}`,
        borderRadius: 12,
        marginBottom: 12,
      }}
    >
      <div
        style={{
          width: 32, height: 32, borderRadius: 10,
          background: "#FFFFFF", border: `0.5px solid ${meta.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={16} color={meta.tone} className={status === "unknown" ? "animate-spin" : ""} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: meta.tone }}>
          {meta.label}
        </div>
        <div style={{ fontSize: 12, color: "#475569", marginTop: 2, lineHeight: 1.35 }}>
          {error || meta.help}
        </div>
        {(status === "prompt" || status === "denied") && (
          <button
            type="button"
            onClick={handleRequest}
            disabled={busy}
            style={{
              marginTop: 8,
              background: "#3D55A1",
              color: "#FFF",
              border: "none",
              borderRadius: 10,
              padding: "8px 14px",
              fontSize: 12,
              fontWeight: 600,
              cursor: busy ? "default" : "pointer",
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy
              ? "Requesting…"
              : status === "denied"
                ? "Retry"
                : "Allow location"}
          </button>
        )}
      </div>
    </div>
  );
}
