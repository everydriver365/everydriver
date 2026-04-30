import { useState, useEffect, useRef } from "react";
import { format, parse, isToday, isTomorrow, parseISO } from "date-fns";
import { a11yPx } from "@/lib/a11yScale";
import {
  Clock, Phone, MessageSquare, X, Navigation, Car, Loader2, ChevronDown,
  Send, Play, MapPin, Calendar, ClipboardList,
  Hourglass, PoundSterling, MessageCircle, AlertTriangle, CheckCircle2,
  Thermometer, Battery, Wifi, BookOpen, Banknote, ChevronRight, Mail,
} from "lucide-react";
import { PostcodeMapPreview } from "@/components/instructor/PostcodeMapPreview";
import { GoogleMapPreview } from "@/components/instructor/GoogleMapPreview";
import { useAdminUnreadForPupil } from "@/hooks/useAdminUnreadForPupil";
import { motion, AnimatePresence } from "framer-motion";
import { ExpandChevron } from "@/components/ui/ExpandChevron";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { CancelLessonDialog } from "./CancelLessonDialog";
import { RescheduleLessonSheet } from "./RescheduleLessonSheet";
import { EndLessonWizard } from "./EndLessonWizard";
import { RunningLateSheet } from "./RunningLateSheet";
import { supabase } from "@/integrations/supabase/client";
import { LessonRouteRecorder } from "./LessonRouteRecorder";

import { useTrafficETA } from "@/hooks/useTrafficETA";
import { usePupilUnreadCount } from "@/hooks/usePupilUnreadCount";
import { useRunningLateDetection } from "@/hooks/useRunningLateDetection";
import { useDrivingAlerts } from "@/hooks/useDrivingAlerts";
import { useVehicleHealth } from "@/hooks/useVehicleHealth";
import { LessonCheckInBadge } from "./LessonCheckInBadge";
import { haptics } from "@/lib/haptics";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Construction, Ban, Smartphone } from "lucide-react";

const TRACKER_DISMISSED_KEY = "tracker_reminder_dismissed";
const TRACKER_DATE_KEY = "tracker_reminder_date";

const isTrackerDismissed = (lessonId: string): boolean => {
  try {
    const today = new Date().toDateString();
    if (localStorage.getItem(TRACKER_DATE_KEY) !== today) return false;
    const dismissed = JSON.parse(localStorage.getItem(TRACKER_DISMISSED_KEY) || "{}");
    return dismissed[lessonId] === true;
  } catch { return false; }
};

const dismissTracker = (lessonId: string) => {
  try {
    const today = new Date().toDateString();
    const storedDate = localStorage.getItem(TRACKER_DATE_KEY);
    const dismissed = storedDate === today
      ? JSON.parse(localStorage.getItem(TRACKER_DISMISSED_KEY) || "{}")
      : {};
    dismissed[lessonId] = true;
    localStorage.setItem(TRACKER_DISMISSED_KEY, JSON.stringify(dismissed));
    localStorage.setItem(TRACKER_DATE_KEY, today);
  } catch {
    localStorage.setItem(TRACKER_DISMISSED_KEY, JSON.stringify({ [lessonId]: true }));
  }
};

interface NextUpTileProps {
  lessonId: string;
  pupilId: string;
  pupilName: string;
  pupilProfileImage: string | null;
  pupilPhone: string | null;
  lessonDate: string;
  pickupPostcode: string | null;
  pickupLocation: string | null;
  startTime: string;
  minutesUntil: number;
  accountBalance: number;
  prepaidHours: number;
  durationMinutes?: number;
  instructorId?: string;
  checkInStatus?: string | null;
  lastLessonPlan?: string | null;
}

function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function toSentenceName(name: string): string {
  return name
    .toLowerCase()
    .split(/\s+/)
    .map(w => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function formatMetaDate(dateStr: string): string {
  try {
    const d = parseISO(dateStr);
    if (isToday(d)) return "Today";
    if (isTomorrow(d)) return "Tomorrow";
    return format(d, "EEE d MMM");
  } catch { return dateStr; }
}

function formatHoursLong(minutes: number): string {
  const h = minutes / 60;
  return Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`;
}

export function NextUpTile({
  lessonId, pupilId, pupilName, pupilProfileImage, pupilPhone,
  lessonDate, pickupPostcode, pickupLocation, startTime,
  minutesUntil, accountBalance, prepaidHours, durationMinutes = 60, instructorId,
  checkInStatus, lastLessonPlan,
}: NextUpTileProps) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [lateSheetOpen, setLateSheetOpen] = useState(false);
  const [showGPSRecorder, setShowGPSRecorder] = useState(false);
  const [trafficModalOpen, setTrafficModalOpen] = useState(false);
  const [trackerDismissed, setTrackerDismissed] = useState<boolean>(() => isTrackerDismissed(lessonId));
  const [, setTick] = useState(0);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: pupilUnreadCount = 0 } = usePupilUnreadCount(instructorId, pupilId);
  const { data: adminUnreadCount = 0 } = useAdminUnreadForPupil(instructorId, pupilId, pupilName);
  const totalUnreadBadge = pupilUnreadCount + adminUnreadCount;
  const { durationMinutes: etaMinutes, durationText: etaText, trafficCondition, isLoading: etaLoading, error: etaError } = useTrafficETA(pickupPostcode);

  // Fetch instructor hourly rate for expected earnings
  const [hourlyRate, setHourlyRate] = useState<number>(40);
  useEffect(() => {
    if (!instructorId) return;
    supabase
      .from("instructors")
      .select("hourly_rate")
      .eq("id", instructorId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.hourly_rate) setHourlyRate(Number(data.hourly_rate));
      });
  }, [instructorId]);
  const expectedEarnings = (durationMinutes / 60) * hourlyRate;
  const { currentWeather, alerts: drivingAlerts } = useDrivingAlerts(instructorId);
  const { devices } = useVehicleHealth();
  const trafficAlerts = drivingAlerts.filter(a => a.type === "traffic" || a.type === "road");
  const hasTrafficAlerts = trafficAlerts.length > 0 || (trafficCondition && trafficCondition.toLowerCase() !== "light" && trafficCondition.toLowerCase() !== "free");

  const [lateDismissed, setLateDismissed] = useState(false);
  const lateAlertFiredRef = useRef(false);

  const { isRunningLate, lateByMinutes, arrivalTimeText, suggestedMessage, sendLateETA } = useRunningLateDetection({
    etaMinutes,
    minutesUntil,
    pupilName,
    pupilPhone,
  });

  useEffect(() => {
    if (isRunningLate && !lateAlertFiredRef.current) {
      lateAlertFiredRef.current = true;
      haptics.medium();
    }
    if (!isRunningLate) lateAlertFiredRef.current = false;
  }, [isRunningLate]);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const formatTime24 = (time: string) => {
    try { return format(parse(time, "HH:mm:ss", new Date()), "HH:mm"); }
    catch { return time.slice(0, 5); }
  };

  const getDateLabel = () => {
    const date = parseISO(lessonDate);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEE d MMM");
  };

  // Natural-language countdown — rounds to calm thresholds rather than a
  // railway-departure-board style "2h 7m" precision.
  const getCountdownText = () => {
    if (minutesUntil <= 0) return "now";
    if (minutesUntil >= 60 * 24) {
      const days = Math.round(minutesUntil / (60 * 24));
      return days === 1 ? "1 day" : `${days} days`;
    }
    if (minutesUntil >= 60) {
      const hours = Math.round(minutesUntil / 60);
      return hours === 1 ? "1 hour" : `${hours} hours`;
    }
    return `${Math.max(1, Math.round(minutesUntil))} min`;
  };

  const formatDuration = () => `${durationMinutes / 60}h`;

  const effectiveBalance = prepaidHours > 0 ? prepaidHours * 40 : accountBalance;
  const firstName = pupilName.split(" ")[0];
  const hasUnread = pupilUnreadCount > 0;
  const paymentDue = effectiveBalance < 0;
  const noBalance = effectiveBalance <= 0 && prepaidHours <= 0;

  const getWeatherSafetyTip = () => {
    if (!currentWeather) return null;
    const temp = currentWeather.temperature;
    const code = currentWeather.weatherCode;
    const wind = currentWeather.windSpeed;
    if (temp != null && temp <= 2) return { tip: "Watch for ice", color: "#38bdf8" };
    if (code != null && (code >= 95 || (code >= 61 && code <= 67))) return { tip: "Heavy rain — reduced grip", color: "#60a5fa" };
    if (code != null && (code === 45 || code === 48)) return { tip: "Fog — reduced visibility", color: "#94a3b8" };
    if (code != null && code >= 71 && code <= 77) return { tip: "Snow — drive with caution", color: "#38bdf8" };
    if (wind != null && wind > 50) return { tip: "Strong winds", color: "#2dd4bf" };
    if (code != null && code >= 51 && code <= 57) return { tip: "Light rain — roads may be slippery", color: "#60a5fa" };
    return null;
  };

  const primaryDevice = devices.find(d => d.is_connected) || devices[0] || null;

  const handleArrived = () => {
    supabase.from("scheduled_lessons").update({ status: "arrived" }).eq("id", lessonId).then(() => {});
    supabase.functions.invoke("notify-pupil", { body: { pupilId, type: "arrived" } }).catch(() => {});
    sendSMS(`Hi ${firstName}, I'm outside and ready when you are! 🚗`);
  };
  const handleNavigate = () => {
    if (pickupPostcode) window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pickupPostcode)}`, "_blank");
  };
  const handleCall = () => { if (pupilPhone) { const a = document.createElement("a"); a.href = `tel:${pupilPhone}`; a.click(); } };
  const handleMessage = () => { if (pupilPhone) { const a = document.createElement("a"); a.href = `sms:${pupilPhone}`; a.click(); } };
  const sendSMS = (msg: string) => { if (pupilPhone) { const a = document.createElement("a"); a.href = `sms:${pupilPhone}?body=${encodeURIComponent(msg)}`; a.click(); } };
  const handleSendETA = () => {
    supabase.from("scheduled_lessons").update({ status: "en_route" }).eq("id", lessonId).then(() => {});
    supabase.functions.invoke("notify-pupil", { body: { pupilId, type: "en_route" } }).catch(() => {});
    sendSMS(etaText ? `Hi ${firstName}, I'm on my way! My estimated arrival time is ${etaText}.` : `Hi ${firstName}, I'm on my way to you now!`);
  };
  const handleCancelled = () => { queryClient.invalidateQueries({ queryKey: ["next-lesson-details"] }); queryClient.invalidateQueries({ queryKey: ["today-remaining-lessons"] }); };
  const getEndTime = () => { try { const p = parse(startTime, "HH:mm:ss", new Date()); return format(new Date(p.getTime() + durationMinutes * 60000), "HH:mm:ss"); } catch { return undefined; } };

  const getTrafficDot = () => {
    switch (trafficCondition?.toLowerCase()) {
      case "heavy": return "bg-red-500";
      case "moderate": return "bg-yellow-400";
      default: return "bg-emerald-400";
    }
  };

  const isImminent = minutesUntil <= 30;
  const isWithin4h = minutesUntil <= 240;
  const navBlue = "#2A394F";

  // Compute "leave by" recommendation when imminent
  const PARKING_BUFFER_MIN = 3;
  const leaveByText = (() => {
    if (!isImminent || !etaMinutes || etaMinutes <= 0) return null;
    try {
      const start = parse(startTime, "HH:mm:ss", new Date());
      const leaveAt = new Date(start.getTime() - (etaMinutes + PARKING_BUFFER_MIN) * 60000);
      return format(leaveAt, "HH:mm");
    } catch { return null; }
  })();

  // Severity for travel-time bar
  const minsLateIfLeaveNow = etaMinutes && etaMinutes > 0
    ? Math.max(0, etaMinutes + PARKING_BUFFER_MIN - minutesUntil)
    : 0;
  const trafficHeavy = trafficCondition?.toLowerCase() === "heavy";
  const travelBarSeverity: "normal" | "amber" | "red" =
    minsLateIfLeaveNow > 0 ? "red" : trafficHeavy ? "amber" : "normal";
  const travelBarBg =
    travelBarSeverity === "red" ? "#FBEAEC"
      : travelBarSeverity === "amber" ? "#FBF1DE"
      : "#E6F1FB";
  const travelBarIconColor =
    travelBarSeverity === "red" ? "#C8434F"
      : travelBarSeverity === "amber" ? "#B8801F"
      : "#2B7BC8";

  // Format pickup address with postcode appearing exactly once
  const formattedPickupAddress = (() => {
    const addr = (pickupLocation || "").trim();
    const pc = (pickupPostcode || "").trim();
    if (!addr) return pc;
    if (!pc) return addr;
    // Strip postcode if already present in address (case-insensitive, ignoring spaces)
    const normPc = pc.replace(/\s+/g, "").toUpperCase();
    const normAddr = addr.replace(/\s+/g, "").toUpperCase();
    if (normAddr.endsWith(normPc)) return `${addr.replace(/[, ]+$/, "")}`.replace(new RegExp(`\\s*,?\\s*${pc.replace(/\s+/g, "\\s*")}\\s*$`, "i"), "") + ` · ${pc}`;
    if (normAddr.includes(normPc)) return addr; // already contains it somewhere
    return `${addr} · ${pc}`;
  })();
  const countdownColor = minutesUntil <= 5 ? "#ef4444" : minutesUntil <= 15 ? "#f59e0b" : navBlue;

  // iOS 17 native palette — scoped to this component
  const ios = {
    label: "#000000",
    secondaryLabel: "rgba(60,60,67,0.60)",
    tertiaryLabel: "rgba(60,60,67,0.30)",
    separator: "#C6C6C8",
    fill: "rgba(120,120,128,0.12)",
    blue: "#007AFF",
    green: "#34C759",
    indigo: "#5856D6",
    orange: "#FF9500",
    red: "#FF3B30",
    card: "#FFFFFF",
    grouped: "#F2F2F7",
  };
  const iosFont = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", sans-serif';

  return (
    <>
      <style>{`
        @keyframes ios-halo-pulse {
          0% { transform: scale(0.6); opacity: 0.45; }
          100% { transform: scale(2.6); opacity: 0; }
        }
        @keyframes ios-fab-pulse {
          0% { transform: scale(0.9); opacity: 1; }
          100% { transform: scale(1.25); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ios-halo, .ios-fab-ring { animation: none !important; }
        }
      `}</style>

      <div className="" style={{ padding: "0 16px", fontFamily: iosFont, WebkitFontSmoothing: "antialiased" }}>
        {/* ── Premium card ── */}
        <div
          style={{
            background: "#FFFFFF",
            border: "0.5px solid #E5E5EA",
            boxShadow: "none",
            borderRadius: 12,
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 14,
            position: "relative",
            maxWidth: 440,
            margin: "0 auto",
            width: "100%",
          }}
        >
          {/* ── Header (whole row tappable to expand) ── */}
          <button
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            aria-label={expanded ? "Hide lesson details" : "Show lesson details"}
            className="active:opacity-80"
            style={{
              width: "100%", padding: 0, display: "flex", alignItems: "flex-start", gap: 12,
              background: "transparent", border: "none", cursor: "pointer", textAlign: "left",
              transition: "opacity 150ms cubic-bezier(0.2,0.7,0.2,1)",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: a11yPx(11), fontWeight: 500, color: "#6E6E73", letterSpacing: 0.2, textTransform: "uppercase" }}>Up next</span>
                {checkInStatus && (
                  <LessonCheckInBadge status={checkInStatus} className="text-[10px] py-0 px-1.5 h-5 ml-1" />
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: a11yPx(16), fontWeight: 500, letterSpacing: -0.2, color: "#000000", lineHeight: 1.2 }}>
                  {toSentenceName(pupilName)}
                </span>
                {totalUnreadBadge > 0 && (
                  <span style={{
                    minWidth: 18, height: 18, padding: "0 5px", borderRadius: 9,
                    background: "#C8434F", color: "#fff", fontSize: a11yPx(11), fontWeight: 600,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    fontVariantNumeric: "tabular-nums",
                  }}>{totalUnreadBadge}</span>
                )}
              </div>
              <div style={{ fontSize: a11yPx(12), color: "#6E6E73", marginTop: 2 }}>
                {`Standard lesson · ${formatHoursLong(durationMinutes)} · ${formatTime24(startTime)}`}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: a11yPx(18), fontWeight: 500, letterSpacing: -0.4, color: "#000000", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                  {formatTime24(startTime)}
                </div>
                <div style={{ fontSize: a11yPx(11), fontWeight: 400, color: "#6E6E73", marginTop: 4, fontVariantNumeric: "tabular-nums" }}>
                  {minutesUntil <= 0 ? "Starting now" : `in ${getCountdownText()}`}
                </div>
              </div>
              <ChevronDown
                aria-hidden
                style={{
                  width: 18, height: 18, color: "#6E6E73",
                  transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 250ms cubic-bezier(0.2,0.7,0.2,1)",
                }}
                strokeWidth={1.5}
              />
            </div>
          </button>

          {/* ── MAP PREVIEW (only when within 4h) ── */}
          {isWithin4h && pickupPostcode && (
            <div
              style={{
                position: "relative",
                borderRadius: 10,
                overflow: "hidden",
                height: 140,
                background: "#F2F2F7",
              }}
            >
              <GoogleMapPreview postcode={pickupPostcode} address={pickupLocation} height={140} />
            </div>
          )}

          {/* ── TRAVEL-TIME BAR (only when within 30 min and ETA known) ──
                When running late, this bar doubles as the late warning and
                exposes a single inline "Send ETA" action so we don't render
                two competing late banners. */}
          {isImminent && etaMinutes > 0 && (
            <div
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "12px 14px",
                background: travelBarBg,
                borderRadius: 10,
                border: "0.5px solid #E5E5EA",
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 8, background: "#FFFFFF",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Car style={{ width: 16, height: 16, color: travelBarIconColor }} strokeWidth={2} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: a11yPx(13), fontWeight: 500, color: "#000000", marginBottom: 1 }}>
                  {travelBarSeverity === "red"
                    ? `Running ${minsLateIfLeaveNow} min late${arrivalTimeText ? ` · ETA ${arrivalTimeText}` : ""}`
                    : `${etaMinutes} min drive${etaText && /·/.test(etaText) ? ` · ${etaText.split("·").slice(-1)[0].trim()}` : ""}`}
                </div>
                <div style={{ fontSize: a11yPx(11), color: "#6E6E73" }}>
                  {travelBarSeverity === "red"
                    ? "Let your pupil know you're on the way"
                    : leaveByText
                      ? `Leave by ${leaveByText} to arrive on time`
                      : "Calculating leave-by time…"}
                </div>
              </div>
              {travelBarSeverity === "red" && (
                <button
                  onClick={(e) => { e.stopPropagation(); sendLateETA(); }}
                  className="active:opacity-80"
                  style={{
                    padding: "8px 14px", borderRadius: 999,
                    background: travelBarIconColor, color: "#FFFFFF",
                    fontSize: a11yPx(13), fontWeight: 600, border: "none",
                    cursor: "pointer", flexShrink: 0,
                    transition: "opacity 150ms cubic-bezier(0.2,0.7,0.2,1)",
                  }}
                >
                  Send ETA
                </button>
              )}
            </div>
          )}

          {/* ── ROUTE LIST (origin → destination) ── */}
          {(pickupLocation || pickupPostcode) && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              {/* Timeline column */}
              <div style={{
                flexShrink: 0, width: 14, display: "flex", flexDirection: "column",
                alignItems: "center", paddingTop: 4,
              }}>
                <div style={{
                  width: 10, height: 10, borderRadius: "50%", background: "#FFFFFF",
                  border: "2px solid #2B7BC8",
                }} />
                <div style={{ width: 1.5, height: 20, background: "#E5E5EA", margin: "2px 0" }} />
                <div style={{
                  width: 10, height: 10, borderRadius: "50%", background: "#C8434F",
                }} />
              </div>

              {/* Content column */}
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {/* Origin */}
                <div style={{ fontSize: a11yPx(12), color: "#6E6E73", lineHeight: 1.3 }}>
                  Your location
                </div>
                {/* Destination */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: a11yPx(13), fontWeight: 500, color: "#000000", letterSpacing: -0.1, marginBottom: 1 }}>
                    Pick up {toSentenceName(firstName)}
                  </div>
                  <div style={{ fontSize: a11yPx(11), color: "#6E6E73", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {formattedPickupAddress || "—"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── BALANCE / RUNNING LATE NOTICES (preserved) ── */}
          {effectiveBalance < 0 && (
            <div style={{ padding: "8px 16px 0 16px" }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "rgba(255,59,48,0.10)", color: ios.red,
                borderRadius: 999, padding: "5px 10px",
                fontSize: a11yPx(13), fontWeight: 600, letterSpacing: -0.08,
              }}>
                <AlertTriangle style={{ width: 12, height: 12 }} strokeWidth={2.2} />
                £{Math.abs(effectiveBalance).toFixed(0)} owed
              </div>
            </div>
          )}

          {/* Running-late warning is now consolidated into the travel-time
              bar above (single combined warning + Send ETA action). */}

          {/* ── ACTION ROW (4 columns) ── */}
          <div style={{ paddingTop: 4 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {[
                { icon: Navigation, label: "Navigate", accent: "#2B7BC8", tint: "#E6F1FB", action: (e: React.MouseEvent) => { e.stopPropagation(); handleNavigate(); } },
                { icon: Phone, label: "Call", accent: "#3B8B3B", tint: "#E8F3E8", action: (e: React.MouseEvent) => { e.stopPropagation(); handleCall(); } },
                { icon: MessageSquare, label: "Message", accent: "#B8801F", tint: "#FBF1DE", action: (e: React.MouseEvent) => { e.stopPropagation(); handleMessage(); } },
                { icon: MapPin, label: "Arrived", accent: "#C8434F", tint: "#FBEAEC", action: (e: React.MouseEvent) => { e.stopPropagation(); handleArrived(); } },
              ].map((btn) => (
                <button
                  key={btn.label}
                  onClick={btn.action}
                  className="active:opacity-80"
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                    background: "transparent", border: "none", cursor: "pointer", padding: 0,
                    transition: "opacity 150ms cubic-bezier(0.2,0.7,0.2,1)",
                  }}
                  aria-label={btn.label}
                >
                  <span style={{
                    width: "100%", maxWidth: 56, aspectRatio: "1 / 1",
                    borderRadius: 10, background: btn.tint,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <btn.icon style={{ width: 20, height: 20, color: btn.accent }} strokeWidth={2} fill="none" />
                  </span>
                  <span style={{ fontSize: a11yPx(11), fontWeight: 400, color: "#000000" }}>{btn.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── START TRACK (only when within 4h; full-width primary CTA) ── */}
          {isWithin4h && !trackerDismissed && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/instructor/tracking?pupilId=${pupilId}&lessonId=${lessonId}&autoStart=1`);
              }}
              className="active:opacity-90"
              style={{
                width: "100%",
                background: "#C8434F", color: "#FFFFFF",
                border: "none", borderRadius: 10,
                padding: 13, fontSize: a11yPx(14), fontWeight: 500,
                cursor: "pointer",
                transition: "opacity 150ms cubic-bezier(0.2,0.7,0.2,1)",
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
              title="Start tracking session for this lesson"
            >
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FFFFFF", display: "inline-block" }} />
              Start track
            </button>
          )}
        </div>

        {/* ── EXPANDED CONTENT ── */}
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="overflow-hidden">
              <div className="px-4 pb-4 flex flex-col gap-3">
                <div className="h-px w-full" style={{ background: "rgba(0,0,0,0.06)" }} />

                {/* Mini-map removed — already shown at top of tile */}

                {/* Stats row */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: Hourglass, label: "Duration", value: formatDuration(), color: "hsl(220, 52%, 22%)" },
                    { icon: PoundSterling, label: "Earnings", value: `£${expectedEarnings.toFixed(0)}`, color: "#10b981" },
                  ].map((stat) => (
                    <div key={stat.label} className="flex flex-col items-center py-3 rounded-2xl" style={{ background: "rgba(0,0,0,0.03)" }}>
                      <div className="w-8 h-8 rounded-2xl flex items-center justify-center mb-1.5" style={{ background: `${stat.color}15` }}>
                        <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
                      </div>
                      <span className="text-[15px] font-bold" style={{ color: "hsl(var(--foreground))" }}>{stat.value}</span>
                      <span className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</span>
                    </div>
                  ))}
                </div>

                {/* Live ETA — clickable when traffic alerts exist */}
                {(etaLoading || etaMinutes > 0) && (
                  <button
                    type="button"
                    disabled={!hasTrafficAlerts}
                    onClick={(e) => { e.stopPropagation(); if (hasTrafficAlerts) setTrafficModalOpen(true); }}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-2xl text-left transition-transform ${hasTrafficAlerts ? "active:scale-[0.99] cursor-pointer" : "cursor-default"}`}
                    style={{
                      background: hasTrafficAlerts ? "rgba(239,68,68,0.08)" : "rgba(21,30,48,0.05)",
                      border: hasTrafficAlerts ? "1px solid rgba(239,68,68,0.2)" : "none",
                    }}
                  >
                    <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0" style={{ background: hasTrafficAlerts ? "rgba(239,68,68,0.15)" : "rgba(21,30,48,0.1)" }}>
                      {hasTrafficAlerts ? <AlertTriangle className="h-5 w-5" style={{ color: "#dc2626" }} /> : <Car className="h-5 w-5" style={{ color: "hsl(220, 52%, 16%)" }} />}
                    </div>
                    {etaLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        <span className="text-[11px] text-muted-foreground">Calculating ETA...</span>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-muted-foreground">Drive time</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[15px] font-bold" style={{ color: "hsl(var(--foreground))" }}>~{etaMinutes} min</span>
                            {trafficCondition && (
                              <>
                                <span className={`w-2 h-2 rounded-full ${getTrafficDot()}`} />
                                <span className="text-[11px] capitalize text-muted-foreground">{trafficCondition}</span>
                              </>
                            )}
                          </div>
                          {hasTrafficAlerts && (
                            <p className="text-[10px] mt-0.5 font-semibold" style={{ color: "#dc2626" }}>
                              {trafficAlerts.length} alert{trafficAlerts.length !== 1 ? "s" : ""} on route — tap for details
                            </p>
                          )}
                        </div>
                        {hasTrafficAlerts && <ChevronRight className="h-4 w-4" style={{ color: "#dc2626" }} />}
                      </div>
                    )}
                  </button>
                )}

                {/* Weather */}
                {currentWeather && currentWeather.temperature != null && (
                  <div className="flex items-center gap-3 p-3.5 rounded-2xl" style={{ background: "rgba(0,0,0,0.03)" }}>
                    <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "rgba(245,158,11,0.1)" }}>
                      <Thermometer className="h-5 w-5" style={{ color: "#f59e0b" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-bold" style={{ color: "hsl(var(--foreground))" }}>{currentWeather.temperature}°C</span>
                        {currentWeather.description && <span className="text-[11px] text-muted-foreground">{currentWeather.description}</span>}
                      </div>
                      {getWeatherSafetyTip() && (
                        <p className="text-[10px] mt-0.5" style={{ color: getWeatherSafetyTip()!.color }}>⚠ {getWeatherSafetyTip()!.tip}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Vehicle Health */}
                {primaryDevice && (
                  <div className="flex items-center gap-3 p-3.5 rounded-2xl" style={{ background: "rgba(0,0,0,0.03)" }}>
                    <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ background: primaryDevice.is_connected ? "rgba(22,163,74,0.1)" : "rgba(220,38,38,0.1)" }}>
                      <Car className="h-5 w-5" style={{ color: primaryDevice.is_connected ? "#16a34a" : "#dc2626" }} />
                    </div>
                    <div className="flex-1 flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <Wifi className="h-3.5 w-3.5" style={{ color: primaryDevice.is_connected ? "#16a34a" : "#dc2626" }} />
                        <span className="text-[11px] font-medium" style={{ color: "hsl(var(--foreground))" }}>
                          {primaryDevice.is_connected ? "Connected" : "Offline"}
                        </span>
                      </div>
                      {primaryDevice.last_battery_percent != null && (
                        <div className="flex items-center gap-1.5">
                          <Battery className="h-3.5 w-3.5" style={{ color: primaryDevice.last_battery_percent > 20 ? "#16a34a" : "#dc2626" }} />
                          <span className="text-[11px] font-medium" style={{ color: "hsl(var(--foreground))" }}>{primaryDevice.last_battery_percent}%</span>
                        </div>
                      )}
                      {primaryDevice.last_fuel_percent != null && (
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-muted-foreground">⛽</span>
                          <span className="text-[11px] font-medium" style={{ color: "hsl(var(--foreground))" }}>{primaryDevice.last_fuel_percent}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Last Lesson Plan */}
                {lastLessonPlan && (
                  <div className="flex items-start gap-3 p-3.5 rounded-2xl" style={{ background: "rgba(124,58,237,0.05)" }}>
                    <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(124,58,237,0.1)" }}>
                      <BookOpen className="h-5 w-5" style={{ color: "#7c3aed" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Lesson Plan</span>
                      <p className="text-[12px] mt-0.5 line-clamp-2" style={{ color: "hsl(var(--foreground))" }}>{lastLessonPlan}</p>
                    </div>
                  </div>
                )}

                {/* Payment Warning */}
                {noBalance && (
                  <div className="flex items-center gap-3 p-3.5 rounded-2xl"
                    style={{
                      background: paymentDue ? "rgba(239,68,68,0.08)" : "rgba(251,191,36,0.08)",
                      border: `1px solid ${paymentDue ? "rgba(239,68,68,0.2)" : "rgba(251,191,36,0.2)"}`,
                    }}>
                    <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ background: paymentDue ? "rgba(239,68,68,0.15)" : "rgba(251,191,36,0.15)" }}>
                      <Banknote className="h-5 w-5" style={{ color: paymentDue ? "#dc2626" : "#d97706" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold" style={{ color: "hsl(var(--foreground))" }}>
                        {paymentDue ? `£${Math.abs(effectiveBalance).toFixed(0)} payment due` : "No balance remaining"}
                      </p>
                      <p className="text-[10px] mt-0.5 text-muted-foreground">Collect before or after lesson</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); navigate(`/instructor/take-payment?pupil=${pupilId}`); }}
                      className="shrink-0 px-3.5 py-2 rounded-2xl text-[11px] font-bold text-white"
                      style={{ background: paymentDue ? "#ef4444" : "#d97706" }}>
                      Collect
                    </button>
                  </div>
                )}

                {/* Unread Messages */}
                {hasUnread && (
                  <button onClick={(e) => { e.stopPropagation(); navigate(`/instructor/messages`); }}
                    className="flex items-center gap-3 p-3.5 rounded-2xl w-full text-left"
                    style={{ background: "rgba(249,115,22,0.06)" }}>
                    <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "rgba(249,115,22,0.12)" }}>
                      <MessageCircle className="h-5 w-5 text-orange-500" />
                    </div>
                    <span className="text-[13px] font-medium flex-1" style={{ color: "hsl(var(--foreground))" }}>
                      {pupilUnreadCount} unread from {firstName}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}

                {/* Admin notes about this pupil */}
                {adminUnreadCount > 0 && (
                  <button onClick={(e) => { e.stopPropagation(); navigate(`/instructor-app/admin-chat`); }}
                    className="flex items-center gap-3 p-3.5 rounded-2xl w-full text-left"
                    style={{ background: "rgba(249,115,22,0.06)" }}>
                    <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "rgba(249,115,22,0.12)" }}>
                      <Mail className="h-5 w-5 text-orange-500" />
                    </div>
                    <span className="text-[13px] font-medium flex-1" style={{ color: "hsl(var(--foreground))" }}>
                      {adminUnreadCount} admin note{adminUnreadCount !== 1 ? "s" : ""} about {firstName}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  {/* Manual Start Track (auto-start is on by default; this is the manual override) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/instructor/tracking?pupilId=${pupilId}&lessonId=${lessonId}&autoStart=1`);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-[14px] rounded-2xl font-semibold text-[15px] active:opacity-80"
                    style={{ background: "#007AFF", color: "#fff", border: "none", letterSpacing: -0.24, transition: "opacity 150ms cubic-bezier(0.2,0.7,0.2,1)" }}
                  >
                    <Send className="h-4 w-4" strokeWidth={2.2} /> Start track manually
                  </button>

                  {/* Start Lesson */}
                  {minutesUntil <= 15 && (
                    <button onClick={(e) => {
                      e.stopPropagation();
                      supabase.from("scheduled_lessons").update({ status: "in_progress" }).eq("id", lessonId).then(() => {});
                      navigate(`/instructor/tracking?lesson=${lessonId}`);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-[14px] rounded-2xl text-white font-bold text-[15px] transition-transform active:scale-[0.98]"
                    style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
                      <Navigation className="h-4.5 w-4.5" /> Start Lesson
                    </button>
                  )}

                  {/* End Lesson */}
                  {minutesUntil <= 0 && (
                    <button onClick={(e) => { e.stopPropagation(); setWizardOpen(true); }}
                      className="w-full flex items-center justify-center gap-2 py-[14px] rounded-2xl font-bold text-[15px] transition-transform active:scale-[0.98]"
                      style={{ background: "rgba(0,0,0,0.06)", color: "hsl(var(--foreground))" }}>
                      <CheckCircle2 className="h-4.5 w-4.5" /> End Lesson
                    </button>
                  )}
                </div>

                {/* Extended actions */}
                <div className="grid grid-cols-5 gap-2">
                  <button onClick={(e) => { e.stopPropagation(); navigate(`/instructor/pupils/${pupilId}?tab=progress`); }}
                    className="flex flex-col items-center gap-1 py-2.5 rounded-2xl transition-transform active:scale-95"
                    style={{ background: "rgba(124,58,237,0.08)" }}>
                    <ClipboardList className="h-4 w-4" style={{ color: "#7c3aed" }} />
                    <span className="text-[9px] font-bold text-muted-foreground">Prep</span>
                  </button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex flex-col items-center gap-1 py-2.5 rounded-2xl transition-transform active:scale-95"
                        style={{ background: "rgba(21,30,48,0.08)" }}
                        onClick={(e) => e.stopPropagation()}>
                        <Send className="h-4 w-4" style={{ color: "hsl(220, 52%, 16%)" }} />
                        <span className="text-[9px] font-bold text-muted-foreground">On Way</span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" className="w-52">
                      <DropdownMenuItem onClick={handleSendETA}>Send ETA Now</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => sendSMS(`Hi ${firstName}, running about 5 minutes late. Sorry!`)}>Running 5 min late</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => sendSMS(`Hi ${firstName}, running about 10 minutes late. Sorry!`)}>Running 10 min late</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => sendSMS(`Hi ${firstName}, running about 15 minutes late. Sorry!`)}>Running 15 min late</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => sendSMS(`Hi ${firstName}, running about 20 minutes late. Sorry!`)}>Running 20 min late</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => sendSMS(`Hi ${firstName}, running about 30 minutes late. Sorry!`)}>Running 30 min late</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => sendSMS(`Hi ${firstName}, I'll call you as soon as I can!`)}>Call ASAP</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <button onClick={(e) => { e.stopPropagation(); setLateSheetOpen(true); }}
                    className="flex flex-col items-center gap-1 py-2.5 rounded-2xl transition-transform active:scale-95"
                    style={{ background: "rgba(251,191,36,0.08)" }}>
                    <AlertTriangle className="h-4 w-4" style={{ color: "#d97706" }} />
                    <span className="text-[9px] font-bold text-muted-foreground">Late</span>
                  </button>

                  <button onClick={(e) => { e.stopPropagation(); setRescheduleOpen(true); }}
                    className="flex flex-col items-center gap-1 py-2.5 rounded-2xl transition-transform active:scale-95"
                    style={{ background: "rgba(0,0,0,0.04)" }}>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-[9px] font-bold text-muted-foreground">Move</span>
                  </button>

                  <button onClick={(e) => { e.stopPropagation(); setCancelOpen(true); }}
                    className="flex flex-col items-center gap-1 py-2.5 rounded-2xl transition-transform active:scale-95"
                    style={{ background: "rgba(239,68,68,0.06)" }}>
                    <X className="h-4 w-4" style={{ color: "#dc2626" }} />
                    <span className="text-[9px] font-bold text-muted-foreground">Cancel</span>
                  </button>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dialogs */}
      {instructorId && (
        <CancelLessonDialog open={cancelOpen} onOpenChange={setCancelOpen} lessonId={lessonId}
          pupilId={pupilId} pupilName={pupilName} amountDue={durationMinutes * (40 / 60)}
          pupilBalance={accountBalance} durationMinutes={durationMinutes} lessonDate={lessonDate}
          lessonTime={startTime} endTime={getEndTime()} instructorId={instructorId} onCancelled={handleCancelled} />
      )}
      {instructorId && (
        <RescheduleLessonSheet open={rescheduleOpen} onOpenChange={setRescheduleOpen} lessonId={lessonId}
          instructorId={instructorId} pupilName={pupilName} currentDate={lessonDate}
          currentTime={startTime} durationMinutes={durationMinutes} onRescheduled={handleCancelled} />
      )}
      {instructorId && (
        <EndLessonWizard open={wizardOpen} onOpenChange={setWizardOpen} lessonId={lessonId}
          pupilId={pupilId} pupilName={pupilName} instructorId={instructorId}
          durationMinutes={durationMinutes} lessonDate={lessonDate} startTime={startTime}
          currentBalance={accountBalance} onCompleted={handleCancelled} />
      )}
      <RunningLateSheet open={lateSheetOpen} onOpenChange={setLateSheetOpen}
        pupilName={pupilName} pupilPhone={pupilPhone} startTime={startTime} />

      {/* Traffic Alerts Modal */}
      <Dialog open={trafficModalOpen} onOpenChange={setTrafficModalOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Traffic & Road Alerts
            </DialogTitle>
            <DialogDescription>
              On your route to {firstName} · {pickupPostcode}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-2">
            {/* ETA summary */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/50">
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Drive time</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">{etaText || `${etaMinutes} min`}</span>
                {trafficCondition && (
                  <span className="text-xs capitalize text-muted-foreground">· {trafficCondition} traffic</span>
                )}
              </div>
            </div>

            {/* Alerts list */}
            {trafficAlerts.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Heavier than usual traffic detected on your route. No specific incidents reported.
              </div>
            ) : (
              trafficAlerts.map((alert, idx) => {
                const sevColor = alert.severity === "severe" ? "#dc2626" : alert.severity === "moderate" ? "#f59e0b" : "#3b82f6";
                const Icon = alert.type === "road" ? Construction : AlertTriangle;
                return (
                  <div
                    key={`${alert.title}-${idx}`}
                    className="flex items-start gap-3 p-3 rounded-2xl border"
                    style={{ background: `${sevColor}10`, borderColor: `${sevColor}30` }}
                  >
                    <div
                      className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ background: `${sevColor}20` }}
                    >
                      <Icon className="h-5 w-5" style={{ color: sevColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-foreground">{alert.title}</p>
                        <span
                          className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                          style={{ background: `${sevColor}25`, color: sevColor }}
                        >
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{alert.description}</p>
                      {alert.roadName && (
                        <p className="text-[11px] mt-1 font-medium text-foreground">📍 {alert.roadName}</p>
                      )}
                      {alert.delay != null && alert.delay > 0 && (
                        <p className="text-[11px] mt-1 font-semibold" style={{ color: sevColor }}>
                          Delay: ~{alert.delay} min
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => { setTrafficModalOpen(false); handleNavigate(); }}
                className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm active:scale-95 transition-transform"
              >
                <Navigation className="h-4 w-4" />
                Navigate
              </button>
              <button
                onClick={() => { setTrafficModalOpen(false); handleSendETA(); }}
                className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-muted text-foreground font-semibold text-sm active:scale-95 transition-transform"
              >
                <Send className="h-4 w-4" />
                Send ETA
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
