import { useState, useEffect, useRef } from "react";
import { format, parse, isToday, isTomorrow, parseISO, addMinutes } from "date-fns";
import {
  Clock, Phone, MessageSquare, X, Navigation, Car, Loader2, ChevronDown,
  Send, Play, MapPin, Calendar, ClipboardList,
  Hourglass, PoundSterling, MessageCircle, AlertTriangle, CheckCircle2,
  CloudRain, Thermometer, Battery, Wifi, BookOpen, Banknote,
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

  // Haptic feedback when late alert first appears
  useEffect(() => {
    if (isRunningLate && !lateAlertFiredRef.current) {
      lateAlertFiredRef.current = true;
      haptics.medium();
    }
    if (!isRunningLate) {
      lateAlertFiredRef.current = false;
    }
  }, [isRunningLate]);

  // Auto-refresh countdown every 30s
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const formatTime24 = (time: string) => {
    try {
      const parsed = parse(time, "HH:mm:ss", new Date());
      return format(parsed, "HH:mm");
    } catch { return time.slice(0, 5); }
  };

  const getDateLabel = () => {
    const date = parseISO(lessonDate);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEE");
  };

  const getCountdownText = () => {
    if (minutesUntil <= 0) return "now";
    if (minutesUntil < 60) return `in ${minutesUntil} min`;
    const hours = Math.floor(minutesUntil / 60);
    const mins = minutesUntil % 60;
    if (hours >= 24) return `in ${Math.floor(hours / 24)}d`;
    return mins > 0 ? `in ${hours}h ${mins}m` : `in ${hours}h`;
  };

  const formatDuration = () => `${durationMinutes / 60}h`;

  const effectiveBalance = prepaidHours > 0 ? prepaidHours * 40 : accountBalance;
  const firstName = pupilName.split(" ")[0];
  const hasUnread = pupilUnreadCount > 0;
  const paymentDue = effectiveBalance < 0;
  const noBalance = effectiveBalance <= 0 && prepaidHours <= 0;

  // Weather helpers
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

  // Primary device for vehicle health
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
    // Update lesson status to en_route
    supabase.from("scheduled_lessons").update({ status: "en_route" }).eq("id", lessonId).then(() => {});
    // Send push notification to pupil
    supabase.functions.invoke("notify-pupil", {
      body: { pupilId, type: "en_route" },
    }).catch(() => {});
    sendSMS(etaText ? `Hi ${firstName}, I'm on my way! My estimated arrival time is ${etaText}.` : `Hi ${firstName}, I'm on my way to you now!`);
  };
  const handleCancelled = () => { queryClient.invalidateQueries({ queryKey: ["next-lesson-details"] }); queryClient.invalidateQueries({ queryKey: ["today-remaining-lessons"] }); };
  const getEndTime = () => { try { const p = parse(startTime, "HH:mm:ss", new Date()); return format(new Date(p.getTime() + durationMinutes * 60000), "HH:mm:ss"); } catch { return undefined; } };

  const getTrafficDot = () => {
    switch (trafficCondition?.toLowerCase()) {
      case "heavy": return "bg-red-500";
      case "moderate": return "bg-yellow-400";
      case "light": return "bg-green-400";
      case "clear": return "bg-green-400";
      default: return "bg-gray-400";
    }
  };

  const pillStyle = "inline-flex items-center gap-1.5 px-3 py-[6px] rounded-full text-[11px] font-semibold";

  return (
    <>
      <div
        style={{
          background: "rgba(255,255,255,0.65)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRadius: 22,
          boxShadow: "0 4px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)",
          border: "1px solid rgba(255,255,255,0.5)",
        }}
        className="w-full overflow-hidden dark:!bg-[rgba(28,28,30,0.75)] dark:!border-[rgba(255,255,255,0.1)]"
      >
        {/* === HEADER (always visible) === */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-4 pt-4 pb-3 flex flex-col gap-2.5"
        >
          {/* Main row: avatar + info + time */}
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div
                className="w-[50px] h-[50px] rounded-full flex items-center justify-center font-bold text-lg"
                style={{ background: "linear-gradient(135deg, #3B82F6, #6366F1)", color: "white" }}
              >
                {pupilProfileImage ? (
                  <img src={pupilProfileImage} alt={pupilName} className="w-full h-full rounded-full object-cover" />
                ) : (
                  getInitials(pupilName)
                )}
              </div>
              {hasUnread && (
                <span
                  className="absolute -top-0.5 -right-0.5 flex items-center justify-center rounded-full bg-red-500 text-white font-bold"
                  style={{ width: 18, height: 18, fontSize: 10 }}
                >
                  {pupilUnreadCount}
                </span>
              )}
            </div>

            {/* Center info */}
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-bold uppercase tracking-[0.5px]" style={{ color: "#6366F1" }}>
                  Next Up
                </span>
                {checkInStatus && (
                  <LessonCheckInBadge status={checkInStatus} className="ml-1 text-[9px] py-0 px-1.5 h-4" />
                )}
                <span className="text-[11px]" style={{ color: "#D1D5DB" }}>·</span>
                <span className="text-[11px] font-bold" style={{ color: "#059669" }}>
                  {getCountdownText()}
                </span>
              </div>
              <p className="text-[20px] font-bold truncate mt-0.5" style={{ color: "hsl(var(--foreground))" }}>{pupilName}</p>
            </div>

            {/* Right: time + chevron */}
            <div className="flex flex-col items-end shrink-0">
              <span className="text-[22px] font-bold" style={{ color: "hsl(var(--foreground))", fontVariantNumeric: "tabular-nums", fontFamily: "ui-monospace, monospace" }}>
                {formatTime24(startTime)}
              </span>
              <ExpandChevron isExpanded={expanded} className="mt-1" />
            </div>
          </div>

          {/* Pill badges row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={pillStyle} style={{ background: "rgba(99,102,241,0.1)", color: "#4338CA" }}>
              <Calendar className="h-[11px] w-[11px]" /> {getDateLabel()}
            </span>
            <span className={pillStyle} style={{ background: "rgba(99,102,241,0.1)", color: "#4338CA" }}>
              <Clock className="h-[11px] w-[11px]" /> {formatDuration()}
            </span>
            {(pickupLocation || pickupPostcode) && (
              <span className={pillStyle} style={{ background: "rgba(99,102,241,0.1)", color: "#4338CA" }}>
                <MapPin className="h-[11px] w-[11px]" />
                <span className="truncate max-w-[200px]">
                  {[pickupLocation, pickupPostcode].filter(Boolean).join(", ")}
                </span>
              </span>
            )}
          </div>
        </button>

        {/* === RUNNING LATE ALERT === */}
        <AnimatePresence>
          {isRunningLate && !lateDismissed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div
                className="mx-4 mb-2 flex items-center gap-2.5 p-3 rounded-xl"
                style={{ background: "rgba(251,191,36,0.2)", border: "1px solid rgba(251,191,36,0.4)" }}
              >
                <AlertTriangle className="h-5 w-5 shrink-0" style={{ color: "#FBBF24" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold" style={{ color: "hsl(var(--foreground))" }}>
                    You may arrive ~{lateByMinutes} min late
                  </p>
                  <p className="text-[10px] mt-0.5 text-muted-foreground">
                    ETA {arrivalTimeText}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); sendLateETA(); }}
                  className="shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold"
                  style={{ background: "#FBBF24", color: "#1a1a2e" }}
                >
                  Send ETA
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setLateDismissed(true); }}
                  className="shrink-0"
                >
                  <X className="h-4 w-4" style={{ color: "rgba(255,255,255,0.5)" }} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* === EXPANDED CONTENT === */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="overflow-hidden"
            >
              <div className="px-[18px] pb-[18px]" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Divider */}
                <div style={{ height: 1, background: "rgba(0,0,0,0.06)" }} />

                {/* 1. Info Badges Row */}
                <div className="grid grid-cols-3 gap-[10px]">
                  {/* Start */}
                  <div className="flex flex-col items-center py-3 rounded-xl" style={{ background: "rgba(0,0,0,0.04)" }}>
                    <Clock className="h-4 w-4 mb-1 text-muted-foreground" />
                    <span className="text-[15px] font-bold" style={{ color: "hsl(var(--foreground))" }}>{formatTime24(startTime)}</span>
                    <span className="text-[10px] mt-0.5 text-muted-foreground">Start</span>
                  </div>
                  {/* Duration */}
                  <div className="flex flex-col items-center py-3 rounded-xl" style={{ background: "rgba(0,0,0,0.04)" }}>
                    <Hourglass className="h-4 w-4 mb-1 text-muted-foreground" />
                    <span className="text-[15px] font-bold" style={{ color: "hsl(var(--foreground))" }}>{formatDuration()}</span>
                    <span className="text-[10px] mt-0.5 text-muted-foreground">Duration</span>
                  </div>
                  {/* Balance / Due */}
                  <div className="flex flex-col items-center py-3 rounded-xl" style={{ background: "rgba(0,0,0,0.04)" }}>
                    <PoundSterling className="h-4 w-4 mb-1 text-muted-foreground" />
                    <span className={`text-[15px] font-bold ${effectiveBalance < 0 ? "text-orange-500" : "text-emerald-600"}`}>
                      £{Math.abs(effectiveBalance).toFixed(0)}
                    </span>
                    <span className="text-[10px] mt-0.5 text-muted-foreground">
                      {effectiveBalance < 0 ? "Due" : "Balance"}
                    </span>
                  </div>
                </div>

                {/* 2. Live ETA Row */}
                {(etaLoading || etaMinutes > 0) && (
                  <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(0,0,0,0.04)" }}>
                    <Car className="h-5 w-5 shrink-0" style={{ color: "#6366F1" }} />
                    {etaLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        <span className="text-[11px] text-muted-foreground">Calculating ETA...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground">Live ETA</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[15px] font-bold" style={{ color: "hsl(var(--foreground))" }}>~{etaMinutes} min</span>
                          {trafficCondition && (
                            <>
                              <span className="text-muted-foreground">·</span>
                              <span className={`w-2 h-2 rounded-full ${getTrafficDot()}`} />
                              <span className="text-[11px] capitalize text-muted-foreground">
                                {trafficCondition} traffic
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2b. Weather Conditions Strip */}
                {currentWeather && currentWeather.temperature != null && (
                  <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(0,0,0,0.04)" }}>
                    <Thermometer className="h-5 w-5 shrink-0" style={{ color: "#f59e0b" }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-bold" style={{ color: "hsl(var(--foreground))" }}>{currentWeather.temperature}°C</span>
                        {currentWeather.description && (
                          <span className="text-[11px] text-muted-foreground">{currentWeather.description}</span>
                        )}
                      </div>
                      {getWeatherSafetyTip() && (
                        <p className="text-[10px] mt-0.5" style={{ color: getWeatherSafetyTip()!.color }}>
                          ⚠ {getWeatherSafetyTip()!.tip}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* 2c. Vehicle Health Quick Status */}
                {primaryDevice && (
                  <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(0,0,0,0.04)" }}>
                    <Car className="h-5 w-5 shrink-0" style={{ color: primaryDevice.is_connected ? "#16a34a" : "#dc2626" }} />
                    <div className="flex-1 min-w-0 flex items-center gap-3">
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

                {/* 2d. Last Lesson Plan */}
                {lastLessonPlan && (
                  <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "rgba(0,0,0,0.04)" }}>
                    <BookOpen className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "#7c3aed" }} />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Plan for this lesson</span>
                      <p className="text-[12px] mt-0.5 line-clamp-2" style={{ color: "hsl(var(--foreground))" }}>{lastLessonPlan}</p>
                    </div>
                  </div>
                )}

                {/* 2e. Payment Warning Banner */}
                {noBalance && (
                  <div
                    className="flex items-center gap-2.5 p-3 rounded-xl"
                    style={{ background: paymentDue ? "rgba(239,68,68,0.2)" : "rgba(251,191,36,0.2)", border: paymentDue ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(251,191,36,0.4)" }}
                  >
                    <Banknote className="h-5 w-5 shrink-0" style={{ color: paymentDue ? "#dc2626" : "#d97706" }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold" style={{ color: "hsl(var(--foreground))" }}>
                        {paymentDue ? `£${Math.abs(effectiveBalance).toFixed(0)} payment due` : "No balance remaining"}
                      </p>
                      <p className="text-[10px] mt-0.5 text-muted-foreground">
                        Collect payment before or after lesson
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/instructor/take-payment?pupil=${pupilId}`); }}
                      className="shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold"
                      style={{ background: paymentDue ? "#ef4444" : "#FBBF24", color: paymentDue ? "white" : "#1a1a2e" }}
                    >
                      Collect
                    </button>
                  </div>
                )}

                {/* 3. Unread Messages Row */}
                {hasUnread && (
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/instructor/messages`); }}
                    className="flex items-center gap-3 p-3 rounded-xl w-full text-left"
                    style={{ background: "rgba(0,0,0,0.04)" }}
                  >
                    <MessageCircle className="h-5 w-5 shrink-0 text-orange-500" />
                    <span className="text-[13px] font-medium flex-1" style={{ color: "hsl(var(--foreground))" }}>
                      {pupilUnreadCount} unread message{pupilUnreadCount !== 1 ? "s" : ""} from {firstName}
                    </span>
                    <ChevronDown className="h-4 w-4 -rotate-90 text-muted-foreground" />
                  </button>
                )}

                {/* 4. Start Lesson Button */}
                {minutesUntil <= 15 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      supabase.from("scheduled_lessons").update({ status: "in_progress" }).eq("id", lessonId).then(() => {});
                      navigate(`/instructor/tracking?lesson=${lessonId}`);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-[13px] rounded-[14px] text-white font-bold text-[15px]"
                    style={{ background: "linear-gradient(90deg, #22c55e, rgba(34,197,94,0.8))" }}
                  >
                    <Navigation className="h-4 w-4" /> Start Lesson
                  </button>
                )}

                {/* End Lesson Button */}
                {minutesUntil <= 0 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setWizardOpen(true); }}
                    className="w-full flex items-center justify-center gap-2 py-[13px] rounded-[14px] font-bold text-[15px]"
                    style={{ background: "rgba(255,255,255,0.15)", color: "white" }}
                  >
                    <CheckCircle2 className="h-4 w-4" /> End Lesson
                  </button>
                )}

                {/* GPS Route Recorder */}
                <button
                  onClick={(e) => { e.stopPropagation(); setShowGPSRecorder(!showGPSRecorder); }}
                  className="w-full flex items-center justify-center gap-2 py-[11px] rounded-[14px] font-bold text-[13px]"
                  style={{
                    background: showGPSRecorder ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)",
                    color: showGPSRecorder ? "#dc2626" : "#16a34a",
                  }}
                >
                  <Play className="h-4 w-4" />
                  {showGPSRecorder ? "Hide GPS Recorder" : "📍 Record Route (GPS)"}
                </button>

                <AnimatePresence>
                  {showGPSRecorder && instructorId && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <LessonRouteRecorder
                        instructorId={instructorId}
                        pupilId={pupilId}
                        lessonId={lessonId}
                        onRouteRecorded={() => setShowGPSRecorder(false)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-6 gap-[8px]">
                  {/* Prep */}
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/instructor/pupils/${pupilId}?tab=progress`); }}
                    className="flex flex-col items-center gap-1 py-3 rounded-xl"
                    style={{ background: "rgba(124,58,237,0.1)" }}
                  >
                    <ClipboardList className="h-5 w-5" style={{ color: "#7c3aed" }} />
                    <span className="text-[10px] font-bold" style={{ color: "hsl(var(--foreground))" }}>Prep</span>
                  </button>
                  {/* Navigate */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleNavigate(); }}
                    className="flex flex-col items-center gap-1 py-3 rounded-xl"
                    style={{ background: "rgba(0,0,0,0.04)" }}
                  >
                    <Navigation className="h-5 w-5 text-blue-600" />
                    <span className="text-[10px] font-bold" style={{ color: "hsl(var(--foreground))" }}>Navigate</span>
                  </button>

                  {/* On My Way */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="flex flex-col items-center gap-1 py-3 rounded-xl"
                        style={{ background: "rgba(0,0,0,0.04)" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Send className="h-5 w-5" style={{ color: "#6366F1" }} />
                        <span className="text-[10px] font-bold" style={{ color: "hsl(var(--foreground))" }}>On Way</span>
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

                  {/* Call */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCall(); }}
                    className="flex flex-col items-center gap-1 py-3 rounded-xl"
                    style={{ background: "rgba(0,0,0,0.04)" }}
                  >
                    <Phone className="h-5 w-5 text-emerald-600" />
                    <span className="text-[10px] font-bold" style={{ color: "hsl(var(--foreground))" }}>Call</span>
                  </button>

                  {/* SMS */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleMessage(); }}
                    className="flex flex-col items-center gap-1 py-3 rounded-xl"
                    style={{ background: "rgba(0,0,0,0.04)" }}
                  >
                    <MessageSquare className="h-5 w-5 text-orange-500" />
                    <span className="text-[10px] font-bold" style={{ color: "hsl(var(--foreground))" }}>SMS</span>
                  </button>

                  {/* Here / Arrived */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleArrived(); }}
                    className="flex flex-col items-center gap-1 py-3 rounded-xl"
                    style={{ background: "rgba(22,163,74,0.1)" }}
                  >
                    <MapPin className="h-5 w-5 text-emerald-600" />
                    <span className="text-[10px] font-bold" style={{ color: "hsl(var(--foreground))" }}>Here</span>
                  </button>
                </div>

                {/* 6. Secondary Actions Row */}
                <div className="grid grid-cols-3 gap-[10px]">
                  <button
                    onClick={(e) => { e.stopPropagation(); setLateSheetOpen(true); }}
                    className="flex items-center justify-center gap-1.5 py-[10px] rounded-[10px] text-[12px] font-medium"
                    style={{ background: "rgba(251,191,36,0.1)", color: "#d97706" }}
                  >
                    <AlertTriangle className="h-3.5 w-3.5" /> Running Late
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setRescheduleOpen(true); }}
                    className="flex items-center justify-center gap-1.5 py-[10px] rounded-[10px] text-[12px] font-medium"
                    style={{ background: "rgba(0,0,0,0.04)", color: "hsl(var(--foreground))" }}
                  >
                    <Calendar className="h-3.5 w-3.5" /> Reschedule
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setCancelOpen(true); }}
                    className="flex items-center justify-center gap-1.5 py-[10px] rounded-[10px] text-[12px] font-medium"
                    style={{ background: "rgba(239,68,68,0.08)", color: "#dc2626" }}
                  >
                    <X className="h-3.5 w-3.5" /> Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dialogs */}
      {instructorId && (
        <CancelLessonDialog
          open={cancelOpen}
          onOpenChange={setCancelOpen}
          lessonId={lessonId}
          pupilId={pupilId}
          pupilName={pupilName}
          amountDue={durationMinutes * (40 / 60)}
          pupilBalance={accountBalance}
          durationMinutes={durationMinutes}
          lessonDate={lessonDate}
          lessonTime={startTime}
          endTime={getEndTime()}
          instructorId={instructorId}
          onCancelled={handleCancelled}
        />
      )}
      {instructorId && (
        <RescheduleLessonSheet
          open={rescheduleOpen}
          onOpenChange={setRescheduleOpen}
          lessonId={lessonId}
          instructorId={instructorId}
          pupilName={pupilName}
          currentDate={lessonDate}
          currentTime={startTime}
          durationMinutes={durationMinutes}
          onRescheduled={handleCancelled}
        />
      )}
      {instructorId && (
        <EndLessonWizard
          open={wizardOpen}
          onOpenChange={setWizardOpen}
          lessonId={lessonId}
          pupilId={pupilId}
          pupilName={pupilName}
          instructorId={instructorId}
          durationMinutes={durationMinutes}
          lessonDate={lessonDate}
          startTime={startTime}
          currentBalance={accountBalance}
          onCompleted={handleCancelled}
        />
      )}
      <RunningLateSheet
        open={lateSheetOpen}
        onOpenChange={setLateSheetOpen}
        pupilName={pupilName}
        pupilPhone={pupilPhone}
        startTime={startTime}
      />
    </>
  );
}
