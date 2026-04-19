import { useState, useEffect, useRef } from "react";
import { format, parse, isToday, isTomorrow, parseISO } from "date-fns";
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

  const getCountdownText = () => {
    if (minutesUntil <= 0) return "Now";
    if (minutesUntil < 60) return `${minutesUntil}m`;
    const hours = Math.floor(minutesUntil / 60);
    const mins = minutesUntil % 60;
    if (hours >= 24) return `${Math.floor(hours / 24)}d`;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
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
  const navBlue = "#2A394F";
  const countdownColor = minutesUntil <= 5 ? "#ef4444" : minutesUntil <= 15 ? "#f59e0b" : navBlue;

  return (
    <>
      <div
        className="w-full"
        style={{
          background: "#F7F5F0",
          padding: "0 16px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          fontFamily: "-apple-system, 'SF Pro Text', sans-serif",
        }}
      >
        {/* ── MINI MAP CARD (live Google Map preserved) ── */}
        {pickupPostcode && (
          <div
            className="w-full relative overflow-hidden"
            style={{
              background: "#FFFFFF",
              borderRadius: 12,
              border: "0.5px solid #D3D1C7",
            }}
          >
            <GoogleMapPreview postcode={pickupPostcode} address={pickupLocation} height={160} />
            {/* Top overlay pills (light) */}
            <div className="absolute inset-x-0 top-0 flex items-start justify-between px-2 py-2 z-10 gap-2 pointer-events-none">
              {/* LEFT: Next lesson pill + status badges */}
              <div className="flex items-center gap-1.5 flex-wrap pointer-events-auto">
                <span
                  className="inline-flex items-center gap-1"
                  style={{
                    background: "rgba(255,255,255,0.95)",
                    backdropFilter: "blur(6px)",
                    WebkitBackdropFilter: "blur(6px)",
                    border: "0.5px solid #D3D1C7",
                    borderRadius: 999,
                    padding: "5px 10px",
                  }}
                >
                  <Calendar style={{ width: 11, height: 11, color: "#5F5E5A" }} strokeWidth={2} />
                  <span style={{ fontSize: 11, fontWeight: 500, color: "#2C2C2A" }}>Next lesson</span>
                </span>
                {effectiveBalance < 0 && (
                  <span className="inline-flex items-center gap-1 animate-pulse"
                    style={{ background: "#A32D2D", color: "#FFFFFF", fontSize: 10, fontWeight: 500, borderRadius: 999, padding: "4px 8px" }}>
                    <AlertTriangle style={{ width: 10, height: 10 }} />
                    £{Math.abs(effectiveBalance).toFixed(0)} owed
                  </span>
                )}
                {checkInStatus && (
                  <LessonCheckInBadge status={checkInStatus} className="text-[10px] py-0 px-1.5 h-5" />
                )}
              </div>

              {/* RIGHT: Time pill + ETA pill */}
              <div className="flex items-center gap-1.5 shrink-0 pointer-events-auto">
                <span
                  className="inline-flex items-center gap-1"
                  style={{
                    background: "rgba(255,255,255,0.95)",
                    backdropFilter: "blur(6px)",
                    WebkitBackdropFilter: "blur(6px)",
                    border: "0.5px solid #D3D1C7",
                    borderRadius: 999,
                    padding: "5px 10px",
                  }}
                >
                  <Clock style={{ width: 11, height: 11, color: "#5F5E5A" }} strokeWidth={2} />
                  <span style={{ fontSize: 11, fontWeight: 500, color: "#2C2C2A" }}>{formatTime24(startTime)}</span>
                </span>
                {etaText && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isRunningLate) setLateSheetOpen(true);
                      else handleNavigate();
                    }}
                    className={`inline-flex items-center gap-1 transition-transform active:scale-95 ${isRunningLate ? "animate-pulse" : ""}`}
                    style={{
                      background: "rgba(255,255,255,0.95)",
                      backdropFilter: "blur(6px)",
                      WebkitBackdropFilter: "blur(6px)",
                      border: "0.5px solid #B5D4F4",
                      borderRadius: 999,
                      padding: "5px 10px",
                    }}
                    title={isRunningLate ? "Running late — tap to notify pupil" : "Tap to open in Google Maps"}
                  >
                    <Navigation style={{ width: 11, height: 11, color: "#185FA5" }} strokeWidth={2} />
                    <span style={{ fontSize: 11, fontWeight: 500, color: "#185FA5" }}>
                      {etaText}{isRunningLate && lateByMinutes > 0 ? ` · +${lateByMinutes}m` : ""}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Start Track pill — bottom-left, nudged up to keep Google attribution visible */}
            {!trackerDismissed && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/instructor/tracking?pupilId=${pupilId}&lessonId=${lessonId}&autoStart=1`);
                }}
                className="absolute z-10 inline-flex items-center gap-1.5 active:scale-95 transition-transform"
                style={{
                  bottom: 22,
                  left: 8,
                  background: "#A32D2D",
                  color: "#FFFFFF",
                  borderRadius: 999,
                  padding: "6px 12px 6px 10px",
                }}
                title="Start tracking session for this lesson"
              >
                <span
                  aria-hidden
                  style={{ width: 11, height: 11, borderRadius: "50%", background: "#FFFFFF", display: "inline-block" }}
                />
                <span style={{ fontSize: 12, fontWeight: 500 }}>Start track</span>
                <X
                  style={{ width: 12, height: 12, marginLeft: 2, opacity: 0.8 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    dismissTracker(lessonId);
                    setTrackerDismissed(true);
                  }}
                />
              </button>
            )}
          </div>
        )}

        {/* ── STUDENT ROW (white card) ── */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-left flex items-center"
          style={{
            background: "#FFFFFF",
            border: "0.5px solid #D3D1C7",
            borderRadius: 12,
            padding: "14px 16px",
            gap: 12,
          }}
        >
          {/* Avatar */}
          <div className="relative shrink-0">
            <div
              className="flex items-center justify-center overflow-hidden"
              style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                background: "#E6F1FB",
                color: "#185FA5",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {pupilProfileImage ? (
                <img src={pupilProfileImage} alt={pupilName} className="w-full h-full object-cover" />
              ) : getInitials(pupilName)}
            </div>
            {/* Online dot */}
            <span style={{
              position: "absolute", bottom: -1, right: -1,
              width: 10, height: 10, borderRadius: "50%",
              backgroundColor: "#639922", border: "2px solid #FFFFFF",
            }} />
            {totalUnreadBadge > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center"
                style={{ minWidth: 18, height: 18, padding: "0 4px", borderRadius: 9, backgroundColor: "#A32D2D", color: "#fff", fontSize: 9, fontWeight: 500, border: "2px solid #FFFFFF" }}>
                {totalUnreadBadge}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p style={{ fontSize: 14, fontWeight: 500, color: "#2C2C2A" }} className="truncate">{toSentenceName(pupilName)}</p>
            <p style={{ fontSize: 12, color: "#5F5E5A", marginTop: 2 }}>
              {formatMetaDate(lessonDate)} · {formatHoursLong(durationMinutes)} · {getCountdownText()}
            </p>
            {(pupilUnreadCount > 0 || adminUnreadCount > 0) && (
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                {pupilUnreadCount > 0 && (
                  <span className="inline-flex items-center gap-1"
                    style={{ background: "#E6F1FB", color: "#185FA5", fontSize: 10, fontWeight: 500, padding: "2px 8px", borderRadius: 999 }}>
                    <MessageCircle className="h-2.5 w-2.5" />
                    {pupilUnreadCount} from {firstName}
                  </span>
                )}
                {adminUnreadCount > 0 && (
                  <span className="inline-flex items-center gap-1"
                    style={{ background: "#FCEBEB", color: "#A32D2D", fontSize: 10, fontWeight: 500, padding: "2px 8px", borderRadius: 999 }}>
                    <Mail className="h-2.5 w-2.5" />
                    {adminUnreadCount} admin
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Chevron */}
          <ChevronRight style={{ width: 14, height: 14, color: "#888780" }} strokeWidth={2} />
        </button>

        {/* ── PICK-UP ROW (white card) ── */}
        {(pickupLocation || pickupPostcode) && (
          <div
            className="flex items-center"
            style={{
              background: "#FFFFFF",
              border: "0.5px solid #D3D1C7",
              borderRadius: 12,
              padding: "14px 16px",
              gap: 12,
            }}
          >
            <div
              className="flex items-center justify-center shrink-0"
              style={{ width: 32, height: 32, borderRadius: 8, background: "#E6F1FB" }}
            >
              <MapPin style={{ width: 14, height: 14, color: "#185FA5" }} strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <span style={{ fontSize: 10, fontWeight: 500, color: "#888780", letterSpacing: 0.8 }}>PICK-UP</span>
              <p
                style={{
                  fontSize: 13,
                  color: "#2C2C2A",
                  marginTop: 1,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {[pickupLocation, pickupPostcode].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>
        )}

        {/* ── RUNNING LATE ALERT ── */}
        <AnimatePresence>
          {isRunningLate && !lateDismissed && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
              <div className="mx-4 mb-3 flex items-center gap-2.5 p-3 rounded-2xl"
                style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.15), rgba(245,158,11,0.1))", border: "1px solid rgba(251,191,36,0.3)" }}>
                <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: "rgba(251,191,36,0.2)" }}>
                  <AlertTriangle className="h-5 w-5" style={{ color: "#FBBF24" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold" style={{ color: "hsl(var(--foreground))" }}>
                    ~{lateByMinutes} min late
                  </p>
                  <p className="text-[10px] mt-0.5 text-muted-foreground">ETA {arrivalTimeText}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); sendLateETA(); }}
                  className="shrink-0 px-3 py-1.5 rounded-2xl text-[11px] font-bold text-amber-900"
                  style={{ background: "#FBBF24" }}>
                  Send ETA
                </button>
                <button onClick={(e) => { e.stopPropagation(); setLateDismissed(true); }} className="shrink-0 p-1">
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── QUICK ACTION GRID (4 columns) ── */}
        <div className="grid grid-cols-4" style={{ gap: 8 }}>
          {[
            { icon: Navigation, label: "Navigate", color: "#185FA5", action: (e: React.MouseEvent) => { e.stopPropagation(); handleNavigate(); } },
            { icon: Phone, label: "Call", color: "#0F6E56", action: (e: React.MouseEvent) => { e.stopPropagation(); handleCall(); } },
            { icon: MessageSquare, label: "SMS", color: "#BA7517", action: (e: React.MouseEvent) => { e.stopPropagation(); handleMessage(); } },
            { icon: MapPin, label: "I\u2019m here", color: "#A32D2D", action: (e: React.MouseEvent) => { e.stopPropagation(); handleArrived(); } },
          ].map((btn) => (
            <button
              key={btn.label}
              onClick={btn.action}
              className="flex flex-col items-center justify-center transition-transform active:scale-95"
              style={{
                background: "#FFFFFF",
                border: "0.5px solid #D3D1C7",
                borderRadius: 8,
                padding: "12px 6px",
                gap: 6,
              }}
            >
              <btn.icon style={{ width: 16, height: 16, color: btn.color }} strokeWidth={2} />
              <span style={{ fontSize: 11, fontWeight: 500, color: "#2C2C2A" }}>{btn.label}</span>
            </button>
          ))}
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
