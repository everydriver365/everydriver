import { useState, useEffect, useRef } from "react";
import { format, parse, isToday, isTomorrow, parseISO } from "date-fns";
import {
  Clock, Phone, MessageSquare, X, Navigation, Car, Loader2, ChevronDown,
  Send, Play, MapPin, Calendar, ClipboardList,
  Hourglass, PoundSterling, MessageCircle, AlertTriangle, CheckCircle2,
  Thermometer, Battery, Wifi, BookOpen, Banknote, ChevronRight,
} from "lucide-react";
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
  const [, setTick] = useState(0);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: pupilUnreadCount = 0 } = usePupilUnreadCount(instructorId, pupilId);
  const { durationMinutes: etaMinutes, durationText: etaText, trafficCondition, isLoading: etaLoading } = useTrafficETA(pickupPostcode);
  const { currentWeather } = useDrivingAlerts(instructorId);
  const { devices } = useVehicleHealth();

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
      <div className="w-full overflow-hidden"
        style={{
          background: "#FFFFFF",
          borderRadius: 20,
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          fontFamily: "-apple-system, 'SF Pro Text', sans-serif",
        }}
      >
        {/* ── HEADER ROW ── */}
        <div className="flex items-center justify-between px-4 py-3"
          style={{ backgroundColor: "#2A394F", borderRadius: "16px 16px 0 0" }}>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-white" />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#FFFFFF" }}>
              Next Lesson
            </span>
            {checkInStatus && (
              <LessonCheckInBadge status={checkInStatus} className="text-[9px] py-0 px-1.5 h-4 ml-1" />
            )}
          </div>
          <div
            className="flex items-center gap-1 px-2.5 py-1"
            style={{ borderRadius: 100, backgroundColor: "rgba(255,255,255,0.2)" }}
          >
            <Clock className="h-3 w-3 text-white" />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#FFFFFF" }}>{formatTime24(startTime)}</span>
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <button onClick={() => setExpanded(!expanded)} className="w-full text-left">
          <div className="px-4 py-3">
            <div className="flex items-center gap-3.5">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="flex items-center justify-center font-bold text-base overflow-hidden"
                  style={{ width: 48, height: 48, borderRadius: 16, background: "linear-gradient(135deg, #FF6B6B, #FF8E53)", color: "white" }}>
                  {pupilProfileImage ? (
                    <img src={pupilProfileImage} alt={pupilName} className="w-full h-full object-cover" style={{ borderRadius: 16 }} />
                  ) : getInitials(pupilName)}
                </div>
                {/* Online dot */}
                <span style={{
                  position: "absolute", bottom: -1, right: -1,
                  width: 12, height: 12, borderRadius: "50%",
                  backgroundColor: "#34C759", border: "2px solid #FFFFFF",
                }} />
                {hasUnread && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center"
                    style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: "#FF3B30", color: "#fff", fontSize: 9, fontWeight: 700, border: "2px solid #FFFFFF" }}>
                    {pupilUnreadCount}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: 16, fontWeight: 700, color: "#1C1C1E" }} className="truncate">{pupilName}</p>
                <p style={{ fontSize: 12, color: "#8E8E93", marginTop: 2 }}>
                  {getDateLabel()} · {formatDuration()} · {getCountdownText()}
                </p>
              </div>

              {/* Expand */}
              <div className="shrink-0">
                <ExpandChevron isExpanded={expanded} />
              </div>
            </div>
          </div>

          {/* ── STAT ROW ── */}
          <div className="mx-4 mt-1 mb-2" style={{ borderRadius: 14, overflow: "hidden" }}>
            <div className="grid grid-cols-3">
              <div className="flex flex-col items-center py-2.5" style={{ backgroundColor: effectiveBalance < 0 ? "rgba(255,149,0,0.08)" : "rgba(52,199,89,0.08)" }}>
                <span style={{ fontSize: 9, fontWeight: 600, color: effectiveBalance < 0 ? "#FF9500" : "#34C759", textTransform: "uppercase" as const, letterSpacing: 0.5 }}>Balance</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: effectiveBalance < 0 ? "#FF9500" : "#34C759", marginTop: 1 }}>
                  £{Math.abs(effectiveBalance).toFixed(0)}
                </span>
              </div>
              <div className="flex flex-col items-center py-2.5" style={{ backgroundColor: "rgba(88,86,214,0.08)", borderLeft: "1px solid rgba(0,0,0,0.04)", borderRight: "1px solid rgba(0,0,0,0.04)" }}>
                <span style={{ fontSize: 9, fontWeight: 600, color: "#5856D6", textTransform: "uppercase" as const, letterSpacing: 0.5 }}>Duration</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#5856D6", marginTop: 1 }}>{formatDuration()}</span>
              </div>
              <div className="flex flex-col items-center py-2.5" style={{ backgroundColor: "rgba(0,122,255,0.08)" }}>
                <span style={{ fontSize: 9, fontWeight: 600, color: "#007AFF", textTransform: "uppercase" as const, letterSpacing: 0.5 }}>ETA</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#007AFF", marginTop: 1 }}>
                  {etaLoading ? "..." : etaMinutes > 0 ? `${etaMinutes}m` : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* ── PICK-UP ROW ── */}
          {(pickupLocation || pickupPostcode) && (
            <div className="px-4 pb-3">
              <div className="flex items-center gap-3" style={{ backgroundColor: "#F8F9FA", borderRadius: 14, padding: "10px 12px" }}>
                <div className="flex items-center justify-center shrink-0" style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: "rgba(0,122,255,0.1)" }}>
                  <MapPin className="h-3.5 w-3.5" style={{ color: "#007AFF" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <span style={{ fontSize: 9, fontWeight: 600, color: "#8E8E93", textTransform: "uppercase" as const, letterSpacing: 0.5 }}>Pick-up</span>
                  <p style={{ fontSize: 12, fontWeight: 500, color: "#1C1C1E", marginTop: 1 }} className="truncate">
                    {[pickupLocation, pickupPostcode].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleNavigate(); }}
                  className="flex items-center justify-center shrink-0"
                  style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: "#007AFF" }}
                >
                  <Navigation className="h-3.5 w-3.5 text-white" />
                </button>
              </div>
            </div>
          )}
        </button>

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

        {/* ── QUICK ACTION BAR (always visible) ── */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2">
            {[
              { icon: Navigation, label: "Navigate", color: "#007AFF", bg: "rgba(0,122,255,0.08)", action: (e: React.MouseEvent) => { e.stopPropagation(); handleNavigate(); } },
              { icon: Phone, label: "Call", color: "#34C759", bg: "rgba(52,199,89,0.08)", action: (e: React.MouseEvent) => { e.stopPropagation(); handleCall(); } },
              { icon: MessageSquare, label: "SMS", color: "#FF9500", bg: "rgba(255,149,0,0.08)", action: (e: React.MouseEvent) => { e.stopPropagation(); handleMessage(); } },
              { icon: MapPin, label: "I'm Here", color: "#34C759", bg: "rgba(52,199,89,0.08)", action: (e: React.MouseEvent) => { e.stopPropagation(); handleArrived(); } },
            ].map((btn) => (
              <button key={btn.label} onClick={btn.action}
                className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-transform active:scale-95"
                style={{ background: btn.bg }}>
                <btn.icon className="h-4 w-4" style={{ color: btn.color }} />
                <span className="text-[9px] font-semibold" style={{ color: btn.color }}>{btn.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── EXPANDED CONTENT ── */}
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="overflow-hidden">
              <div className="px-4 pb-4 flex flex-col gap-3">
                <div className="h-px w-full" style={{ background: "rgba(0,0,0,0.06)" }} />

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: Clock, label: "Start", value: formatTime24(startTime), color: "hsl(220, 52%, 16%)" },
                    { icon: Hourglass, label: "Duration", value: formatDuration(), color: "hsl(220, 52%, 22%)" },
                    { icon: PoundSterling, label: effectiveBalance < 0 ? "Due" : "Balance", value: `£${Math.abs(effectiveBalance).toFixed(0)}`, color: effectiveBalance < 0 ? "#f97316" : "#10b981" },
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

                {/* Live ETA */}
                {(etaLoading || etaMinutes > 0) && (
                  <div className="flex items-center gap-3 p-3.5 rounded-2xl" style={{ background: "rgba(21,30,48,0.05)" }}>
                    <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "rgba(21,30,48,0.1)" }}>
                      <Car className="h-5 w-5" style={{ color: "hsl(220, 52%, 16%)" }} />
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
                        </div>
                      </div>
                    )}
                  </div>
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

                {/* GPS Route Recorder */}
                <button onClick={(e) => { e.stopPropagation(); setShowGPSRecorder(!showGPSRecorder); }}
                  className="w-full flex items-center justify-center gap-2 py-[11px] rounded-2xl font-bold text-[12px] transition-transform active:scale-[0.98]"
                  style={{
                    background: showGPSRecorder ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)",
                    color: showGPSRecorder ? "#dc2626" : "#16a34a",
                  }}>
                  <Play className="h-3.5 w-3.5" />
                  {showGPSRecorder ? "Hide GPS Recorder" : "📍 Record Route (GPS)"}
                </button>

                <AnimatePresence>
                  {showGPSRecorder && instructorId && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
                      className="overflow-hidden" onClick={(e) => e.stopPropagation()}>
                      <LessonRouteRecorder instructorId={instructorId} pupilId={pupilId} lessonId={lessonId}
                        onRouteRecorded={() => setShowGPSRecorder(false)} />
                    </motion.div>
                  )}
                </AnimatePresence>
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
    </>
  );
}
