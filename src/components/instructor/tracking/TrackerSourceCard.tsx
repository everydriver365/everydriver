import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { TrackingProviderDropdown, TrackingProviderChoice } from "./TrackingProviderDropdown";
import { useLocationPermission } from "@/hooks/useLocationPermission";
import { logPhoneTrackingEvent } from "@/lib/phoneTrackingAudit";
import { ShieldCheck, ShieldAlert, ShieldQuestion, MapPin, Loader2 } from "lucide-react";

interface Props {
  instructorId: string;
  pupilId: string | null;
  activeProvider: string | null;
  onProviderChange: (choice: TrackingProviderChoice) => void;
  phoneStreamingConfirmed: boolean;
  onTogglePhoneStreaming: () => void;
}

export function TrackerSourceCard({
  instructorId,
  pupilId,
  activeProvider,
  onProviderChange,
  phoneStreamingConfirmed,
  onTogglePhoneStreaming,
}: Props) {
  const isPhone = activeProvider === "phone";
  const { status, error, request } = useLocationPermission({ instructorId, pupilId });
  const [busy, setBusy] = useState(false);

  const allowed = status === "granted";
  const unavailable = status === "unavailable";

  const handleToggleAllow = async (checked: boolean) => {
    if (!checked) {
      // Browser cannot revoke; guide user.
      return;
    }
    if (status === "granted") return;
    setBusy(true);
    await request();
    setBusy(false);
  };

  const StatusIcon = unavailable
    ? MapPin
    : allowed
    ? ShieldCheck
    : status === "denied"
    ? ShieldAlert
    : status === "unknown"
    ? Loader2
    : ShieldQuestion;

  const statusColor = allowed
    ? "#047857"
    : status === "denied"
    ? "#B91C1C"
    : unavailable
    ? "#374151"
    : "#92400E";

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "0.5px solid #E5E5EA",
        borderRadius: 14,
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#6E6E73",
            letterSpacing: 0.4,
            textTransform: "uppercase",
          }}
        >
          Tracker source
        </span>
        <TrackingProviderDropdown
          instructorId={instructorId}
          value={activeProvider === "radius" ? "radius" : "phone"}
          onChange={onProviderChange}
        />
      </div>

      {isPhone && (
        <>
          {/* Allow-location switch row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 12px",
              background: "#F8FAFC",
              border: "0.5px solid #E5E7EB",
              borderRadius: 12,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: "#FFFFFF",
                border: `0.5px solid ${statusColor}33`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <StatusIcon
                size={16}
                color={statusColor}
                className={status === "unknown" ? "animate-spin" : ""}
              />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A" }}>
                Allow location in app
              </div>
              <div style={{ fontSize: 11, color: "#64748B", marginTop: 2, lineHeight: 1.35 }}>
                {error
                  ? error
                  : allowed
                  ? "Location is allowed. Phone GPS is ready."
                  : status === "denied"
                  ? "Blocked. Enable location for this site/app in settings, then retry."
                  : unavailable
                  ? "This device doesn't expose GPS."
                  : "Required so phone GPS can track lessons."}
              </div>
            </div>
            <Switch
              checked={allowed}
              disabled={busy || unavailable}
              onCheckedChange={handleToggleAllow}
              aria-label="Allow location"
            />
          </div>

          {/* Start/stop is now driven by the primary tracking CTA below — no duplicate button here. */}

          {(status === "prompt" || status === "denied") && (
            <button
              type="button"
              onClick={async () => {
                setBusy(true);
                const next = await request();
                setBusy(false);
                void logPhoneTrackingEvent({
                  instructorId,
                  pupilId,
                  event: "permission_changed",
                  status: next,
                });
              }}
              disabled={busy}
              style={{
                background: "transparent",
                color: "#3D55A1",
                border: "0.5px solid #3D55A1",
                borderRadius: 12,
                padding: "9px 14px",
                fontSize: 12,
                fontWeight: 600,
                cursor: busy ? "default" : "pointer",
                opacity: busy ? 0.7 : 1,
              }}
            >
              {busy ? "Requesting…" : status === "denied" ? "Retry permission" : "Allow location"}
            </button>
          )}
        </>
      )}
    </div>
  );
}
