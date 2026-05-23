import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { useVehicleHealth } from "@/hooks/useVehicleHealth";
import { AlertTriangle } from "lucide-react";
import { enrichFaultCode } from "@/lib/obdCodeLookup";
import { usePupilLessonHistory, type PupilLessonHistoryEntry } from "@/hooks/usePupilLessonHistory";
import { PreviousLessonModal } from "./PreviousLessonModal";
import { UpNextLiveMapStrip } from "./UpNextLiveMapStrip";
import { parse as parseDateFn } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  AlertCircle,
  Copy,
  Navigation as NavIcon,
  Phone,
  MapPin,
  MessageSquare,
  ClipboardList,
  Send,
  Clock,
  CheckCheck,
  CloudOff,
  Cloud,
  CloudSun,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Snowflake,
  Sun,
  Wind,
  Eye,
  Car,
  History,
  StickyNote,
  RefreshCw,
  XCircle,
  PoundSterling,
  type LucideIcon,
  ChevronRight,
} from "lucide-react";
import { useLessonWeather } from "@/hooks/useLessonWeather";
import { useDrivingAlerts, type DrivingAlert } from "@/hooks/useDrivingAlerts";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useTrafficETA } from "@/hooks/useTrafficETA";
import { CancelLessonDialog } from "./CancelLessonDialog";
import { RescheduleLessonSheet } from "./RescheduleLessonSheet";
import { RunningLateSheet } from "./RunningLateSheet";
import { toast } from "sonner";
import { haptics } from "@/lib/haptics";

/* Brand tokens */
const RED = "#B23A3F";
const BLUE = "#3D55A1";
const CHARCOAL = "#2B2B2B";
const MUTED = "#5B6B8A";
const BORDER = "rgba(26,82,160,0.10)";
const ROW_BORDER = "#F0F3F8";
const BLUE_TINT = "#EEF3FF";
const FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", sans-serif';

interface Props {
  lessonId: string;
  pupilId: string;
  pupilName: string;
  pupilPhone: string | null;
  pickupLocation: string | null;
  pickupPostcode: string | null;
  pickupWhat3words?: string | null;
  pickupNotes?: string | null;
  startTime: string;
  durationMinutes: number;
  accountBalance: number;
  prepaidHours: number;
  checkInStatus: string | null;
  lessonStatus: string | null;
  lastLessonPlan: string | null;
  instructorId: string;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        color: MUTED,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        padding: "14px 16px 8px",
      }}
    >
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ height: 0.5, background: ROW_BORDER, margin: "0 16px" }} />;
}

function Banner({
  bg,
  color,
  Icon,
  children,
}: {
  bg: string;
  color: string;
  Icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        margin: "0 16px 8px",
        background: bg,
        color,
        borderRadius: 12,
        padding: "10px 12px",
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      <Icon size={16} strokeWidth={2.4} /> {children}
    </div>
  );
}

function ActionTile({
  Icon,
  label,
  onClick,
  active,
  disabled,
}: {
  Icon: LucideIcon;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        background: active ? BLUE_TINT : "#F2F4F8",
        border: "none",
        borderRadius: 12,
        aspectRatio: "1 / 1",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        color: active ? BLUE : CHARCOAL,
        padding: 8,
      }}
    >
      <Icon size={20} strokeWidth={2.2} color={active ? BLUE : CHARCOAL} />
      <span style={{ fontSize: 11, fontWeight: 600 }}>{label}</span>
    </button>
  );
}

function StatChip({
  Icon,
  value,
  label,
}: {
  Icon: LucideIcon;
  value: string;
  label: string;
}) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: `0.5px solid ${BORDER}`,
        borderRadius: 20,
        padding: "8px 12px",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        flexShrink: 0,
      }}
    >
      <Icon size={14} strokeWidth={2.2} color={BLUE} />
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: CHARCOAL }}>{value}</span>
        <span style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>{label}</span>
      </div>
    </div>
  );
}

const WEATHER_ICONS: Record<string, LucideIcon> = {
  Sun, CloudSun, Cloud, CloudFog, CloudDrizzle, CloudRain, CloudSnow, Snowflake, CloudLightning,
};

const WEATHER_TINTS: Record<string, { bg: string; fg: string }> = {
  clear: { bg: "#FFF8E6", fg: "#B8860B" },
  cloudy: { bg: "#EEF3FF", fg: BLUE },
  rain: { bg: "#E8F1FB", fg: "#3D55A1" },
  snow: { bg: "#F0F6FF", fg: "#3A6FB5" },
  fog: { bg: "#F2F2EE", fg: "#5B6B6B" },
  storm: { bg: "#FBECEC", fg: "#A03030" },
};

function WeatherRow({
  loading,
  data,
  hasPostcode,
}: {
  loading: boolean;
  data: ReturnType<typeof useLessonWeather>["data"];
  hasPostcode: boolean;
}) {
  if (loading) {
    return (
      <div
        style={{
          margin: "0 16px 12px",
          background: "#F1F4F8",
          borderRadius: 12,
          padding: "10px 12px",
          height: 56,
          opacity: 0.6,
        }}
      />
    );
  }

  if (!hasPostcode || !data) {
    return (
      <div
        style={{
          margin: "0 16px 12px",
          background: BLUE_TINT,
          borderRadius: 12,
          padding: "10px 12px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <CloudOff size={18} color={MUTED} strokeWidth={2.2} />
        <div style={{ flex: 1, fontSize: 12, color: MUTED }}>
          {hasPostcode ? "Weather unavailable" : "Add a pick-up postcode for live weather"}
        </div>
      </div>
    );
  }

  const Icon = WEATHER_ICONS[data.icon] || Cloud;
  const tint = WEATHER_TINTS[data.category] || WEATHER_TINTS.cloudy;

  return (
    <div
      style={{
        margin: "0 16px 12px",
        background: tint.bg,
        borderRadius: 12,
        padding: "10px 12px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <Icon size={22} color={tint.fg} strokeWidth={2.2} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: CHARCOAL, lineHeight: 1.2 }}>
          {data.description} · {data.temperature}°C
        </div>
        <div
          style={{
            fontSize: 11,
            color: MUTED,
            marginTop: 3,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Wind size={11} strokeWidth={2.2} />
            {data.windSpeedMph} mph
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Eye size={11} strokeWidth={2.2} />
            {data.visibilityMi} mi
          </span>
        </div>
      </div>
    </div>
  );
}

const ALERT_TINTS: Record<DrivingAlert["severity"], { bg: string; fg: string; border: string }> = {
  low: { bg: "#EEF3FF", fg: "#3D55A1", border: "rgba(26,82,160,0.18)" },
  moderate: { bg: "#FFF6E6", fg: "#A86A00", border: "rgba(168,106,0,0.22)" },
  severe: { bg: "#FBECEC", fg: "#A03030", border: "rgba(160,48,48,0.25)" },
};

function AlertsRow({ alerts, loading }: { alerts: DrivingAlert[]; loading: boolean }) {
  if (loading && alerts.length === 0) return null;
  if (!alerts || alerts.length === 0) {
    return (
      <div
        style={{
          margin: "0 16px 12px",
          background: "#EEF7EE",
          borderRadius: 12,
          padding: "10px 12px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontSize: 12,
          color: "#2E6B3E",
        }}
      >
        <CheckCircle2 size={16} strokeWidth={2.2} />
        No traffic or weather alerts in your area
      </div>
    );
  }

  return (
    <div style={{ margin: "0 16px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
      {alerts.slice(0, 3).map((a, i) => {
        const tint = ALERT_TINTS[a.severity] || ALERT_TINTS.moderate;
        const Icon = a.type === "traffic" || a.type === "road" ? NavIcon : CloudRain;
        return (
          <div
            key={i}
            style={{
              background: tint.bg,
              border: `0.5px solid ${tint.border}`,
              borderRadius: 12,
              padding: "10px 12px",
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
            }}
          >
            <Icon size={16} color={tint.fg} strokeWidth={2.2} style={{ marginTop: 1, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: CHARCOAL, lineHeight: 1.25 }}>
                {a.title}
                {a.delay ? ` · +${a.delay}m delay` : ""}
              </div>
              <div style={{ fontSize: 11, color: MUTED, marginTop: 2, lineHeight: 1.35 }}>
                {a.description}
                {a.roadName ? ` · ${a.roadName}` : ""}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}


export function UpNextExpanded({
  lessonId,
  pupilId,
  pupilName,
  pupilPhone,
  pickupLocation,
  pickupPostcode,
  pickupWhat3words,
  pickupNotes,
  startTime,
  durationMinutes,
  accountBalance,
  prepaidHours,
  checkInStatus,
  lessonStatus,
  lastLessonPlan,
  instructorId,
}: Props) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [lateOpen, setLateOpen] = useState(false);
  const [selectedHistoryLesson, setSelectedHistoryLesson] = useState<PupilLessonHistoryEntry | null>(null);
  const lessonHistoryQuery = usePupilLessonHistory(pupilId, 5);

  const eta = useTrafficETA(pickupPostcode);
  const weather = useLessonWeather(pickupPostcode);
  const drivingAlerts = useDrivingAlerts(instructorId);
  const { devices: obdDevices } = useVehicleHealth();
  const obdDevice = useMemo(() => {
    if (!obdDevices || obdDevices.length === 0) return null;
    const connected = obdDevices.filter((d) => d.is_connected);
    const withDiag = obdDevices.filter((d) => d.last_diagnostics_at != null);
    const sortBySeen = (arr: typeof obdDevices) =>
      [...arr].sort((a, b) => {
        const ta = a.last_seen_at ? new Date(a.last_seen_at).getTime() : 0;
        const tb = b.last_seen_at ? new Date(b.last_seen_at).getTime() : 0;
        return tb - ta;
      });
    return sortBySeen(connected)[0] || sortBySeen(withDiag)[0] || sortBySeen(obdDevices)[0] || null;
  }, [obdDevices]);
  const etaMinutes = eta.durationMinutes || 0;
  const fullAddress = [pickupLocation, pickupPostcode].filter(Boolean).join(", ");
  const lessonFee = (durationMinutes / 60) * 40;

  const debt = accountBalance < 0 ? Math.abs(accountBalance) : 0;
  const isPaid = debt === 0 || prepaidHours > 0;
  const norm = (lessonStatus || "").toLowerCase();
  const firstName = (pupilName || "").split(/\s+/)[0] || "there";

  const sendSMS = (msg: string) => {
    if (!pupilPhone) return;
    const a = document.createElement("a");
    a.href = `sms:${pupilPhone}?body=${encodeURIComponent(msg)}`;
    a.click();
  };

  const copyAddress = () => {
    if (!fullAddress) return;
    navigator.clipboard.writeText(fullAddress).catch(() => {});
    toast.success("Address copied");
  };

  const navigateMap = () => {
    const q = encodeURIComponent(fullAddress);
    if (q) window.open(`https://www.google.com/maps/dir/?api=1&destination=${q}`, "_blank");
  };

  const callPupil = () => {
    if (!pupilPhone) return;
    const a = document.createElement("a");
    a.href = `tel:${pupilPhone}`;
    a.click();
  };
  const messagePupil = () => {
    if (pupilPhone) {
      const a = document.createElement("a");
      a.href = `sms:${pupilPhone}`;
      a.click();
    } else {
      navigate(`/instructor/messages?pupilId=${pupilId}`);
    }
  };
  const openPrep = () => navigate(`/instructor/pupils/${pupilId}?tab=plan`);

  const onMyWay = async () => {
    setBusyAction("on_the_way");
    try {
      const etaClock = etaMinutes > 0
        ? format(new Date(Date.now() + etaMinutes * 60000), "HH:mm")
        : null;
      const message = etaClock
        ? `Hi ${firstName}, on the way — ETA ${etaClock}.`
        : `Hi ${firstName}, on the way.`;
      sendSMS(message);
      await supabase.from("scheduled_lessons").update({ status: "en_route" }).eq("id", lessonId);
      supabase.functions.invoke("notify-pupil", { body: { pupilId, type: "en_route" } }).catch(() => {});
      try { haptics.medium(); } catch {}
      qc.invalidateQueries({ queryKey: ["next-lesson-details"] });
      qc.invalidateQueries({ queryKey: ["today-remaining-lessons"] });
      toast.success(etaClock ? `On the way · ETA ${etaClock}` : "On the way");
    } catch {
      toast.error("Failed to update");
    } finally {
      setBusyAction(null);
    }
  };

  const arrived = async () => {
    setBusyAction("arrived");
    try {
      await supabase.from("scheduled_lessons").update({ status: "arrived" }).eq("id", lessonId);
      supabase.functions.invoke("notify-pupil", { body: { pupilId, type: "arrived" } }).catch(() => {});
      sendSMS(`Hi ${firstName}, I'm outside and ready when you are! 🚗`);
      try { haptics.medium(); } catch {}
      qc.invalidateQueries({ queryKey: ["next-lesson-details"] });
      qc.invalidateQueries({ queryKey: ["today-remaining-lessons"] });
      toast.success("Marked as arrived");
    } catch {
      toast.error("Failed to update");
    } finally {
      setBusyAction(null);
    }
  };

  const runningLate = () => setLateOpen(true);

  const chasePayment = () => {
    supabase.functions
      .invoke("notify-pupil", { body: { pupilId, type: "payment_reminder" } })
      .catch(() => {});
    sendSMS(`Hi ${firstName}, just a quick reminder there's £${debt.toFixed(0)} outstanding on your lesson account. Thanks!`);
    toast.success("Payment reminder sent");
  };
  const markPaid = () => {
    navigate(`/instructor/pupils/${pupilId}?tab=payments`);
  };

  const onMyWayActive = norm === "on_the_way" || norm === "en_route";
  const lateActive = norm === "running_late" || norm === "late";
  const arrivedActive = norm === "arrived";

  const PFONT = 'Poppins, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif';
  const BG = "#F2F4F8";
  const CARD_BORDER = "#d0d3d8";
  const DIV = "#ebebeb";
  const BTN_BORDER = "#c8cdd6";
  const TEXT = "#1a1a1f";
  const LABEL = "#999";
  const PRIMARY = "#2952b3";
  const PRIMARY_TINT = "#e8eefb";
  const PAY_BG = "#fbe8e8";
  const PAY_BORDER = "#f5c5c5";
  const PAY_TEXT = "#c9302c";

  const statusBtn = (opts: {
    Icon: LucideIcon; label: string; onClick: () => void; disabled?: boolean;
    active?: boolean; activeBg?: string; activeBorder?: string; activeColor?: string;
    solidBg?: string; solidBorder?: string; solidColor?: string;
    flex?: number; shadow?: boolean; ctaFlex?: boolean;
  }) => {
    const { Icon, label, onClick, disabled, active, activeBg, activeBorder, activeColor, solidBg, solidBorder, solidColor, flex = 1, shadow, ctaFlex } = opts;
    const bg = solidBg ?? (active ? (activeBg || "#fff") : "#fff");
    const bd = solidBorder ?? (active ? (activeBorder || "#e3e6ec") : "#e3e6ec");
    const fg = solidColor ?? (active ? (activeColor || TEXT) : "#3a3f4a");
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`upnext-status-btn${ctaFlex ? " upnext-status-btn--cta" : ""}`}
        style={{
          flex, minWidth: 0,
          height: "var(--ub-h, 36px)",
          background: bg,
          border: `1px solid ${bd}`,
          borderRadius: 10,
          padding: "0 var(--ub-px, 10px)",
          fontFamily: PFONT,
          fontSize: "var(--ub-fs, 12px)",
          fontWeight: 600,
          letterSpacing: "-0.01em",
          color: fg,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "var(--ub-gap, 6px)",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.45 : 1,
          boxShadow: shadow ? "0 1px 2px rgba(41,82,179,0.18)" : "none",
          transition: "background 150ms, border-color 150ms, box-shadow 150ms",
        }}
      >
        <Icon size={13} strokeWidth={1.9} style={{ width: "var(--ub-ic, 13px)", height: "var(--ub-ic, 13px)", flexShrink: 0 }} />
        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
      </button>
    );
  };

  const SectLabel = ({ children, color = LABEL }: { children: React.ReactNode; color?: string }) => (
    <div style={{ fontSize: 10, fontWeight: 600, color, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8, fontFamily: PFONT }}>
      {children}
    </div>
  );

  const weatherData = weather.data;
  const WIcon = weatherData ? (WEATHER_ICONS[weatherData.icon] || Cloud) : Sun;
  const alertCount = drivingAlerts.alerts?.length || 0;

  // Vehicle data
  const v = obdDevice?.vehicle;
  const vehicleTitle = obdDevice
    ? ([v?.registration, [v?.make, v?.model].filter(Boolean).join(" ") || null].filter(Boolean).join(" · ") || obdDevice.device_name || "Vehicle")
    : "Not connected";
  const vehicleStats: string[] = [];
  if (obdDevice?.last_battery_voltage != null) vehicleStats.push(`${obdDevice.last_battery_voltage.toFixed(1)}V`);
  else if (obdDevice?.last_battery_percent != null) vehicleStats.push(`Batt ${Math.round(obdDevice.last_battery_percent)}%`);
  if (obdDevice?.last_ecu_odometer_km != null) vehicleStats.push(`${Math.round(obdDevice.last_ecu_odometer_km * 0.621371).toLocaleString()} mi`);

  return (
    <div
      style={{
        fontFamily: PFONT,
        animation: "upnext-fade 200ms ease-out",
        background: BG,
        padding: 12,
        borderRadius: 16,
      }}
    >
      <style>{`
        @keyframes upnext-fade { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .upnext-status-row { display: flex; gap: 6px; }
        @media (max-width: 380px) {
          .upnext-status-btn { --ub-h: 34px; --ub-fs: 11.5px; --ub-px: 8px; --ub-gap: 5px; --ub-ic: 12px; }
        }
        @media (max-width: 340px) {
          .upnext-status-row { gap: 4px; }
          .upnext-status-btn { --ub-h: 32px; --ub-fs: 11px; --ub-px: 6px; --ub-gap: 4px; --ub-ic: 11px; }
          .upnext-status-btn--cta { flex: 1.3 !important; }
        }
      `}</style>

      {/* Status buttons — Row 1 (secondary signals) */}
      <div className="upnext-status-row" style={{ marginBottom: 6 }}>

        {statusBtn({
          Icon: MapPin,
          label: "Here",
          onClick: () => {
            const msg = `Hi ${firstName}, I'm outside whenever you're ready 👋`;
            if (pupilPhone) sendSMS(msg);
            supabase.functions
              .invoke("notify-pupil", { body: { pupilId, type: "arrived", message: msg } })
              .catch(() => {});
            try { haptics.medium(); } catch {}
            toast.success(pupilPhone ? "Text sent — pupil notified you're here" : "Pupil notified you're here");
          },
        })}

        {statusBtn({
          Icon: Send,
          label: "Going",
          onClick: onMyWay,
          disabled: busyAction === "on_the_way",
          active: onMyWayActive,
          activeBg: "#fff8e8",
          activeBorder: "#f59e0b",
          activeColor: "#854f0b",
        })}
        {statusBtn({
          Icon: Clock,
          label: "Late",
          onClick: runningLate,
          disabled: busyAction === "running_late",
          active: lateActive,
          activeBg: "#fff8e8",
          activeBorder: "#f59e0b",
          activeColor: "#854f0b",
        })}
      </div>

      {/* Status buttons — Row 2 (primary CTA) */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {statusBtn({
          Icon: ClipboardList,
          label: "Prep",
          onClick: openPrep,
          flex: 1,
        })}
        {statusBtn({
          Icon: CheckCheck,
          label: arrivedActive ? "Arrived" : "Arrived",
          onClick: arrived,
          disabled: busyAction === "arrived",
          solidBg: PRIMARY,
          solidBorder: PRIMARY,
          solidColor: "#fff",
          flex: 1.6,
          shadow: true,
        })}
      </div>


      {/* Map */}
      <div style={{ position: "relative", marginBottom: 12 }}>
        <div
          style={{
            height: 110,
            borderRadius: 14,
            background: "#dce8f5",
            border: "1px solid #c8d5e8",
            overflow: "hidden",
          }}
        >
          <UpNextLiveMapStrip
            pickupPostcode={pickupPostcode}
            pickupLocation={pickupLocation}
            instructorId={instructorId}
            hasDestination={!!fullAddress}
            onNavigate={(e) => { e.stopPropagation(); navigateMap(); }}
            height={110}
            hideEtaChip
          />

        </div>
        {/* ETA chip */}
        {(() => {
          const delay = eta.delayMinutes || 0;
          const severity = delay >= 6 ? "heavy" : delay >= 2 ? "light" : "none";
          const dotColor = severity === "heavy" ? "#dc2626" : severity === "light" ? "#f59e0b" : "#2d8a4e";
          const delayColor = severity === "heavy" ? "#dc2626" : "#f59e0b";
          return (
            <div
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                background: "#fff",
                borderRadius: 20,
                border: "1px solid #ddd",
                padding: "5px 10px",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                fontWeight: 600,
                color: TEXT,
                fontFamily: PFONT,
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor }} />
              <span>ETA {eta.isLoading ? "…" : eta.durationMinutes ? `${eta.durationMinutes}m` : "—"}</span>
              {severity !== "none" && eta.durationMinutes > 0 && (
                <span style={{ color: delayColor, fontWeight: 600 }}>· +{delay}</span>
              )}
            </div>
          );
        })()}

      </div>

      {/* Single white card */}
      <div
        style={{
          background: "#fff",
          border: `1px solid ${CARD_BORDER}`,
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        {/* Section 1 — Pick-up address */}
        <div style={{ padding: "12px 14px" }}>
          <SectLabel>Pick-up address</SectLabel>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <span
              style={{
                width: 28, height: 28,
                borderRadius: 8,
                background: PRIMARY_TINT,
                color: PRIMARY,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <NavIcon size={14} strokeWidth={2.2} />
            </span>
            <div style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 500, color: TEXT, lineHeight: 1.55, fontFamily: PFONT }}>
              {pickupLocation ? (
                <>
                  {pickupLocation.split(",").map((line, i) => (
                    <div key={i}>{line.trim()}</div>
                  ))}
                  {pickupPostcode && <div>{pickupPostcode}</div>}
                </>
              ) : (
                <div style={{ color: LABEL }}>{pickupPostcode || "Pick-up address not set"}</div>
              )}
            </div>
            <button
              type="button"
              onClick={copyAddress}
              style={{
                width: 28, height: 28,
                background: "#f0f1f4",
                border: "none",
                borderRadius: 8,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
              }}
              aria-label="Copy address"
            >
              <Copy size={14} color="#888" />
            </button>
          </div>
        </div>

        <div style={{ height: 1, background: DIV, margin: "0 14px" }} />

        {/* Section 2 — Lesson details */}
        <div style={{ padding: "12px 14px" }}>
          <SectLabel>Lesson details</SectLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {[
              { value: `${durationMinutes}m`, label: "Duration", color: TEXT },
              { value: `£${lessonFee.toFixed(0)}`, label: "Lesson fee", color: PRIMARY },
              { value: eta.isLoading ? "…" : eta.durationMinutes ? `${eta.durationMinutes}m` : "—", label: "Travel", color: "#2d8a4e" },
            ].map((t, i) => (
              <div key={i} style={{ background: BG, borderRadius: 9, padding: 10, textAlign: "center" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: t.color, fontFamily: PFONT }}>{t.value}</div>
                <div style={{ fontSize: 9, color: LABEL, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 4, fontFamily: PFONT }}>{t.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ height: 1, background: DIV, margin: "0 14px" }} />

        {/* Section 3 — Conditions + Vehicle (Payment below if outstanding) */}
        <div style={{ padding: "12px 14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {/* Conditions */}
            <div style={{ background: BG, borderRadius: 10, padding: 10 }}>
              <SectLabel>Conditions</SectLabel>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 6 }}>
                <WIcon size={14} color="#f59e0b" strokeWidth={2.2} style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 500, color: TEXT, lineHeight: 1.25, fontFamily: PFONT }}>
                    {weatherData ? `${weatherData.description} · ${weatherData.temperature}°C` : weather.isLoading ? "Loading…" : "—"}
                  </div>
                  {weatherData && (
                    <div style={{ fontSize: 9, color: "#aaa", marginTop: 2, fontFamily: PFONT }}>
                      {weatherData.windSpeedMph}mph · {weatherData.visibilityMi}mi
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <CheckCircle2 size={11} color={alertCount === 0 ? "#2d8a4e" : "#f59e0b"} strokeWidth={2.4} />
                <span style={{ fontSize: 9, fontWeight: 500, color: alertCount === 0 ? "#2d8a4e" : "#854f0b", fontFamily: PFONT }}>
                  {alertCount === 0 ? "No alerts" : `${alertCount} alert${alertCount > 1 ? "s" : ""}`}
                </span>
              </div>
            </div>

            {/* Vehicle */}
            <div style={{ background: BG, borderRadius: 10, padding: 10, cursor: obdDevice ? "pointer" : "default" }} onClick={() => obdDevice && navigate("/instructor/vehicle-health")}>
              <SectLabel>Vehicle</SectLabel>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: PRIMARY_TINT, color: PRIMARY, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 6 }}>
                <Car size={13} strokeWidth={2.2} />
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: TEXT, fontFamily: PFONT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {vehicleTitle}
              </div>
              {vehicleStats.length > 0 && (
                <div style={{ fontSize: 9, color: "#aaa", marginTop: 2, fontFamily: PFONT }}>
                  {vehicleStats.join(" · ")}
                </div>
              )}
              {obdDevice && (
                <div style={{ marginTop: 6, display: "inline-flex", alignItems: "center", gap: 4, background: "#e8f5ee", borderRadius: 20, padding: "2px 7px" }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#2d8a4e" }} />
                  <span style={{ fontSize: 9, fontWeight: 600, color: "#2d8a4e", fontFamily: PFONT }}>
                    {obdDevice.is_connected ? "Live" : "Offline"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Payment (only if outstanding) — full-width below */}
          {!isPaid && (
            <div style={{ marginTop: 8, background: PAY_BG, border: `1px solid ${PAY_BORDER}`, borderRadius: 10, padding: 12, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <SectLabel color={PAY_TEXT}>Payment</SectLabel>
                <div style={{ fontSize: 18, fontWeight: 700, color: PAY_TEXT, fontFamily: PFONT, lineHeight: 1.1, marginTop: 2 }}>£{debt.toFixed(0)}</div>
                <div style={{ fontSize: 10, color: PAY_TEXT, opacity: 0.7, fontFamily: PFONT, marginTop: 2 }}>Due before lesson</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={chasePayment}
                  style={{
                    background: PAY_TEXT, color: "#fff", border: "none",
                    borderRadius: 8, padding: "7px 12px",
                    fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: PFONT,
                  }}
                >
                  Chase payment
                </button>
                <button
                  type="button"
                  onClick={markPaid}
                  style={{
                    background: "#fff", color: TEXT, border: `1px solid ${CARD_BORDER}`,
                    borderRadius: 8, padding: "7px 12px",
                    fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: PFONT,
                  }}
                >
                  Mark as paid
                </button>
              </div>
            </div>
          )}
        </div>


        <div style={{ height: 1, background: DIV, margin: "0 14px" }} />

        {/* Section 4 — Previous lessons */}
        <div style={{ padding: "12px 14px" }}>
          <SectLabel>Previous lessons</SectLabel>
          <button
            type="button"
            onClick={() => navigate(`/instructor/pupils/${pupilId}`)}
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              padding: "6px 0",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              color: PRIMARY,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: PFONT,
            }}
          >
            <History size={14} strokeWidth={2} />
            View pupil history
          </button>
        </div>
      </div>

      {/* Bottom action buttons */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
        <button
          type="button"
          onClick={() => setRescheduleOpen(true)}
          style={{
            background: "#fff",
            color: PRIMARY,
            border: `1px solid ${CARD_BORDER}`,
            borderRadius: 12,
            padding: "11px 12px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: PFONT,
          }}
        >
          <RefreshCw size={14} strokeWidth={2} />
          Reschedule
        </button>
        <button
          type="button"
          onClick={() => setCancelOpen(true)}
          style={{
            background: PAY_BG,
            color: PAY_TEXT,
            border: `1px solid ${PAY_BORDER}`,
            borderRadius: 12,
            padding: "11px 12px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: PFONT,
          }}
        >
          <XCircle size={14} strokeWidth={2} />
          Cancel lesson
        </button>
      </div>

      <PreviousLessonModal
        open={!!selectedHistoryLesson}
        onOpenChange={(v) => !v && setSelectedHistoryLesson(null)}
        lesson={selectedHistoryLesson}
        pupilId={pupilId}
        pupilName={pupilName}
      />


      <CancelLessonDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        lessonId={lessonId}
        pupilId={pupilId}
        pupilName={pupilName}
        amountDue={lessonFee}
        pupilBalance={accountBalance}
        durationMinutes={durationMinutes}
        lessonDate={new Date().toISOString().slice(0, 10)}
        lessonTime={startTime}
        endTime={startTime}
        instructorId={instructorId}
        onCancelled={() => {
          qc.invalidateQueries({ queryKey: ["next-lesson-details"] });
          qc.invalidateQueries({ queryKey: ["today-remaining-lessons"] });
        }}
      />
      <RescheduleLessonSheet
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
        lessonId={lessonId}
        instructorId={instructorId}
        pupilName={pupilName}
        currentDate={new Date().toISOString().slice(0, 10)}
        currentTime={startTime}
        durationMinutes={durationMinutes}
        onRescheduled={() => {
          qc.invalidateQueries({ queryKey: ["next-lesson-details"] });
          qc.invalidateQueries({ queryKey: ["today-remaining-lessons"] });
          qc.invalidateQueries({ queryKey: ["instructor-calendar-events"] });
          qc.invalidateQueries({ queryKey: ["scheduled-lessons"] });
          qc.invalidateQueries({ queryKey: ["instructor-agenda"] });
        }}

      />
      <RunningLateSheet
        open={lateOpen}
        onOpenChange={setLateOpen}
        pupilName={pupilName}
        pupilPhone={pupilPhone}
        startTime={startTime}
        etaMinutes={etaMinutes}
        onMarkRunningLate={(delayMinutes, newEtaText) => {
          supabase.from("scheduled_lessons").update({ status: "running_late" }).eq("id", lessonId).then(() => {});
          supabase.functions.invoke("notify-pupil", { body: { pupilId, type: "running_late", delayMinutes, newEtaText } }).catch(() => {});
          qc.invalidateQueries({ queryKey: ["next-lesson-details"] });
          qc.invalidateQueries({ queryKey: ["today-remaining-lessons"] });
        }}
        onMarkOnWay={(etaText) => {
          supabase.from("scheduled_lessons").update({ status: "en_route" }).eq("id", lessonId).then(() => {});
          supabase.functions.invoke("notify-pupil", { body: { pupilId, type: "en_route", etaText } }).catch(() => {});
          qc.invalidateQueries({ queryKey: ["next-lesson-details"] });
        }}
      />
    </div>
  );
}
