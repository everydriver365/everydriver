import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Tag,
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
const RED = "#CC2229";
const BLUE = "#1A52A0";
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
  rain: { bg: "#E8F1FB", fg: "#1A52A0" },
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
  low: { bg: "#EEF3FF", fg: "#1A52A0", border: "rgba(26,82,160,0.18)" },
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

  const eta = useTrafficETA(pickupPostcode);
  const weather = useLessonWeather(pickupPostcode);
  const drivingAlerts = useDrivingAlerts(instructorId);
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

        <Divider />

        {/* SECTION 3 — Action grid */}
        <SectionLabel>Actions</SectionLabel>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 8,
            padding: "0 16px 8px",
          }}
        >
          <ActionTile Icon={NavIcon} label="Navigate" onClick={navigateMap} />
          <ActionTile Icon={Phone} label="Call" onClick={callPupil} disabled={!pupilPhone} />
          <ActionTile Icon={MessageSquare} label="Text" onClick={messagePupil} />
          <ActionTile Icon={ClipboardList} label="Prep" onClick={openPrep} />
          <ActionTile
            Icon={Send}
            label="On My Way"
            onClick={onMyWay}
            active={norm === "on_the_way" || norm === "en_route"}
            disabled={busyAction === "on_the_way"}
          />
          <ActionTile
            Icon={Clock}
            label="Running Later"
            onClick={runningLate}
            active={norm === "running_late" || norm === "late"}
            disabled={busyAction === "running_late"}
          />
        </div>
        <button
          type="button"
          onClick={arrived}
          disabled={busyAction === "arrived"}
          style={{
            width: "calc(100% - 32px)",
            margin: "0 16px 4px",
            height: 44,
            background: BLUE,
            color: "#FFFFFF",
            border: "none",
            borderRadius: 12,
            fontWeight: 700,
            fontSize: 14,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            cursor: "pointer",
            opacity: busyAction === "arrived" ? 0.6 : 1,
          }}
        >
          <CheckCheck size={16} strokeWidth={2.4} />
          {norm === "arrived" ? "Arrived ✓" : "Arrived"}
        </button>

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

        {/* SECTION 6 — Vehicle / OBD (placeholder) */}
        <SectionLabel>Vehicle</SectionLabel>
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

        <Divider />

        {/* SECTION 7 — Notes / last plan */}
        <SectionLabel>Previous lessons</SectionLabel>
        <div style={{ padding: "0 16px 12px" }}>
          {lastLessonPlan ? (
            <div
              style={{
                background: "#FAFBFD",
                border: `0.5px solid ${ROW_BORDER}`,
                borderRadius: 12,
                padding: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 6,
                  fontSize: 11,
                  color: MUTED,
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                <StickyNote size={12} /> Plan from last lesson
              </div>
              <div style={{ fontSize: 13, color: CHARCOAL, lineHeight: 1.45 }}>
                {lastLessonPlan}
              </div>
            </div>
          ) : (
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
          )}
        </div>

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
