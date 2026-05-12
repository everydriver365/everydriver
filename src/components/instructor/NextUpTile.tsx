import React, { useState, useEffect, useRef } from "react";
import { format, parse, isToday, isTomorrow, parseISO, formatDistanceToNowStrict } from "date-fns";
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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CancelLessonDialog } from "./CancelLessonDialog";
import { RescheduleLessonSheet } from "./RescheduleLessonSheet";
import { EndLessonWizard } from "./EndLessonWizard";
import { RunningLateSheet } from "./RunningLateSheet";
import { supabase } from "@/integrations/supabase/client";
import { LessonRouteRecorder } from "./LessonRouteRecorder";
import { getNextUpVisibility } from "./nextUpTileState";

import { useTrafficETA } from "@/hooks/useTrafficETA";
import { usePupilUnreadCount } from "@/hooks/usePupilUnreadCount";
import { useRunningLateDetection } from "@/hooks/useRunningLateDetection";
import { useDrivingAlerts } from "@/hooks/useDrivingAlerts";
import { useVehicleHealth } from "@/hooks/useVehicleHealth";
import { LessonCheckInBadge } from "./LessonCheckInBadge";
import { haptics } from "@/lib/haptics";
import { toast } from "sonner";

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
import { Construction, Ban, Smartphone, CloudRain, Eye } from "lucide-react";
import { SmartPromptsStrip, type SmartPrompt } from "./SmartPromptsStrip";

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
  lessonStatus?: string | null;
  lastLessonPlan?: string | null;
  hideHeader?: boolean;
  forceExpanded?: boolean;
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
  checkInStatus, lessonStatus, lastLessonPlan,
  hideHeader = false, forceExpanded = false,
}: NextUpTileProps) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [expanded, setExpanded] = useState(forceExpanded);
  const [nudgeSentAt, setNudgeSentAt] = useState<number | null>(null);
  // Auto-clear "Reminder sent" chip back to Awaiting after ~3s
  useEffect(() => {
    if (!nudgeSentAt) return;
    const t = setTimeout(() => setNudgeSentAt(null), 3000);
    return () => clearTimeout(t);
  }, [nudgeSentAt]);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [lateSheetOpen, setLateSheetOpen] = useState(false);
  // Optimistic status overlay so the segmented control + banner update
  // instantly when the user fires an action from the sheet, without
  // waiting for the next refetch round-trip.
  const [localStatus, setLocalStatus] = useState<"en_route" | "late" | null>(null);
  const [statusBanner, setStatusBanner] = useState<{
    kind: "en_route" | "late";
    etaText: string | null;
    delayMinutes: number | null;
  } | null>(null);
  // Reset overlays when we move to a different lesson
  useEffect(() => {
    setLocalStatus(null);
    setStatusBanner(null);
  }, [lessonId]);
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

  // Fetch instructor hourly rate (for expected earnings) and auto-start-tracker preference
  const [hourlyRate, setHourlyRate] = useState<number>(40);
  const [autoStartTracker, setAutoStartTracker] = useState<boolean>(false);
  useEffect(() => {
    if (!instructorId) return;
    supabase
      .from("instructors")
      .select("hourly_rate, auto_start_tracker")
      .eq("id", instructorId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.hourly_rate) setHourlyRate(Number(data.hourly_rate));
        if (typeof data?.auto_start_tracker === "boolean") setAutoStartTracker(data.auto_start_tracker);
      });
  }, [instructorId]);
  const expectedEarnings = (durationMinutes / 60) * hourlyRate;

  // Last completed lesson for this pupil — read-only summary shown in expanded view.
  const { data: lastLesson } = useQuery({
    queryKey: ["next-up-tile-last-lesson", instructorId, pupilId],
    enabled: !!instructorId && !!pupilId && expanded,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lesson_history")
        .select("lesson_date, start_time, duration_minutes, skills_practiced, notes, rating")
        .eq("instructor_id", instructorId!)
        .eq("pupil_id", pupilId)
        .order("lesson_date", { ascending: false })
        .order("start_time", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) return null;
      return data;
    },
  });
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
    // Compute arrival clock time from live drive-time ETA (current car
    // location → pickup postcode via useTrafficETA).
    const etaClock = etaMinutes && etaMinutes > 0
      ? format(new Date(Date.now() + etaMinutes * 60000), "HH:mm")
      : null;
    const message = etaClock
      ? `Hi ${firstName}, on the way — ETA ${etaClock}.`
      : `Hi ${firstName}, on the way.`;
    sendSMS(message);
    supabase.from("scheduled_lessons").update({ status: "en_route" }).eq("id", lessonId).then(() => {});
    supabase.functions.invoke("notify-pupil", { body: { pupilId, type: "en_route" } }).catch(() => {});
    try { haptics.medium(); } catch {}
    setLocalStatus("en_route");
    setStatusBanner({ kind: "en_route", etaText: etaClock, delayMinutes: null });
    queryClient.invalidateQueries({ queryKey: ["next-lesson-details"] });
    queryClient.invalidateQueries({ queryKey: ["today-remaining-lessons"] });
    toast.success(etaClock ? `On the way · ETA ${etaClock}` : "On the way");
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

  // ── SMART PROMPTS (PRE_LESSON phase) ───────────────────────────────────
  // Real-time assistant strip. Only surfaces prompts when something
  // actually matters; never invents data. Top 1–2 by priority are shown.
  const smartPrompts: SmartPrompt[] = (() => {
    const out: SmartPrompt[] = [];

    // 1. Running late (URGENT — highest priority)
    if (isRunningLate) {
      out.push({
        id: "late",
        tone: "red",
        icon: AlertTriangle,
        priority: 0,
        text: lateByMinutes > 0 ? `You may be late (${lateByMinutes} min)` : "You may be late",
        cta: pupilPhone ? { label: "Notify pupil", onClick: sendLateETA } : undefined,
      });
    }

    // 2. Travel — leave-now / leave-in-X / traffic delay
    if (etaMinutes > 0 && !isRunningLate) {
      const slack = minutesUntil - (etaMinutes + PARKING_BUFFER_MIN);
      if (slack <= 0 && minutesUntil <= 60) {
        out.push({
          id: "leave-now",
          tone: "amber",
          icon: Car,
          priority: 1,
          text: "Leave now to arrive on time",
        });
      } else if (slack > 0 && slack <= 20 && minutesUntil <= 90) {
        out.push({
          id: "leave-in",
          tone: "blue",
          icon: Car,
          priority: 3,
          text: `Leave in ${Math.round(slack)} min`,
        });
      }
      if (trafficHeavy) {
        out.push({
          id: "traffic",
          tone: "amber",
          icon: Car,
          priority: 2,
          text: "Heavy traffic on your route",
        });
      }
    }

    // 3. Confirmation
    if (checkInStatus === "pending" || checkInStatus == null) {
      // Only nudge once we're inside a useful window (next 24h)
      if (minutesUntil <= 24 * 60 && minutesUntil > 30) {
        out.push({
          id: "confirm",
          tone: "blue",
          icon: MessageCircle,
          priority: 5,
          text: "Pupil has not confirmed yet",
          cta: pupilPhone ? { label: "Message pupil", onClick: handleMessage } : undefined,
        });
      }
    }

    // 4. Payment due
    if (paymentDue) {
      out.push({
        id: "payment",
        tone: "amber",
        icon: PoundSterling,
        priority: 4,
        text: `Payment due — £${Math.abs(effectiveBalance).toFixed(0)} owed`,
        cta: { label: "Collect", onClick: () => navigate(`/instructor/pupils/${pupilId}?tab=payments`) },
      });
    }

    // 5. Weather (only if it could affect the lesson)
    const weatherTip = getWeatherSafetyTip();
    if (weatherTip && minutesUntil <= 6 * 60) {
      const code = currentWeather?.weatherCode;
      const isLowVis = code === 45 || code === 48;
      out.push({
        id: "weather",
        tone: "amber",
        icon: isLowVis ? Eye : CloudRain,
        priority: 6,
        text: weatherTip.tip,
      });
    }

    // 6. Lesson prep — last focus / recommended today
    if (lastLesson?.skills_practiced && Array.isArray(lastLesson.skills_practiced) && lastLesson.skills_practiced.length > 0) {
      const lastFocus = String(lastLesson.skills_practiced[0]);
      out.push({
        id: "prep",
        tone: "green",
        icon: BookOpen,
        priority: 7,
        text: `Last focus: ${lastFocus}`,
      });
    } else if (lastLessonPlan) {
      out.push({
        id: "prep-plan",
        tone: "green",
        icon: BookOpen,
        priority: 7,
        text: `Recommended today: ${lastLessonPlan}`,
      });
    }

    return out;
  })();

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
    red: "#E15D5A",
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

      <div style={{ fontFamily: iosFont, WebkitFontSmoothing: "antialiased" }}>
        {/* ── Card — matches other home widgets (white, rounded-[20px], soft shadow) ── */}
        <div
          className={hideHeader ? "" : "bg-white rounded-[20px] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_28px_-12px_rgba(16,24,40,0.08)]"}
          style={{
            overflow: "hidden",
            padding: hideHeader ? 0 : 16,
            display: "flex",
            flexDirection: "column",
            gap: hideHeader ? 0 : 14,
            position: "relative",
            width: "100%",
            background: hideHeader ? "transparent" : undefined,
          }}
        >
          {/* ── Header (whole row tappable to expand) ── */}
          {!hideHeader && (
          <div style={{ position: "relative", margin: -16, marginBottom: expanded ? 4 : -16 }}>
            {expanded ? (
              /* Premium slim toggle strip when expanded */
              <button
                onClick={() => setExpanded(false)}
                aria-expanded={true}
                aria-label="Hide lesson details"
                className="active:opacity-80"
                style={{
                  width: "100%",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 16px",
                  background: "transparent", border: "none", cursor: "pointer", textAlign: "left",
                }}
              >
                <span style={{
                  fontSize: a11yPx(12), fontWeight: 700, color: "#3A5BB0",
                  letterSpacing: 1.2, textTransform: "uppercase",
                }}>
                  Up next · tap to hide
                </span>
                <ChevronDown
                  aria-hidden
                  style={{
                    width: 18, height: 18, color: "#3A5BB0",
                    transform: "rotate(180deg)",
                    transition: "transform 250ms cubic-bezier(0.2,0.7,0.2,1)",
                  }}
                  strokeWidth={2}
                />
              </button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {/* ── MAP HEADER ─────────────────────────────────────── */}
                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  aria-label="Show lesson details"
                  style={{
                    position: "relative", width: "100%", height: 132,
                    border: "none", padding: 0, cursor: "pointer",
                    background: "#EEF2F7", overflow: "hidden",
                    borderTopLeftRadius: 20, borderTopRightRadius: 20,
                  }}
                >
                  <div style={{ position: "absolute", inset: 0, opacity: 0.88 }}>
                    <GoogleMapPreview postcode={pickupPostcode} address={pickupLocation} height={132} />
                  </div>
                  {/* Soft white fade into content area */}
                  <div aria-hidden style={{
                    position: "absolute", left: 0, right: 0, bottom: 0, height: 56,
                    background: "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.95) 100%)",
                    pointerEvents: "none",
                  }} />

                  {/* Countdown chip — top-left */}
                  <div style={{ position: "absolute", top: 10, left: 10, display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "5px 10px", borderRadius: 999,
                      background: "rgba(255,255,255,0.96)", backdropFilter: "blur(8px)",
                      boxShadow: "0 1px 3px rgba(16,24,40,0.08), 0 0 0 0.5px rgba(16,24,40,0.06)",
                  }}>
                    {minutesUntil <= 15 && (
                      <span aria-hidden style={{ width: 6, height: 6, borderRadius: 999, background: "#C8434F" }} />
                    )}
                    <Clock style={{ width: 11, height: 11, color: "#3A5BB0" }} strokeWidth={2.4} />
                    <span style={{ fontSize: a11yPx(11), fontWeight: 600, color: "#1F2A44", letterSpacing: 0.1 }}>
                      {minutesUntil <= 0 ? "Now" : `In ${getCountdownText()}`}
                    </span>
                  </div>

                  {/* ETA chip — top-right (only when known) */}
                  {etaMinutes > 0 && etaText && (
                    <div style={{ position: "absolute", top: 10, right: 10, display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "5px 10px", borderRadius: 999,
                        background: "rgba(255,255,255,0.96)", backdropFilter: "blur(8px)",
                        boxShadow: "0 1px 3px rgba(16,24,40,0.08), 0 0 0 0.5px rgba(16,24,40,0.06)",
                    }}>
                      <Car style={{ width: 11, height: 11, color: "#B85C66" }} strokeWidth={2.4} />
                      <span style={{ fontSize: a11yPx(11), fontWeight: 600, color: "#1F2A44", letterSpacing: 0.1, fontVariantNumeric: "tabular-nums" }}>
                        {etaText}
                      </span>
                    </div>
                  )}

                  {/* Avatar bubble — bottom-left, floating over fade */}
                  <div style={{ position: "absolute", left: 14, bottom: 10 }}>
                    {pupilProfileImage ? (
                      <img
                        src={pupilProfileImage}
                        alt={pupilName}
                        style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", display: "block",
                          border: "2px solid #FFFFFF",
                          boxShadow: "0 2px 6px rgba(16,24,40,0.12)",
                        }}
                      />
                    ) : (
                      <div style={{
                        width: 44, height: 44, borderRadius: "50%",
                        background: "linear-gradient(135deg, #3A5BB0 0%, #3D55A1 100%)",
                        color: "#fff", fontSize: a11yPx(15), fontWeight: 600,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        border: "2px solid #FFFFFF",
                        boxShadow: "0 2px 6px rgba(16,24,40,0.12)",
                      }}>
                        {getInitials(pupilName)}
                      </div>
                    )}
                  </div>

                  {/* Check-in badge — bottom-right */}
                  {checkInStatus && (
                    <div style={{ position: "absolute", right: 12, bottom: 12 }}>
                      <LessonCheckInBadge status={checkInStatus} className="text-[10px] py-0 px-1.5 h-5" />
                    </div>
                  )}
                </button>

                {/* ── CONTENT AREA ─────────────────────────────────── */}
                <div style={{ padding: "10px 16px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
                  {/* Date / time chip */}
                  <div style={{
                    alignSelf: "flex-start",
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "5px 10px", borderRadius: 999,
                    background: "#EEF2FB",
                    border: "0.5px solid rgba(58,91,176,0.12)",
                  }}>
                    <Calendar style={{ width: 12, height: 12, color: "#3A5BB0" }} strokeWidth={2.4} />
                    <span style={{ fontSize: a11yPx(11), fontWeight: 600, color: "#1F2A44", letterSpacing: 0.4, textTransform: "uppercase", fontVariantNumeric: "tabular-nums" }}>
                      {format(parseISO(lessonDate), "EEE d MMM").toUpperCase()} · {formatTime24(startTime)}
                    </span>
                  </div>

                  {/* Pupil name + chevron */}
                  <button
                    type="button"
                    onClick={() => setExpanded(true)}
                    aria-expanded={false}
                    aria-label="Show lesson details"
                    style={{
                      width: "100%", padding: 0, background: "transparent", border: "none",
                      cursor: "pointer", textAlign: "left",
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                    }}
                  >
                    <span style={{
                      fontSize: a11yPx(20), fontWeight: 700, letterSpacing: -0.4,
                      color: "#0B1530", lineHeight: 1.15,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      display: "inline-flex", alignItems: "center", gap: 8,
                    }}>
                      {toSentenceName(pupilName)}
                      {totalUnreadBadge > 0 && (
                        <span style={{
                          minWidth: 18, height: 18, padding: "0 5px", borderRadius: 9,
                          background: "#B23A3F", color: "#fff", fontSize: a11yPx(11), fontWeight: 600,
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          fontVariantNumeric: "tabular-nums",
                        }}>{totalUnreadBadge}</span>
                      )}
                    </span>
                    <ChevronDown
                      aria-hidden
                      style={{
                        width: 18, height: 18, color: "#8A93A6", flexShrink: 0,
                        transform: "rotate(0deg)",
                        transition: "transform 250ms cubic-bezier(0.2,0.7,0.2,1)",
                      }}
                      strokeWidth={2}
                    />
                  </button>

                  {/* Info rows */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {/* Duration / type */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span aria-hidden style={{
                        width: 26, height: 26, borderRadius: 8,
                        background: "#EEF2FB", color: "#3A5BB0",
                        display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        <Hourglass style={{ width: 13, height: 13 }} strokeWidth={2.2} />
                      </span>
                      <span style={{ fontSize: a11yPx(13), color: "#1F2A44", fontWeight: 500 }}>
                        Standard lesson · <span style={{ color: "#5A6378", fontWeight: 400 }}>{formatHoursLong(durationMinutes)}</span>
                      </span>
                    </div>

                    {/* Pickup */}
                    {(pickupPostcode || pickupLocation) && (
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                        <span aria-hidden style={{
                          width: 26, height: 26, borderRadius: 8,
                          background: "#EEF2FB", color: "#3A5BB0",
                          display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                          <MapPin style={{ width: 13, height: 13 }} strokeWidth={2.2} />
                        </span>
                        <span style={{
                          fontSize: a11yPx(13), color: "#1F2A44", fontWeight: 500,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0,
                        }}>
                          {pickupPostcode ? <>{pickupPostcode}{pickupLocation ? <span style={{ color: "#5A6378", fontWeight: 400 }}> · {pickupLocation}</span> : null}</> : pickupLocation}
                        </span>
                      </div>
                    )}

                    {/* ETA + traffic */}
                    {etaMinutes > 0 && etaText && (
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                        <span aria-hidden style={{
                          width: 26, height: 26, borderRadius: 8,
                          background: "#FBEEEF", color: "#B85C66",
                          display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                          <Car style={{ width: 13, height: 13 }} strokeWidth={2.2} />
                        </span>
                        <span style={{ fontSize: a11yPx(13), color: "#1F2A44", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
                          {etaText}
                          {trafficCondition && (
                            <span style={{ color: "#5A6378", fontWeight: 400 }}> · {trafficCondition} traffic</span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action row — Call / Text / Navigate */}
                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleCall(); }}
                      aria-label="Call pupil"
                      disabled={!pupilPhone}
                      style={{
                        flex: 1, height: 36, borderRadius: 10,
                        background: "#3D55A1", color: "#FFFFFF", border: "none",
                        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
                        fontSize: a11yPx(13), fontWeight: 600, letterSpacing: 0.1,
                        cursor: pupilPhone ? "pointer" : "not-allowed",
                        opacity: pupilPhone ? 1 : 0.5,
                        boxShadow: "0 4px 12px -4px rgba(41,82,179,0.45)",
                      }}
                    >
                      <Phone style={{ width: 13, height: 13 }} strokeWidth={2.2} /> Call
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleMessage(); }}
                      aria-label="Text pupil"
                      disabled={!pupilPhone}
                      style={{
                        flex: 1, height: 36, borderRadius: 10,
                        background: "#EEF2FB", color: "#3D55A1",
                        border: "0.5px solid rgba(41,82,179,0.14)",
                        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
                        fontSize: a11yPx(13), fontWeight: 600, letterSpacing: 0.1,
                        cursor: pupilPhone ? "pointer" : "not-allowed",
                        opacity: pupilPhone ? 1 : 0.5,
                      }}
                    >
                      <MessageSquare style={{ width: 13, height: 13 }} strokeWidth={2.2} /> Text
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleNavigate(); }}
                      aria-label="Navigate to pickup"
                      disabled={!pickupPostcode}
                      style={{
                        flex: 1, height: 36, borderRadius: 10,
                        background: "#EEF2FB", color: "#3D55A1",
                        border: "0.5px solid rgba(41,82,179,0.14)",
                        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
                        fontSize: a11yPx(13), fontWeight: 600, letterSpacing: 0.1,
                        cursor: pickupPostcode ? "pointer" : "not-allowed",
                        opacity: pickupPostcode ? 1 : 0.5,
                      }}
                    >
                      <Navigation style={{ width: 13, height: 13 }} strokeWidth={2.2} /> Go
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          )}

          {/* ── EXPANDED CONTENT (inside the same white card) ──
              When collapsed, ONLY the header above is visible. Tapping the
              chevron reveals everything below (map, travel bar, route,
              actions, start-track, lesson details, conditions, status). */}
          <AnimatePresence initial={false}>
          {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-hidden"
            style={{ marginLeft: 0, marginRight: 0, marginBottom: hideHeader ? 0 : -16, marginTop: hideHeader ? 0 : 4 }}
          >
          <div style={{ padding: hideHeader ? 0 : "16px 0 20px", display: "flex", flexDirection: "column", gap: 16, borderTop: hideHeader ? "none" : "0.5px solid #c6c6c8", background: "transparent" }}>

          {/* ── HERO CARD — native iOS UIKit grouped table view style ── */}
          <div style={{
            background: "#FFFFFF",
            borderRadius: 13,
            overflow: "hidden",
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, sans-serif',
          }}>
            {/* ── 1. STATUS ROW — pulsing amber dot + Awaiting badge / Today ── */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 16px",
            }}>
              {(() => {
                const isPending = !checkInStatus || checkInStatus === "pending";
                const canNudge = isPending && !!pupilPhone;
                const badgeBase: React.CSSProperties = {
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "4px 10px", borderRadius: 6,
                  fontSize: 13, fontWeight: 500, letterSpacing: -0.08,
                  border: "none",
                };
                const Dot = ({ color, pulse }: { color: string; pulse?: boolean }) => (
                  <span style={{ position: "relative", width: 8, height: 8, display: "inline-block" }}>
                    {pulse && (
                      <span aria-hidden style={{
                        position: "absolute", inset: 0, borderRadius: "50%",
                        background: color, opacity: 0.45,
                        animation: "ios-halo-pulse 1.6s ease-out infinite",
                      }} />
                    )}
                    <span style={{
                      position: "absolute", inset: 0, borderRadius: "50%",
                      background: color,
                    }} />
                  </span>
                );
                if (nudgeSentAt) {
                  return (
                    <span style={{ ...badgeBase, background: "transparent", color: "#34C759" }}>
                      <Dot color="#34C759" />
                      Reminder sent
                    </span>
                  );
                }
                if (canNudge) {
                  return (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        try { haptics.medium(); } catch {}
                        const firstName = (pupilName || "").split(" ")[0];
                        sendSMS(`Hi ${firstName}, just confirming your driving lesson at ${formatTime24(startTime)}. Please reply to confirm — thanks!`);
                        setNudgeSentAt(Date.now());
                        toast.success("Reminder sent");
                      }}
                      aria-label="Send confirmation reminder to pupil"
                      style={{
                        ...badgeBase,
                        background: "#fff3cd", color: "#9a6700",
                        cursor: "pointer",
                      }}
                    >
                      <Dot color="#d4a017" pulse />
                      Awaiting confirmation
                    </button>
                  );
                }
                if (checkInStatus === "confirmed") {
                  return (
                    <span style={{ ...badgeBase, background: "transparent", color: "#34C759" }}>
                      <Dot color="#34C759" />
                      Confirmed
                    </span>
                  );
                }
                if (checkInStatus === "declined" || checkInStatus === "cancelled") {
                  return (
                    <span style={{ ...badgeBase, background: "transparent", color: "#ff3b30" }}>
                      <Dot color="#ff3b30" />
                      {checkInStatus === "declined" ? "Declined" : "Cancelled"}
                    </span>
                  );
                }
                return (
                  <span style={{ ...badgeBase, background: "#fff3cd", color: "#9a6700" }}>
                    <Dot color="#d4a017" pulse />
                    Awaiting confirmation
                  </span>
                );
              })()}
              <span style={{ fontSize: 13, color: "#6e6e73", letterSpacing: -0.08 }}>
                {getDateLabel()}
              </span>
            </div>

            {/* ── 2. NAME + TIME ROW ── */}
            <div style={{
              display: "flex", alignItems: "baseline", justifyContent: "space-between",
              padding: "0 16px 10px", gap: 12,
            }}>
              <div style={{
                fontSize: 22, fontWeight: 700, color: "#000000",
                letterSpacing: -0.4, minWidth: 0,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {toSentenceName(pupilName)}
              </div>
              <div style={{
                fontSize: 28, fontWeight: 700, color: "#000000",
                letterSpacing: -0.6, fontVariantNumeric: "tabular-nums",
                flexShrink: 0,
              }}>
                {formatTime24(startTime)}
              </div>
            </div>

            {/* ── 3. META ROWS — thin SVG icons ── */}
            <div style={{ padding: "0 16px 14px", display: "flex", flexDirection: "column", gap: 7 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#6e6e73" }}>
                <Car style={{ width: 15, height: 15, color: "#6e6e73", flexShrink: 0 }} strokeWidth={1.6} />
                <span style={{ fontSize: 15, color: "#6e6e73", letterSpacing: -0.1 }}>
                  {`Standard lesson · ${formatHoursLong(durationMinutes)}`}
                </span>
              </div>
              {(pickupLocation || pickupPostcode) && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#6e6e73", minWidth: 0 }}>
                  <MapPin style={{ width: 15, height: 15, color: "#6e6e73", flexShrink: 0 }} strokeWidth={1.6} />
                  <span style={{
                    fontSize: 15, color: "#6e6e73", letterSpacing: -0.1,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {formattedPickupAddress || pickupPostcode || pickupLocation}
                  </span>
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Clock style={{ width: 15, height: 15, color: "#007aff", flexShrink: 0 }} strokeWidth={1.6} />
                <span style={{ fontSize: 15, color: "#007aff", letterSpacing: -0.1, fontVariantNumeric: "tabular-nums" }}>
                  {minutesUntil <= 0 ? "Starting now" : `Starts in ${getCountdownText()}`}
                </span>
              </div>
            </div>

            {/* ── 4. HAIRLINE SEPARATOR ── */}
            <div style={{ height: 0.5, background: "#c6c6c8", width: "100%" }} />

            {/* ── STATE-DRIVEN PRIMARY ACTION (preserved logic) ──
                Keep Start / End lesson behaviour for STARTING / IN_LESSON states;
                show the 3-button native action row for EARLY / MID. */}
            {(() => {
              const vis = getNextUpVisibility(minutesUntil, lessonStatus);
              if (vis.showEndLessonButton) {
                return (
                  <button
                    onClick={(e) => { e.stopPropagation(); setWizardOpen(true); }}
                    className="active:opacity-70"
                    style={{
                      width: "100%", background: "transparent", color: "#ff3b30",
                      border: "none", padding: "14px 16px",
                      fontSize: 17, fontWeight: 600, letterSpacing: -0.2,
                      cursor: "pointer",
                      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                    }}
                  >
                    <CheckCircle2 style={{ width: 18, height: 18 }} strokeWidth={1.8} />
                    End lesson
                  </button>
                );
              }
              if (vis.showStartLessonButton) {
                return (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      supabase.from("scheduled_lessons").update({ status: "in_progress" }).eq("id", lessonId).then(({ error }) => {
                        if (error) {
                          toast.error("Couldn't start lesson", { description: error.message });
                        } else {
                          toast.success("Lesson started", { description: pupilName ? `${pupilName} • good luck!` : "Good luck!" });
                        }
                      });
                      if (autoStartTracker) {
                        navigate(`/instructor/tracking?pupilId=${pupilId}&lessonId=${lessonId}&autoStart=1`);
                      }
                    }}
                    className="active:opacity-70"
                    style={{
                      width: "100%", background: "transparent", color: "#007aff",
                      border: "none", padding: "14px 16px",
                      fontSize: 17, fontWeight: 600, letterSpacing: -0.2,
                      cursor: "pointer",
                      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                    }}
                  >
                    <Play style={{ width: 18, height: 18 }} strokeWidth={1.8} fill="#007aff" />
                    Start lesson
                  </button>
                );
              }

              // EARLY / MID — three equal action buttons (Navigate / Call / Text)
              const actions: { label: string; icon: typeof Navigation; circleBg: string; onClick: () => void; ariaLabel: string }[] = [
                { label: "Navigate", icon: Navigation, circleBg: "#007aff", onClick: handleNavigate, ariaLabel: "Navigate to pickup" },
                { label: "Call", icon: Phone, circleBg: "#34c759", onClick: handleCall, ariaLabel: "Call pupil" },
                { label: "Text", icon: MessageSquare, circleBg: "#007aff", onClick: handleMessage, ariaLabel: "Text pupil" },
              ];
              return (
                <div style={{ display: "flex", alignItems: "stretch", padding: "10px 0" }}>
                  {actions.map((a, i) => (
                    <React.Fragment key={a.label}>
                      <button
                        onClick={(e) => { e.stopPropagation(); a.onClick(); }}
                        aria-label={a.ariaLabel}
                        className="active:opacity-60"
                        style={{
                          flex: 1, background: "transparent", border: "none",
                          padding: "8px 4px", cursor: "pointer",
                          display: "inline-flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
                        }}
                      >
                        <span style={{
                          width: 32, height: 32, borderRadius: "50%",
                          background: a.circleBg,
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                        }}>
                          <a.icon style={{ width: 16, height: 16, color: "#FFFFFF" }} strokeWidth={2} />
                        </span>
                        <span style={{
                          fontSize: 13, fontWeight: 400, color: "#007aff", letterSpacing: -0.08,
                        }}>
                          {a.label}
                        </span>
                      </button>
                      {i < actions.length - 1 && (
                        <div aria-hidden style={{ width: 0.5, background: "#c6c6c8", margin: "6px 0" }} />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              );
            })()}

            {/* ── 6. HAIRLINE SEPARATOR ── */}
            <div style={{ height: 0.5, background: "#c6c6c8", width: "100%" }} />

            {/* Inline status banner (kept — appears after sending ETA / late update) */}
            <AnimatePresence initial={false}>
              {statusBanner && (
                <motion.div
                  key={statusBanner.kind + (statusBanner.etaText || "") + (statusBanner.delayMinutes ?? "")}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.22, ease: [0.2, 0.7, 0.2, 1] }}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "8px 16px",
                    background: "transparent",
                    color: statusBanner.kind === "en_route" ? "#007aff" : "#9a6700",
                    fontSize: 13, fontWeight: 500, letterSpacing: -0.08,
                    borderBottom: "0.5px solid #c6c6c8",
                  }}
                >
                  {statusBanner.kind === "en_route" ? (
                    <Send style={{ width: 14, height: 14 }} strokeWidth={1.8} />
                  ) : (
                    <Clock style={{ width: 14, height: 14 }} strokeWidth={1.8} />
                  )}
                  <span>
                    {statusBanner.kind === "en_route"
                      ? `On the way${statusBanner.etaText ? ` · ETA ${statusBanner.etaText}` : ""}`
                      : `Running late${statusBanner.delayMinutes ? ` · +${statusBanner.delayMinutes} min` : ""}${statusBanner.etaText ? ` · New ETA ${statusBanner.etaText}` : ""}`}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── 7. FOUR-ITEM STATUS STRIP — Prep / On the way / Running late / Here ── */}
            {(() => {
              const rawNorm = (lessonStatus || "").toLowerCase();
              const norm = localStatus
                ? (localStatus === "en_route" ? "en_route" : "late")
                : rawNorm;
              const segments = [
                { id: "prep", label: "Prep", icon: ClipboardList,
                  active: norm === "prep" || norm === "preparing",
                  onClick: () => navigate(`/instructor/pupils/${pupilId}?tab=progress`) },
                { id: "on_the_way", label: "On the way", icon: Send,
                  active: norm === "en_route" || norm === "on_the_way",
                  onClick: () => handleSendETA() },
                { id: "late", label: "Running late", icon: Clock,
                  active: norm === "late" || norm === "running_late",
                  onClick: () => setLateSheetOpen(true) },
                { id: "here", label: "Here", icon: MapPin,
                  active: norm === "arrived" || norm === "here",
                  onClick: () => handleArrived() },
              ];
              return (
                <div style={{
                  display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
                  background: "#f9f9f9",
                }}>
                  {segments.map((s, i) => {
                    const Icon = s.icon;
                    const tint = s.active ? "#007aff" : "#6e6e73";
                    return (
                      <React.Fragment key={s.id}>
                        <button
                          onClick={(e) => { e.stopPropagation(); s.onClick?.(); }}
                          className="active:opacity-60"
                          style={{
                            background: "transparent", border: "none", cursor: "pointer",
                            padding: "12px 4px",
                            display: "inline-flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5,
                            position: "relative",
                          }}
                          aria-label={s.label} aria-pressed={s.active}
                        >
                          <Icon style={{ width: 18, height: 18, color: tint }} strokeWidth={1.6} />
                          <span style={{
                            fontSize: 11, fontWeight: 400, color: tint, letterSpacing: -0.05,
                            lineHeight: 1.2, textAlign: "center",
                          }}>{s.label}</span>
                          {i < segments.length - 1 && (
                            <span aria-hidden style={{
                              position: "absolute", right: 0, top: 8, bottom: 8,
                              width: 0.5, background: "#c6c6c8",
                            }} />
                          )}
                        </button>
                      </React.Fragment>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* (Primary CTA is rendered inside the hero card above) */}

          {/* ── MAP PREVIEW (only when within 4h) ── */}
          {isWithin4h && pickupPostcode && (
            <div
              style={{
                position: "relative",
                borderRadius: 14,
                overflow: "hidden",
                height: 140,
                background: "#F2F2F7",
              }}
            >
              <GoogleMapPreview postcode={pickupPostcode} address={pickupLocation} height={140} />
            </div>
          )}

          {/* ── TRAVEL-TIME BAR (only when within 30 min and ETA known) — kept for late-detection / Send ETA action ── */}
          {isImminent && etaMinutes > 0 && (
            <div
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "12px 14px",
                background: travelBarBg,
                borderRadius: 12,
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

          {/* ── SMART PROMPTS — real-time assistant strip ──
              Sits directly under the main lesson card, before secondary
              details. Shows up to 2 prioritised, contextual prompts.
              Renders nothing when there's nothing important to say. */}
          <SmartPromptsStrip prompts={smartPrompts} />

          {/* ── BALANCE NOTICE (preserved) ── */}
          {effectiveBalance < 0 && (
            <div>
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

          {/* ── SECTION 1 — Lesson details (elevated card) ── */}
          <div>
            <div style={{
              fontSize: a11yPx(11), fontWeight: 600, color: "#6E6E73",
              letterSpacing: 0.4, textTransform: "uppercase", margin: "0 4px 10px",
            }}>
              Lesson details
            </div>
            <div style={{
              background: "#FFFFFF", borderRadius: 12, padding: 4,
              boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 4px 14px -4px rgba(16,24,40,0.06)",
              display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            }}>
              {[
                { icon: Clock, label: "Duration", value: formatDuration() },
                { icon: PoundSterling, label: "Lesson fee", value: `£${expectedEarnings.toFixed(0)}` },
              ].map((stat, i) => (
                <div key={stat.label} style={{
                  padding: 14,
                  borderLeft: i === 1 ? "0.5px solid #E5E5EA" : "none",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <stat.icon style={{ width: 12, height: 12, color: "#6E6E73" }} strokeWidth={2} />
                    <span style={{
                      fontSize: a11yPx(10), color: "#6E6E73", letterSpacing: 0.2,
                    }}>{stat.label}</span>
                  </div>
                  <div style={{
                    fontSize: a11yPx(18), fontWeight: 600, color: "#000000",
                    letterSpacing: -0.3, margin: 0,
                  }}>{stat.value}</div>
                </div>
              ))}
            </div>

            {/* View full pupil profile */}
            {pupilId && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); navigate(`/instructor/pupils/${pupilId}`); }}
                style={{
                  marginTop: 8,
                  width: "100%",
                  background: "#FFFFFF",
                  border: "none",
                  borderRadius: 14,
                  padding: "12px 14px",
                  display: "flex", alignItems: "center", gap: 10,
                  boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 4px 14px -4px rgba(16,24,40,0.06)",
                  cursor: "pointer", textAlign: "left",
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: "rgba(43,123,200,0.10)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Eye style={{ width: 14, height: 14, color: "#2B7BC8" }} strokeWidth={2} />
                </div>
                <span style={{
                  flex: 1, fontSize: a11yPx(13), fontWeight: 500, color: "#000000",
                  letterSpacing: -0.1,
                }}>
                  View {firstName}'s full profile
                </span>
                <ChevronRight style={{ width: 16, height: 16, color: "#8E8E93" }} strokeWidth={2} />
              </button>
            )}
          </div>

                {/* ── SECTION 2 — Conditions (elevated card) ── */}
                {(etaMinutes > 0 || currentWeather || primaryDevice) && (
                  <div>
                    <div style={{
                      fontSize: a11yPx(11), fontWeight: 600, color: "#6E6E73",
                      letterSpacing: 0.4, textTransform: "uppercase", margin: "0 4px 10px",
                    }}>
                      Conditions
                    </div>
                    <div style={{
                      background: "#FFFFFF", borderRadius: 12,
                      boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 4px 14px -4px rgba(16,24,40,0.06)",
                      overflow: "hidden",
                    }}>
                      {/* Drive row — derives severity from HERE traffic + late detection,
                          NOT the unrelated drivingAlerts feed. */}
                      {(etaLoading || etaMinutes > 0) && (
                        <button
                          type="button"
                          disabled={!hasTrafficAlerts}
                          onClick={(e) => { e.stopPropagation(); if (hasTrafficAlerts) setTrafficModalOpen(true); }}
                          style={{
                            width: "100%", padding: 12,
                            borderBottom: (currentWeather || primaryDevice) ? "0.5px solid #E5E5EA" : "none",
                            display: "flex", alignItems: "center", gap: 12,
                            background: "transparent", border: "none", textAlign: "left",
                            cursor: hasTrafficAlerts ? "pointer" : "default",
                          }}
                        >
                          {(() => {
                            const driveSeverity: "normal" | "amber" | "red" =
                              isRunningLate ? "red" : trafficHeavy ? "amber" : "normal";
                            const driveBg = driveSeverity === "red" ? "#FBEAEC"
                              : driveSeverity === "amber" ? "#FBF1DE" : "#E6F1FB";
                            const driveStroke = driveSeverity === "red" ? "#C8434F"
                              : driveSeverity === "amber" ? "#B8801F" : "#2B7BC8";
                            const distancePart = etaText && /·/.test(etaText)
                              ? etaText.split("·").slice(-1)[0].trim() : null;
                            return (
                              <>
                                <div style={{
                                  width: 32, height: 32, borderRadius: 8, background: driveBg,
                                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                }}>
                                  <Car style={{ width: 16, height: 16, color: driveStroke }} strokeWidth={2} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 1 }}>
                                    <span style={{ fontSize: a11yPx(13), fontWeight: 500, color: "#000000" }}>
                                      {etaLoading ? "Calculating drive…"
                                        : `${etaMinutes} min drive${distancePart ? ` · ${distancePart}` : ""}`}
                                    </span>
                                    {driveSeverity !== "normal" && !etaLoading && (
                                      <span style={{
                                        background: driveSeverity === "red" ? "#FBEAEC" : "#FBF1DE",
                                        color: driveSeverity === "red" ? "#C8434F" : "#B8801F",
                                        fontSize: a11yPx(9), fontWeight: 500, letterSpacing: 0.3,
                                        padding: "2px 5px", borderRadius: 3, textTransform: "uppercase",
                                      }}>
                                        {driveSeverity === "red"
                                          ? `Late by ${lateByMinutes}m`
                                          : "Heavy traffic"}
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ fontSize: a11yPx(11), color: "#6E6E73" }}>
                                    {etaLoading ? "Checking current traffic"
                                      : isRunningLate
                                        ? `Even leaving now, will arrive at ${arrivalTimeText} (${lateByMinutes} min late)`
                                        : trafficHeavy
                                          ? `Heavier than usual${leaveByText ? ` — leave by ${leaveByText} to be on time` : ""}`
                                          : leaveByText
                                            ? `Traffic looks normal — leave by ${leaveByText} to be on time`
                                            : `Traffic looks normal at current conditions`}
                                  </div>
                                </div>
                                {hasTrafficAlerts && (
                                  <ChevronRight style={{ width: 14, height: 14, color: "#6E6E73", flexShrink: 0 }} />
                                )}
                              </>
                            );
                          })()}
                        </button>
                      )}

                      {/* Weather row */}
                      {currentWeather && currentWeather.temperature != null && (() => {
                        const tip = getWeatherSafetyTip();
                        const poor = !!tip;
                        return (
                          <div style={{
                            padding: 12,
                            borderBottom: primaryDevice ? "0.5px solid #E5E5EA" : "none",
                            display: "flex", alignItems: "center", gap: 12,
                          }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: 8,
                              background: poor ? "#FBF1DE" : "#E6F1FB",
                              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                            }}>
                              <Thermometer style={{
                                width: 16, height: 16,
                                color: poor ? "#B8801F" : "#2B7BC8",
                              }} strokeWidth={2} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: a11yPx(13), fontWeight: 500, color: "#000000", margin: "0 0 1px" }}>
                                {currentWeather.temperature}°C{currentWeather.description ? ` · ${currentWeather.description}` : ""}
                              </div>
                              <div style={{ fontSize: a11yPx(11), color: "#6E6E73" }}>
                                {tip ? tip.tip : "No weather concerns at lesson time"}
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Vehicle row */}
                      {primaryDevice && (() => {
                        const connected = primaryDevice.is_connected;
                        const deviceLabel = (() => {
                          const t = (primaryDevice as any).device_type?.toLowerCase?.() || "";
                          if (t.includes("obd")) return "Vehicle data linked";
                          if (t.includes("bluetooth")) return "Bluetooth connected";
                          if (t.includes("eco")) return "ECO Driving connected";
                          if (t.includes("telematics") || t.includes("black")) return "Telematics connected";
                          return "Vehicle data linked";
                        })();
                        const lastSync = (primaryDevice as any).last_seen_at || (primaryDevice as any).updated_at;
                        const lastSyncText = lastSync
                          ? (() => { try { return `Last sync ${format(new Date(lastSync), "HH:mm")}`; } catch { return "Last sync recently"; } })()
                          : "Last sync recently";
                        return (
                          <div style={{
                            padding: 12,
                            display: "flex", alignItems: "center", gap: 12,
                          }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: 8,
                              background: connected ? "#E8F3E8" : "#F2F2F4",
                              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                            }}>
                              <Car style={{
                                width: 16, height: 16,
                                color: connected ? "#3B8B3B" : "#6E6E73",
                              }} strokeWidth={2} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: a11yPx(13), fontWeight: 500, color: "#000000", margin: "0 0 1px" }}>
                                {connected ? deviceLabel : "Vehicle offline"}
                              </div>
                              <div style={{ fontSize: a11yPx(11), color: "#6E6E73" }}>
                                {connected
                                  ? `${lastSyncText} · ready to track`
                                  : "Reconnect in Settings"}
                              </div>
                            </div>
                            <span style={{
                              flexShrink: 0,
                              background: connected ? "#E8F3E8" : "#F2F2F4",
                              color: connected ? "#3B8B3B" : "#6E6E73",
                              fontSize: a11yPx(9), fontWeight: 500, letterSpacing: 0.3,
                              padding: "3px 7px", borderRadius: 999, textTransform: "uppercase",
                            }}>
                              {connected ? "Online" : "Offline"}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* ── SECTION A — Lesson context (grouped: Last lesson + CTA + payment + unread) ── */}
                <div>
                  <div style={{
                    fontSize: a11yPx(11), fontWeight: 600, color: "#6E6E73",
                    letterSpacing: 0.4, textTransform: "uppercase", margin: "0 4px 10px",
                  }}>
                    Lesson
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {/* Last lesson card (elevated) */}
                    <div style={{
                      background: "#FFFFFF", borderRadius: 12, padding: 16,
                      boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 4px 14px -4px rgba(16,24,40,0.06)",
                    }}>
                      {lastLesson ? (
                        (() => {
                          const dateStr = (() => {
                            try {
                              const d = parseISO(lastLesson.lesson_date as string);
                              const rel = formatDistanceToNowStrict(d, { addSuffix: true });
                              return `${rel} · ${format(d, "EEE d MMM")}`;
                            } catch { return String(lastLesson.lesson_date); }
                          })();
                          const skills: string[] = Array.isArray((lastLesson as any).skills_practiced)
                            ? (lastLesson as any).skills_practiced.filter(Boolean)
                            : [];
                          const note: string | null = (lastLesson as any).notes || null;
                          const rating: number | null = (lastLesson as any).rating || null;
                          return (
                            <>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                <div style={{
                                  width: 32, height: 32, borderRadius: 8, background: "#F1ECFA",
                                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                }}>
                                  <BookOpen style={{ width: 16, height: 16, color: "#8A5BC9" }} strokeWidth={2} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: a11yPx(11), fontWeight: 500, color: "#6E6E73", letterSpacing: 0.3, textTransform: "uppercase", marginBottom: 1 }}>
                                    Last lesson
                                  </div>
                                  <div style={{ fontSize: a11yPx(13), fontWeight: 500, color: "#000000" }}>
                                    {dateStr}
                                  </div>
                                  {rating != null && rating > 0 && (
                                    <div style={{ fontSize: a11yPx(11), color: "#6E6E73", marginTop: 1 }}>
                                      Rating: {"★".repeat(rating)}{"☆".repeat(Math.max(0, 5 - rating))}
                                    </div>
                                  )}
                                </div>
                              </div>
                              {skills.length > 0 && (
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: note ? 10 : 0 }}>
                                  {skills.slice(0, 6).map((s, i) => (
                                    <span key={i} style={{
                                      fontSize: a11yPx(11), color: "#5856D6",
                                      background: "rgba(88,86,214,0.10)",
                                      padding: "3px 8px", borderRadius: 999,
                                    }}>{s}</span>
                                  ))}
                                  {skills.length > 6 && (
                                    <span style={{ fontSize: a11yPx(11), color: "#6E6E73", padding: "3px 4px" }}>
                                      +{skills.length - 6} more
                                    </span>
                                  )}
                                </div>
                              )}
                              {note && (
                                <div style={{
                                  fontSize: a11yPx(12), color: "#3C3C43", lineHeight: 1.45,
                                  display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
                                  overflow: "hidden",
                                }}>
                                  {note}
                                </div>
                              )}
                              {!skills.length && !note && (
                                <div style={{ fontSize: a11yPx(12), color: "#6E6E73" }}>
                                  No notes recorded for the last lesson.
                                </div>
                              )}
                            </>
                          );
                        })()
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: 8, background: "#F2F2F7",
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                          }}>
                            <BookOpen style={{ width: 16, height: 16, color: "#8E8E93" }} strokeWidth={2} />
                          </div>
                          <div style={{ fontSize: a11yPx(12), color: "#6E6E73" }}>
                            No previous lessons yet
                          </div>
                        </div>
                      )}

                    </div>

                    {/* Lesson plan card (elevated) */}
                    {lastLessonPlan && (
                      <div style={{
                        display: "flex", alignItems: "flex-start", gap: 12,
                        padding: 14, borderRadius: 12, background: "#FFFFFF",
                        boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 4px 14px -4px rgba(16,24,40,0.06)",
                      }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8, background: "#F1ECFA",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                          <BookOpen style={{ width: 16, height: 16, color: "#8A5BC9" }} strokeWidth={2} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: a11yPx(10), fontWeight: 500, color: "#6E6E73",
                            letterSpacing: 0.3, textTransform: "uppercase", marginBottom: 2,
                          }}>Lesson plan</div>
                          <p style={{
                            fontSize: a11yPx(12), color: "#000000", margin: 0,
                            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                          }}>{lastLessonPlan}</p>
                        </div>
                      </div>
                    )}

                    {/* Payment card (elevated) */}
                    {noBalance && (
                      <div style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: 14, borderRadius: 12,
                        background: "#FFFFFF",
                        boxShadow: paymentDue
                          ? "0 1px 2px rgba(16,24,40,0.04), 0 4px 14px -4px rgba(239,68,68,0.18)"
                          : "0 1px 2px rgba(16,24,40,0.04), 0 4px 14px -4px rgba(16,24,40,0.06)",
                      }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: paymentDue ? "rgba(239,68,68,0.12)" : "rgba(251,191,36,0.12)",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                          <Banknote style={{ width: 16, height: 16, color: paymentDue ? "#dc2626" : "#d97706" }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: a11yPx(13), fontWeight: 500, color: "#000000", margin: 0 }}>
                            {paymentDue ? `£${Math.abs(effectiveBalance).toFixed(0)} payment due` : "No balance remaining"}
                          </p>
                          <p style={{ fontSize: a11yPx(11), color: "#6E6E73", margin: "1px 0 0" }}>Collect before or after lesson</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/instructor/take-payment?pupil=${pupilId}`); }}
                          style={{
                            flexShrink: 0, padding: "8px 12px", borderRadius: 8,
                            background: paymentDue ? "#ef4444" : "#d97706",
                            color: "#FFFFFF", fontSize: a11yPx(11), fontWeight: 600,
                            border: "none", cursor: "pointer",
                          }}>
                          Collect
                        </button>
                      </div>
                    )}

                    {/* Unread cards (elevated) */}
                    {hasUnread && (
                      <button onClick={(e) => { e.stopPropagation(); navigate(`/instructor/messages`); }}
                        style={{
                          width: "100%",
                          display: "flex", alignItems: "center", gap: 12,
                          padding: 14, borderRadius: 12, background: "#FFFFFF",
                          boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 4px 14px -4px rgba(16,24,40,0.06)",
                          border: "none", textAlign: "left", cursor: "pointer",
                        }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8, background: "rgba(249,115,22,0.12)",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                          <MessageCircle style={{ width: 16, height: 16, color: "#f97316" }} />
                        </div>
                        <span style={{ fontSize: a11yPx(13), fontWeight: 500, color: "#000000", flex: 1 }}>
                          {pupilUnreadCount} unread from {firstName}
                        </span>
                        <ChevronRight style={{ width: 14, height: 14, color: "#6E6E73" }} />
                      </button>
                    )}

                    {adminUnreadCount > 0 && (
                      <button onClick={(e) => { e.stopPropagation(); navigate(`/instructor-app/admin-chat`); }}
                        style={{
                          width: "100%",
                          display: "flex", alignItems: "center", gap: 12,
                          padding: 14, borderRadius: 12, background: "#FFFFFF",
                          boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 4px 14px -4px rgba(16,24,40,0.06)",
                          border: "none", textAlign: "left", cursor: "pointer",
                        }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8, background: "rgba(249,115,22,0.12)",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                          <Mail style={{ width: 16, height: 16, color: "#f97316" }} />
                        </div>
                        <span style={{ fontSize: a11yPx(13), fontWeight: 500, color: "#000000", flex: 1 }}>
                          {adminUnreadCount} admin note{adminUnreadCount !== 1 ? "s" : ""} about {firstName}
                        </span>
                        <ChevronRight style={{ width: 14, height: 14, color: "#6E6E73" }} />
                      </button>
                    )}
                  </div>
                </div>

                {/* ── SECTION 5 — Reschedule + Cancel (secondary/destructive) ── */}
                <div style={{
                  marginTop: 12,
                  borderTop: "0.5px solid #E5E5EA", paddingTop: 14,
                  display: "flex", alignItems: "stretch", justifyContent: "space-between",
                }}>
                  <button onClick={(e) => { e.stopPropagation(); setRescheduleOpen(true); }}
                    className="active:opacity-60"
                    style={{
                      flex: 1, background: "transparent", border: "none",
                      padding: "10px 4px", cursor: "pointer",
                      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                      minHeight: 44,
                    }}>
                    <Calendar style={{ width: 16, height: 16, color: "#3C3C43" }} strokeWidth={2.2} />
                    <span style={{ fontSize: a11yPx(14), fontWeight: 600, color: "#1C1C1E", letterSpacing: -0.1 }}>
                      Reschedule
                    </span>
                  </button>
                  <div style={{ width: 0.5, background: "#E5E5EA", margin: "4px 0" }} />
                  <button onClick={(e) => { e.stopPropagation(); setCancelOpen(true); }}
                    className="active:opacity-60"
                    style={{
                      flex: 1, background: "transparent", border: "none",
                      padding: "10px 4px", cursor: "pointer",
                      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                      minHeight: 44,
                    }}>
                    <X style={{ width: 16, height: 16, color: "#E15D5A" }} strokeWidth={2.4} />
                    <span style={{ fontSize: a11yPx(14), fontWeight: 600, color: "#E15D5A", letterSpacing: -0.1 }}>
                      Cancel lesson
                    </span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
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
          currentBalance={accountBalance} onCompleted={() => {
            toast.success("Lesson ended", { description: pupilName ? `${pupilName}'s lesson saved` : "Lesson saved" });
            handleCancelled();
          }} />
      )}
      <RunningLateSheet
        open={lateSheetOpen}
        onOpenChange={setLateSheetOpen}
        pupilName={pupilName}
        pupilPhone={pupilPhone}
        startTime={startTime}
        etaMinutes={etaMinutes}
        onMarkOnWay={(etaText) => {
          // Persist server status; ignore failure (UI already optimistic)
          supabase.from("scheduled_lessons").update({ status: "en_route" }).eq("id", lessonId).then(() => {});
          supabase.functions.invoke("notify-pupil", { body: { pupilId, type: "en_route" } }).catch(() => {});
          setLocalStatus("en_route");
          setStatusBanner({ kind: "en_route", etaText, delayMinutes: null });
          queryClient.invalidateQueries({ queryKey: ["next-lesson-details"] });
          queryClient.invalidateQueries({ queryKey: ["today-remaining-lessons"] });
        }}
        onMarkRunningLate={(delayMinutes, newEtaText) => {
          supabase.from("scheduled_lessons").update({ status: "late" }).eq("id", lessonId).then(() => {});
          setLocalStatus("late");
          setStatusBanner({ kind: "late", etaText: newEtaText, delayMinutes });
          queryClient.invalidateQueries({ queryKey: ["next-lesson-details"] });
          queryClient.invalidateQueries({ queryKey: ["today-remaining-lessons"] });
        }}
      />

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
