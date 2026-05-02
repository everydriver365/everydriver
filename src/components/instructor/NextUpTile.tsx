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
}: NextUpTileProps) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
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

      <div style={{ fontFamily: iosFont, WebkitFontSmoothing: "antialiased" }}>
        {/* ── Card — matches other home widgets (white, rounded-[20px], soft shadow) ── */}
        <div
          className="bg-white rounded-[20px] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_28px_-12px_rgba(16,24,40,0.08)]"
          style={{
            overflow: "hidden",
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 14,
            position: "relative",
            width: "100%",
          }}
        >
          {/* ── Header (whole row tappable to expand) ── */}
          <div style={{ position: "relative" }}>

            {/* UP NEXT label — hidden when expanded (the expanded hero shows its own pill) */}
            {!expanded && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <span style={{ fontSize: a11yPx(11), fontWeight: 600, color: "#5856D6", letterSpacing: 0.6, textTransform: "uppercase" }}>Up next</span>
                {checkInStatus && (
                  <LessonCheckInBadge status={checkInStatus} className="text-[10px] py-0 px-1.5 h-5 ml-1" />
                )}
              </div>
            )}

            <button
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
              aria-label={expanded ? "Hide lesson details" : "Show lesson details"}
              className="active:opacity-80"
              style={{
                width: "100%", padding: 0, display: "flex", alignItems: "stretch", gap: 12,
                background: "transparent", border: "none", cursor: "pointer", textAlign: "left",
                transition: "opacity 150ms cubic-bezier(0.2,0.7,0.2,1)",
              }}
            >
              {expanded ? (
                /* Slim toggle strip when expanded — avoids duplicating pupil/time/countdown shown in the hero card below */
                <div style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "2px 0",
                }}>
                  <span style={{ fontSize: a11yPx(11), fontWeight: 600, color: "#5856D6", letterSpacing: 0.6, textTransform: "uppercase" }}>
                    Up next · tap to hide
                  </span>
                  <ChevronDown
                    aria-hidden
                    style={{
                      width: 16, height: 16, color: "#6E6E73",
                      transform: "rotate(180deg)",
                      transition: "transform 250ms cubic-bezier(0.2,0.7,0.2,1)",
                    }}
                    strokeWidth={1.8}
                  />
                </div>
              ) : (
                <>
              {/* LEFT: avatar + identity */}
              <div style={{ flex: 1, minWidth: 0, display: "flex", gap: 12, alignItems: "flex-start" }}>
                {/* Avatar */}
                <div style={{ flexShrink: 0 }}>
                  {pupilProfileImage ? (
                    <img
                      src={pupilProfileImage}
                      alt={pupilName}
                      style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", display: "block" }}
                    />
                  ) : (
                    <div style={{
                      width: 44, height: 44, borderRadius: "50%",
                      background: "linear-gradient(135deg, #5856D6 0%, #007AFF 100%)",
                      color: "#fff", fontSize: a11yPx(15), fontWeight: 600,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      letterSpacing: 0.2,
                    }}>
                      {getInitials(pupilName)}
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: a11yPx(17), fontWeight: 600, letterSpacing: -0.3, color: "#000000", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
                  <div style={{ fontSize: a11yPx(12), color: "#6E6E73", marginTop: 3 }}>
                    {`Standard lesson · ${formatHoursLong(durationMinutes)}`}
                  </div>
                  {(pickupPostcode || pickupLocation) && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, color: "#6E6E73", minWidth: 0 }}>
                      <MapPin style={{ width: 11, height: 11, flexShrink: 0 }} strokeWidth={2} />
                      <span style={{ fontSize: a11yPx(11), overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {pickupPostcode || pickupLocation}
                      </span>
                    </div>
                  )}
                  {/* Countdown pill */}
                  <div style={{ marginTop: 8 }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      padding: "3px 8px", borderRadius: 999,
                      background: minutesUntil <= 5 ? "rgba(255,59,48,0.12)" : minutesUntil <= 15 ? "rgba(255,149,0,0.12)" : "rgba(88,86,214,0.10)",
                      color: minutesUntil <= 5 ? "#FF3B30" : minutesUntil <= 15 ? "#FF9500" : "#5856D6",
                      fontSize: a11yPx(11), fontWeight: 600, letterSpacing: 0.1,
                      fontVariantNumeric: "tabular-nums",
                    }}>
                      <Clock style={{ width: 11, height: 11 }} strokeWidth={2.2} />
                      {minutesUntil <= 0 ? "Starting now" : `Starts in ${getCountdownText()}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Vertical divider */}
              <div aria-hidden style={{ width: 1, background: "#E5E5EA", alignSelf: "stretch", margin: "0 2px" }} />

              {/* RIGHT: time + actions */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "space-between", gap: 10, flexShrink: 0, minWidth: 96 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: a11yPx(26), fontWeight: 600, letterSpacing: -0.8, color: "#000000", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                    {formatTime24(startTime)}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, fontSize: a11yPx(11), fontWeight: 500, color: "#6E6E73", marginTop: 4 }}>
                    <span>{formatMetaDate(lessonDate)}</span>
                    <ChevronDown
                      aria-hidden
                      style={{
                        width: 14, height: 14, color: "#6E6E73",
                        transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 250ms cubic-bezier(0.2,0.7,0.2,1)",
                      }}
                      strokeWidth={1.8}
                    />
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", gap: 6 }}>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); handleCall(); }}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); handleCall(); } }}
                    aria-label="Call pupil"
                    style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      width: 34, height: 34, borderRadius: 999,
                      background: "rgba(52,199,89,0.12)", color: "#34C759",
                      cursor: "pointer",
                    }}
                  >
                    <Phone style={{ width: 15, height: 15 }} strokeWidth={2.2} />
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); handleNavigate(); }}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); handleNavigate(); } }}
                    aria-label="Navigate to pickup"
                    style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      width: 34, height: 34, borderRadius: 999,
                      background: "rgba(0,122,255,0.12)", color: "#007AFF",
                      cursor: "pointer",
                    }}
                  >
                    <Navigation style={{ width: 15, height: 15 }} strokeWidth={2.2} />
                  </span>
                </div>
              </div>
                </>
              )}
            </button>
          </div>

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
            style={{ marginLeft: 0, marginRight: 0, marginBottom: -16, marginTop: 4 }}
          >
          <div style={{ padding: "20px 0 20px", display: "flex", flexDirection: "column", gap: 24, borderTop: "0.5px solid #E5E5EA", background: "transparent" }}>

          {/* ── HERO + PRIMARY ACTIONS card (elevated) ── */}
          <div style={{
            background: "#FFFFFF", borderRadius: 18, padding: 18,
            boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 4px 14px -4px rgba(16,24,40,0.06)",
            display: "flex", flexDirection: "column", gap: 18,
          }}>
            {/* UP NEXT label — small, soft blue, tight to top */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <span style={{
                fontSize: a11yPx(10), fontWeight: 600, color: "#7AA7E8",
                letterSpacing: 0.8, textTransform: "uppercase",
              }}>
                Up next
              </span>
              {(() => {
                const isPending = !checkInStatus || checkInStatus === "pending";
                const canNudge = isPending && !!pupilPhone;
                if (nudgeSentAt) {
                  return (
                    <span
                      aria-label="Reminder sent"
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        background: "#E8F5EE", color: "#1F7A3F",
                        borderRadius: 999, padding: "3px 8px",
                        fontSize: 10, fontWeight: 600, letterSpacing: 0.1,
                      }}
                    >
                      <CheckCircle2 style={{ width: 11, height: 11, strokeWidth: 2.4 }} />
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
                      className="active:scale-95"
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        background: "#FFF4E0", color: "#A8731A",
                        border: "none", borderRadius: 999, padding: "3px 8px",
                        fontSize: 10, fontWeight: 600, letterSpacing: 0.1,
                        cursor: "pointer",
                        transition: "transform 120ms cubic-bezier(0.2,0.7,0.2,1)",
                      }}
                    >
                      <Clock style={{ width: 11, height: 11, strokeWidth: 2.4 }} />
                      Awaiting · Tap to nudge
                    </button>
                  );
                }
                if (checkInStatus) {
                  return (
                    <LessonCheckInBadge status={checkInStatus} className="text-[10px] py-0 px-1.5 h-5" />
                  );
                }
                // pending without phone — show plain Awaiting badge
                return (
                  <LessonCheckInBadge status="pending" className="text-[10px] py-0 px-1.5 h-5" />
                );
              })()}
            </div>

            {/* Header row: pupil name (left) | time + date (right) */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{
                  fontSize: a11yPx(20), fontWeight: 600, color: "#000000",
                  letterSpacing: -0.4, lineHeight: 1.15,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {toSentenceName(pupilName)}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{
                  fontSize: a11yPx(22), fontWeight: 600, letterSpacing: -0.6,
                  color: "#000000", lineHeight: 1, fontVariantNumeric: "tabular-nums",
                }}>
                  {formatTime24(startTime)}
                </div>
                <div style={{ fontSize: a11yPx(12), color: "#8A8A8E", marginTop: 4 }}>
                  {getDateLabel()}
                </div>
              </div>
            </div>

            {/* Secondary info: lesson type · duration, then location */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: a11yPx(13), color: "#3C3C43", letterSpacing: -0.05 }}>
                {`Standard lesson · ${formatHoursLong(durationMinutes)}`}
              </div>
              {(pickupLocation || pickupPostcode) && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#8A8A8E", minWidth: 0 }}>
                  <MapPin style={{ width: 13, height: 13, flexShrink: 0 }} strokeWidth={2} />
                  <span style={{ fontSize: a11yPx(13), overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {formattedPickupAddress || pickupPostcode || pickupLocation}
                  </span>
                </div>
              )}
              {/* Tertiary: countdown as plain muted text */}
              <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#8A8A8E" }}>
                <Clock style={{ width: 12, height: 12 }} strokeWidth={2 } />
                <span style={{ fontSize: a11yPx(13), fontVariantNumeric: "tabular-nums" }}>
                  {minutesUntil <= 0 ? "Starting now" : `Starts in ${getCountdownText()}`}
                </span>
              </div>
            </div>

            {/* ── STATE-BASED ACTION SYSTEM ──
              EARLY     (>60 min) : no primary CTA, no quick row (mini call/navigate already shown top-right)
              MID       (15–60 min): no primary CTA, full quick action row (Navigate/Call/Message/Arrived)
              STARTING  (0–15 min) : full-width Start lesson, no quick row
              IN_LESSON           : full-width End lesson, no quick row
              All handlers (handleCall/handleMessage/handleNavigate/handleArrived/start/end) preserved.
            */}
            {(() => {
              // Single source of truth for action visibility — also unit-tested
              // via src/components/instructor/__tests__/nextUpTileState.test.ts
              const vis = getNextUpVisibility(minutesUntil, lessonStatus);
              const inLesson = vis.showEndLessonButton;
              const isStartingNow = vis.showStartLessonButton;
              const isMid = vis.showQuickActionRow;
              const isEarly = vis.state === "early";

              if (inLesson) {
                return (
                  <button
                    onClick={(e) => { e.stopPropagation(); setWizardOpen(true); }}
                    className="active:opacity-90"
                    style={{
                      width: "100%",
                      background: "#FF3B30", color: "#FFFFFF",
                      border: "none", borderRadius: 14, padding: "16px 16px",
                      fontSize: a11yPx(17), fontWeight: 600, letterSpacing: -0.2,
                      cursor: "pointer",
                      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                      boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 6px 16px -6px rgba(255,59,48,0.35)",
                    }}
                  >
                    <CheckCircle2 style={{ width: 18, height: 18 }} strokeWidth={2.4} />
                    End lesson
                  </button>
                );
              }

              if (isStartingNow) {
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
                      navigate(`/instructor/tracking?pupilId=${pupilId}&lessonId=${lessonId}&autoStart=1`);
                    }}
                    className="active:opacity-90"
                    style={{
                      width: "100%",
                      background: "#1B5BFF", color: "#FFFFFF",
                      border: "none", borderRadius: 14, padding: "16px 16px",
                      fontSize: a11yPx(17), fontWeight: 600, letterSpacing: -0.2,
                      cursor: "pointer",
                      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10,
                      boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 6px 16px -6px rgba(27,91,255,0.35)",
                    }}
                  >
                    <Play style={{ width: 18, height: 18 }} strokeWidth={2.4} fill="#FFFFFF" />
                    Start lesson
                  </button>
                );
              }

              if (isMid) {
                // Subtle quick action row — secondary, not primary
                return (
                  <div style={{ display: "flex", alignItems: "stretch", gap: 0 }}>
                    {[
                      { label: "Navigate", icon: Navigation, color: "#1B5BFF", onClick: handleNavigate },
                      { label: "Call", icon: Phone, color: "#34C759", onClick: handleCall },
                      { label: "Message", icon: MessageSquare, color: "#FF9500", onClick: handleMessage },
                      { label: "Arrived", icon: MapPin, color: "#FF3B30", onClick: handleArrived },
                    ].map((a, i, arr) => (
                      <React.Fragment key={a.label}>
                        <button
                          onClick={(e) => { e.stopPropagation(); a.onClick(); }}
                          className="active:opacity-60"
                          style={{
                            flex: 1, background: "transparent", border: "none", cursor: "pointer",
                            padding: "8px 4px",
                            display: "inline-flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
                          }}
                          aria-label={a.label}
                        >
                          <a.icon style={{ width: 22, height: 22, color: a.color }} strokeWidth={2.1} />
                          <span style={{ fontSize: a11yPx(12), fontWeight: 500, color: "#1C1C1E", letterSpacing: -0.05 }}>
                            {a.label}
                          </span>
                        </button>
                        {i < arr.length - 1 && (
                          <div style={{ width: 0.5, background: "#E5E5EA", margin: "8px 0" }} />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                );
              }

              // EARLY state: unified control system — primary action row + segmented status,
              // sits directly under the pupil address in the hero card.
              void isEarly;
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {/* Primary action row — Navigate / Call / Text */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
                    <button onClick={(e) => { e.stopPropagation(); handleNavigate(); }}
                      className="active:scale-[0.98]"
                      style={{
                        background: "#1B5BFF", color: "#FFFFFF",
                        border: "none", borderRadius: 16, height: 50,
                        cursor: "pointer", transition: "transform 0.15s ease, opacity 0.15s ease",
                        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                        boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 8px 18px -8px rgba(27,91,255,0.4)",
                      }}
                      aria-label="Navigate to pickup"
                    >
                      <Navigation style={{ width: 16, height: 16 }} strokeWidth={2.4} />
                      <span style={{ fontSize: a11yPx(14), fontWeight: 600, letterSpacing: -0.1 }}>Nav</span>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleCall(); }}
                      className="active:scale-[0.98]"
                      style={{
                        background: "rgba(52,199,89,0.12)", color: "#1C7A3E",
                        border: "none", borderRadius: 16, height: 50,
                        cursor: "pointer", transition: "transform 0.15s ease, opacity 0.15s ease",
                        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                      }}
                      aria-label="Call pupil"
                    >
                      <Phone style={{ width: 16, height: 16, color: "#1C7A3E" }} strokeWidth={2.3} />
                      <span style={{ fontSize: a11yPx(14), fontWeight: 600, letterSpacing: -0.1 }}>Call</span>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleMessage(); }}
                      className="active:scale-[0.98]"
                      style={{
                        background: "rgba(43,123,200,0.12)", color: "#1F5C99",
                        border: "none", borderRadius: 16, height: 50,
                        cursor: "pointer", transition: "transform 0.15s ease, opacity 0.15s ease",
                        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                      }}
                      aria-label="Text pupil"
                    >
                      <MessageSquare style={{ width: 16, height: 16, color: "#1F5C99" }} strokeWidth={2.3} />
                      <span style={{ fontSize: a11yPx(14), fontWeight: 600, letterSpacing: -0.1 }}>Text</span>
                    </button>
                  </div>

                  {/* Inline status banner — appears immediately after the user
                      sends an ETA / late update from the bottom sheet. Subtle,
                      animated, no popups. */}
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
                          padding: "8px 12px", borderRadius: 12,
                          background: statusBanner.kind === "en_route" ? "#E6F1FB" : "#FBF1DE",
                          color: statusBanner.kind === "en_route" ? "#1F5C99" : "#A8731A",
                          fontSize: a11yPx(12), fontWeight: 600, letterSpacing: -0.05,
                        }}
                      >
                        {statusBanner.kind === "en_route" ? (
                          <Send style={{ width: 14, height: 14 }} strokeWidth={2.3} />
                        ) : (
                          <Clock style={{ width: 14, height: 14 }} strokeWidth={2.3} />
                        )}
                        <span>
                          {statusBanner.kind === "en_route"
                            ? `On the way${statusBanner.etaText ? ` · ETA ${statusBanner.etaText}` : ""}`
                            : `Running late${statusBanner.delayMinutes ? ` · +${statusBanner.delayMinutes} min` : ""}${statusBanner.etaText ? ` · New ETA ${statusBanner.etaText}` : ""}`}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Unified segmented status control */}
                  {(() => {
                    const rawNorm = (lessonStatus || "").toLowerCase();
                    // Optimistic local overlay wins until the next refetch
                    // brings the server status into agreement.
                    const norm = localStatus
                      ? (localStatus === "en_route" ? "en_route" : "late")
                      : rawNorm;
                    const segments = [
                      { id: "prep", label: "Prep", icon: ClipboardList,
                        active: norm === "prep" || norm === "preparing",
                        activeBg: "#6E6E73", activeFg: "#FFFFFF", inactiveFg: "#6E6E73",
                        onClick: () => navigate(`/instructor/pupils/${pupilId}?tab=progress`) },
                      { id: "on_the_way", label: "On the way", icon: Send,
                        active: norm === "en_route" || norm === "on_the_way",
                        activeBg: "#2B7BC8", activeFg: "#FFFFFF", inactiveFg: "#6E6E73",
                        onClick: () => setLateSheetOpen(true) },
                      { id: "late", label: "Running late", icon: Clock,
                        active: norm === "late" || norm === "running_late",
                        activeBg: "#E08E1A", activeFg: "#FFFFFF", inactiveFg: "#6E6E73",
                        onClick: () => setLateSheetOpen(true) },
                      { id: "here", label: "Here", icon: MapPin,
                        active: norm === "arrived" || norm === "here",
                        activeBg: "#34C759", activeFg: "#FFFFFF", inactiveFg: "#6E6E73",
                        onClick: () => handleArrived() },
                    ];
                    const segmentStyle = (s: typeof segments[number]): React.CSSProperties => ({
                      flex: 1, minWidth: 0,
                      background: s.active ? s.activeBg : "transparent",
                      color: s.active ? s.activeFg : s.inactiveFg,
                      border: "none", borderRadius: 14,
                      padding: "8px 4px", minHeight: 52,
                      cursor: "pointer",
                      display: "inline-flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
                      transition: "background 0.2s ease, color 0.2s ease, transform 0.15s ease",
                      boxShadow: s.active ? "0 1px 2px rgba(16,24,40,0.06), 0 4px 10px -4px rgba(16,24,40,0.12)" : "none",
                    });
                    return (
                      <div style={{
                        display: "flex", alignItems: "stretch",
                        background: "#EEF1F6", borderRadius: 18,
                        padding: 4, gap: 2,
                      }}>
                        {segments.map((s) => {
                          const Icon = s.icon;
                          const inner = (
                            <>
                              <Icon style={{ width: 16, height: 16 }} strokeWidth={2.1} />
                              <span style={{
                                fontSize: a11yPx(11), fontWeight: 600, letterSpacing: -0.05,
                                lineHeight: 1.15, textAlign: "center",
                                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                                overflow: "hidden", maxWidth: "100%", wordBreak: "break-word",
                              }}>{s.label}</span>
                            </>
                          );
                          if (s.isDropdown) {
                            return (
                              <DropdownMenu key={s.id}>
                                <DropdownMenuTrigger asChild>
                                  <button onClick={(e) => e.stopPropagation()}
                                    className="active:scale-[0.97]"
                                    style={segmentStyle(s)} aria-label={s.label}>
                                    {inner}
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
                            );
                          }
                          return (
                            <button key={s.id}
                              onClick={(e) => { e.stopPropagation(); s.onClick?.(); }}
                              className="active:scale-[0.97]"
                              style={segmentStyle(s)}
                              aria-label={s.label} aria-pressed={s.active}>
                              {inner}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()}
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
              background: "#FFFFFF", borderRadius: 16, padding: 4,
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
                      background: "#FFFFFF", borderRadius: 16,
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
                      background: "#FFFFFF", borderRadius: 16, padding: 16,
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
                        padding: 14, borderRadius: 16, background: "#FFFFFF",
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
                        padding: 14, borderRadius: 16,
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
                          padding: 14, borderRadius: 16, background: "#FFFFFF",
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
                          padding: 14, borderRadius: 16, background: "#FFFFFF",
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
                    <X style={{ width: 16, height: 16, color: "#FF3B30" }} strokeWidth={2.4} />
                    <span style={{ fontSize: a11yPx(14), fontWeight: 600, color: "#FF3B30", letterSpacing: -0.1 }}>
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
      <RunningLateSheet open={lateSheetOpen} onOpenChange={setLateSheetOpen}
        pupilName={pupilName} pupilPhone={pupilPhone} startTime={startTime}
        etaMinutes={etaMinutes} />

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
