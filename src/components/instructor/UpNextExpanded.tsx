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

  return (
    <div
      style={{
        padding: "0 14px 14px",
        fontFamily: FONT,
        animation: "upnext-fade 200ms ease-out",
      }}
    >
      <style>{`
        @keyframes upnext-fade { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 20,
          border: `0.5px solid ${BORDER}`,
          paddingBottom: 12,
          overflow: "hidden",
        }}
      >
        {/* Live mini map at top of expanded section */}
        <UpNextLiveMapStrip
          pickupPostcode={pickupPostcode}
          pickupLocation={pickupLocation}
          instructorId={instructorId}
          hasDestination={!!fullAddress}
          onNavigate={(e) => { e.stopPropagation(); navigateMap(); }}
          height={130}
        />

        {/* SECTION 1 — Status banners */}
        <div style={{ paddingTop: 14 }}>
          {checkInStatus === "confirmed" && (
            <Banner bg="#E8F8ED" color="#1A7A3C" Icon={CheckCircle2}>
              Lesson confirmed
            </Banner>
          )}
          {(checkInStatus === "pending" || !checkInStatus) && (
            <Banner bg="#FFF6E6" color="#B45309" Icon={AlertCircle}>
              Awaiting confirmation
            </Banner>
          )}
          {debt > 0 && (
            <Banner bg="#FFF0F0" color={RED} Icon={AlertCircle}>
              Payment not received · £{debt.toFixed(0)}
            </Banner>
          )}
        </div>

        <Divider />

        {/* SECTION — Action buttons (pill style matching Call/Text/Go) */}
        {(() => {
          const pill = (extra?: React.CSSProperties): React.CSSProperties => ({
            flex: 1,
            height: 36,
            borderRadius: 10,
            background: BLUE_TINT,
            color: BLUE,
            border: `0.5px solid ${BORDER}`,
            fontSize: 13,
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            cursor: "pointer",
            ...extra,
          });
          const activeStyle: React.CSSProperties = { background: BLUE, color: "#FFFFFF", border: "none" };
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 16px 8px" }}>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={openPrep} style={pill()}>
                  <ClipboardList size={13} strokeWidth={2.2} /> Prep
                </button>
                <button
                  type="button"
                  onClick={onMyWay}
                  disabled={busyAction === "on_the_way"}
                  style={pill({
                    ...(norm === "on_the_way" || norm === "en_route" ? activeStyle : {}),
                    opacity: busyAction === "on_the_way" ? 0.6 : 1,
                  })}
                >
                  <Send size={13} strokeWidth={2.2} /> On My Way
                </button>
                <button
                  type="button"
                  onClick={runningLate}
                  disabled={busyAction === "running_late"}
                  style={pill({
                    ...(norm === "running_late" || norm === "late" ? activeStyle : {}),
                    opacity: busyAction === "running_late" ? 0.6 : 1,
                  })}
                >
                  <Clock size={13} strokeWidth={2.2} /> Later
                </button>
              </div>
              <button
                type="button"
                onClick={arrived}
                disabled={busyAction === "arrived"}
                style={{
                  width: "100%",
                  height: 36,
                  background: BLUE,
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 13,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  cursor: "pointer",
                  opacity: busyAction === "arrived" ? 0.6 : 1,
                }}
              >
                <CheckCheck size={14} strokeWidth={2.4} />
                {norm === "arrived" ? "Arrived ✓" : "Arrived"}
              </button>
            </div>
          );
        })()}

        <Divider />

        {/* SECTION 2 — Pick-up address */}
        <SectionLabel>Pick-up address</SectionLabel>
        <button
          type="button"
          onClick={copyAddress}
          style={{
            width: "calc(100% - 32px)",
            margin: "0 16px 12px",
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            background: "transparent",
            border: "none",
            padding: 0,
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: BLUE_TINT,
              color: BLUE,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <NavIcon size={14} strokeWidth={2.2} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            {pickupLocation ? (
              <div style={{ fontSize: 13, color: CHARCOAL, fontWeight: 600, lineHeight: 1.4 }}>
                {pickupLocation.split(",").map((line, i) => (
                  <div key={i}>{line.trim()}</div>
                ))}
                {pickupPostcode && <div>{pickupPostcode}</div>}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: MUTED }}>
                {pickupPostcode || "Pick-up address not set"}
              </div>
            )}
          </div>
          <Copy size={14} color={MUTED} />
        </button>

        {(pickupWhat3words || pickupNotes) && (
          <div style={{ padding: "0 16px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
            {pickupWhat3words && (
              <a
                href={`https://what3words.com/${pickupWhat3words}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: BLUE_TINT,
                  borderRadius: 10,
                  padding: "8px 12px",
                  textDecoration: "none",
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 700, color: BLUE }}>///</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: BLUE, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {pickupWhat3words}
                </span>
              </a>
            )}
            {pickupNotes && (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  background: "#FFF8E6",
                  borderRadius: 10,
                  padding: "8px 12px",
                }}
              >
                <StickyNote size={14} color="#A66B00" strokeWidth={2.2} style={{ marginTop: 1, flexShrink: 0 }} />
                <div style={{ fontSize: 12, color: CHARCOAL, lineHeight: 1.4, whiteSpace: "pre-wrap" }}>
                  {pickupNotes}
                </div>
              </div>
            )}
          </div>
        )}

        <Divider />

        {/* SECTION 4 — Lesson details */}
        <SectionLabel>Lesson details</SectionLabel>
        <div
          style={{
            display: "flex",
            gap: 8,
            padding: "0 16px 12px",
            overflowX: "auto",
            scrollbarWidth: "none",
          }}
        >
          <StatChip Icon={Clock} value={`${durationMinutes}m`} label="Duration" />
          <StatChip Icon={PoundSterling} value={`£${lessonFee.toFixed(0)}`} label="Lesson fee" />
          <StatChip
            Icon={NavIcon}
            value={eta.isLoading ? "…" : eta.durationMinutes ? `${eta.durationMinutes}m` : "—"}
            label="Travel"
          />
        </div>

        <Divider />

        {/* SECTION 5 — Conditions */}
        <SectionLabel>Conditions</SectionLabel>
        <WeatherRow
          loading={weather.isLoading}
          data={weather.data}
          hasPostcode={!!pickupPostcode}
        />
        <AlertsRow alerts={drivingAlerts.alerts} loading={drivingAlerts.loading} />

        <Divider />

        {/* SECTION 6 — Vehicle / OBD */}
        <SectionLabel>Vehicle</SectionLabel>
        {(() => {
          if (!obdDevice) {
            return (
              <div
                style={{
                  margin: "0 16px 12px",
                  background: "#F1F4F8",
                  borderRadius: 12,
                  padding: "10px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  color: MUTED,
                  fontSize: 12,
                }}
              >
                <CloudOff size={16} strokeWidth={2.2} />
                OBD not connected
              </div>
            );
          }
          const d = obdDevice;
          const v = d.vehicle;
          const title = [
            v?.registration,
            [v?.make, v?.model].filter(Boolean).join(" ") || null,
          ]
            .filter(Boolean)
            .join(" · ") || d.device_name || "Vehicle";

          const stats: string[] = [];
          if (d.last_fuel_percent != null) stats.push(`Fuel ${Math.round(d.last_fuel_percent)}%`);
          if (d.last_battery_voltage != null) stats.push(`Batt ${d.last_battery_voltage.toFixed(1)}V`);
          else if (d.last_battery_percent != null) stats.push(`Batt ${Math.round(d.last_battery_percent)}%`);
          if (d.last_coolant_temp_c != null) stats.push(`${Math.round(d.last_coolant_temp_c)}°C`);
          if (d.last_ecu_odometer_km != null)
            stats.push(`${Math.round(d.last_ecu_odometer_km * 0.621371).toLocaleString()} mi`);

          const tyres = d.last_tire_pressure_json
            ? Object.values(d.last_tire_pressure_json).filter((n) => typeof n === "number")
            : [];
          const tyreWarn = tyres.length > 0 && tyres.some((p) => p < 28 || p > 40);
          const faults = (d.last_fault_codes || []).filter(Boolean);

          const ago = d.last_seen_at
            ? formatDistanceToNow(new Date(d.last_seen_at), { addSuffix: false })
            : null;

          return (
            <div
              onClick={() => navigate("/instructor/vehicle-health")}
              style={{
                margin: "0 16px 12px",
                background: BLUE_TINT,
                borderRadius: 12,
                padding: "10px 12px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
                cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Car size={14} color={BLUE} strokeWidth={2.2} />
                <div style={{ fontSize: 13, fontWeight: 700, color: CHARCOAL, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {title}
                </div>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: d.is_connected ? "#22A06B" : "#9AA5B8",
                    display: "inline-block",
                  }}
                />
                <span style={{ fontSize: 11, color: MUTED, fontWeight: 600 }}>
                  {d.is_connected ? "Live" : ago ? `${ago} ago` : "Offline"}
                </span>
              </div>
              {stats.length > 0 && (
                <div style={{ fontSize: 12, color: MUTED, fontWeight: 500 }}>
                  {stats.join(" · ")}
                </div>
              )}
              {(faults.length > 0 || tyreWarn) && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 2 }}>
                  {faults.length > 0 && (
                    <span
                      style={{
                        background: "rgba(204,34,41,0.10)",
                        color: RED,
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: 999,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <AlertTriangle size={11} strokeWidth={2.4} />
                      {faults.length === 1
                        ? `1 fault: ${faults[0].code}`
                        : `${faults.length} faults`}
                    </span>
                  )}
                  {tyreWarn && (
                    <span
                      style={{
                        background: "#FFF8E6",
                        color: "#A66B00",
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: 999,
                      }}
                    >
                      Tyre check
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })()}


        {obdDevice && (obdDevice.last_fault_codes?.length ?? 0) > 0 && (
          <>
            <Divider />
            <SectionLabel>Fault codes</SectionLabel>
            <div style={{ padding: "0 16px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
              {(obdDevice.last_fault_codes || []).map((f, i) => {
                const enriched = enrichFaultCode(f);
                const sev = (enriched.severity || "").toLowerCase();
                const isCritical = sev === "critical" || sev === "high";
                const isWarn = sev === "medium" || sev === "warning";
                const bg = isCritical
                  ? "rgba(204,34,41,0.08)"
                  : isWarn
                  ? "#FFF8E6"
                  : "#F1F4F8";
                const fg = isCritical ? RED : isWarn ? "#A66B00" : MUTED;
                return (
                  <div
                    key={`${enriched.code}-${i}`}
                    onClick={() => navigate("/instructor/vehicle-health")}
                    style={{
                      background: bg,
                      borderRadius: 12,
                      padding: "8px 12px",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      cursor: "pointer",
                    }}
                  >
                    <AlertTriangle size={14} color={fg} strokeWidth={2.4} style={{ marginTop: 2, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: fg }}>{enriched.code}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: fg, textTransform: "uppercase", letterSpacing: "0.04em", opacity: 0.8 }}>
                          {enriched.severity}
                        </span>
                        {enriched.source && (
                          <span style={{ fontSize: 10, color: MUTED, marginLeft: "auto" }}>{enriched.source}</span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: CHARCOAL, lineHeight: 1.4, marginTop: 2 }}>
                        {enriched.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <Divider />

        {/* SECTION 7 — Previous lessons */}
        <SectionLabel>Previous lessons</SectionLabel>
        <div style={{ padding: "0 16px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
          {lessonHistoryQuery.isLoading ? (
            <div style={{ height: 64, borderRadius: 12, background: "linear-gradient(90deg,#F1F4F8 0%,#FAFBFD 50%,#F1F4F8 100%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
          ) : (lessonHistoryQuery.data?.length ?? 0) === 0 ? (
            <button
              type="button"
              onClick={() => navigate(`/instructor/pupils/${pupilId}`)}
              style={{
                width: "100%",
                background: "transparent",
                border: `0.5px dashed ${BORDER}`,
                borderRadius: 12,
                padding: 12,
                color: MUTED,
                fontSize: 12,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                cursor: "pointer",
              }}
            >
              <History size={14} /> View pupil history
            </button>
          ) : (
            <>
              {(lessonHistoryQuery.data || []).map((l) => {
                const dateLabel = (() => {
                  try {
                    return format(new Date(l.lesson_date), "EEE d MMM");
                  } catch {
                    return l.lesson_date;
                  }
                })();
                const timeLabel = l.start_time
                  ? (() => {
                      try {
                        return format(parseDateFn(l.start_time.slice(0, 5), "HH:mm", new Date()), "h:mm a");
                      } catch {
                        return l.start_time;
                      }
                    })()
                  : "";
                const topics = l.skills_practiced || [];
                const isCancelled = l.status === "cancelled";
                const cancelReason = isCancelled
                  ? (l.cancellation_reason || "").split(" — ")[0].trim() || "No reason given"
                  : "";
                const cancelNote = isCancelled
                  ? (l.cancellation_note || "").trim()
                  : "";
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => !isCancelled && setSelectedHistoryLesson(l)}
                    style={{
                      textAlign: "left",
                      background: isCancelled ? "#FEF4F4" : "#FAFBFD",
                      border: `0.5px solid ${isCancelled ? "#F4D4D4" : ROW_BORDER}`,
                      borderRadius: 12,
                      padding: 12,
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      cursor: isCancelled ? "default" : "pointer",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: CHARCOAL, flex: 1, minWidth: 0 }}>
                        {dateLabel}
                        {timeLabel && <span style={{ color: MUTED, fontWeight: 500 }}> · {timeLabel}</span>}
                      </div>
                      {l.rating != null && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#A66B00", background: "#FFF8E6", padding: "2px 8px", borderRadius: 999 }}>
                          ★ {l.rating}
                        </span>
                      )}
                      {isCancelled ? (
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#B42318", background: "#FEE4E2", padding: "2px 8px", borderRadius: 999 }}>
                          Cancelled
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 600, color: MUTED, background: "#F1F4F8", padding: "2px 8px", borderRadius: 999 }}>
                          {l.duration_minutes} min
                        </span>
                      )}
                    </div>
                    {isCancelled ? (
                      <div style={{ fontSize: 12, color: "#B42318", lineHeight: 1.4 }}>
                        Cancelled · {cancelReason}{cancelNote ? ` · ${cancelNote}` : ""}
                      </div>
                    ) : (
                      <>
                        {topics.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {topics.slice(0, 3).map((t, i) => (
                              <span key={`${t}-${i}`} style={{ background: BLUE_TINT, color: BLUE, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 999 }}>
                                {t}
                              </span>
                            ))}
                            {topics.length > 3 && (
                              <span style={{ background: "#F1F4F8", color: MUTED, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 999 }}>
                                +{topics.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                        {l.notes && (
                          <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {l.notes}
                          </div>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => navigate(`/instructor/pupils/${pupilId}`)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: BLUE,
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "4px 0 0",
                  cursor: "pointer",
                  alignSelf: "flex-end",
                }}
              >
                View all lessons →
              </button>
            </>
          )}
        </div>
        <PreviousLessonModal
          open={!!selectedHistoryLesson}
          onOpenChange={(v) => !v && setSelectedHistoryLesson(null)}
          lesson={selectedHistoryLesson}
          pupilId={pupilId}
          pupilName={pupilName}
        />


        {/* SECTION 8 — Payment status */}
        {!isPaid && (
          <>
            <Divider />
            <SectionLabel>Payment</SectionLabel>
            <div style={{ padding: "0 16px 12px" }}>
              <div
                style={{
                  background: "#FFF0F0",
                  borderRadius: 12,
                  padding: "10px 12px",
                  marginBottom: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <PoundSterling size={16} color={RED} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: RED }}>
                    £{debt.toFixed(0)} outstanding
                  </div>
                  <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
                    Due before lesson
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={chasePayment}
                  style={{
                    flex: 1,
                    height: 40,
                    background: RED,
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: 12,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Chase Payment
                </button>
                <button
                  type="button"
                  onClick={markPaid}
                  style={{
                    flex: 1,
                    height: 40,
                    background: "#FFFFFF",
                    color: BLUE,
                    border: `1px solid ${BLUE}`,
                    borderRadius: 12,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Mark as Paid
                </button>
              </div>
            </div>
          </>
        )}

        <Divider />

        {/* SECTION 9 — Footer */}
        <div style={{ display: "flex", gap: 8, padding: "12px 16px 4px" }}>
          <button
            type="button"
            onClick={() => setRescheduleOpen(true)}
            style={{
              flex: 1,
              height: 44,
              background: "#FFFFFF",
              color: BLUE,
              border: `1px solid ${BLUE}`,
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 13,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              cursor: "pointer",
            }}
          >
            <RefreshCw size={14} /> Reschedule
          </button>
          <button
            type="button"
            onClick={() => setCancelOpen(true)}
            style={{
              flex: 1,
              height: 44,
              background: "#FFFFFF",
              color: RED,
              border: `1px solid ${RED}`,
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 13,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              cursor: "pointer",
            }}
          >
            <XCircle size={14} /> Cancel Lesson
          </button>
        </div>
      </div>

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
