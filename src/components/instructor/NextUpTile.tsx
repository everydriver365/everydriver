import { useState, useEffect, useRef } from "react";
import { format, parse, isToday, isTomorrow, parseISO, addMinutes } from "date-fns";
import {
  Clock, Phone, MessageSquare, X, Navigation, Car, Loader2,
  ChevronDown, ChevronUp, Send, Play, MapPin, Calendar,
  Hourglass, PoundSterling, MessageCircle, AlertTriangle, CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { CancelLessonDialog } from "./CancelLessonDialog";
import { RescheduleLessonSheet } from "./RescheduleLessonSheet";
import { EndLessonWizard } from "./EndLessonWizard";
import { supabase } from "@/integrations/supabase/client";

import { useTrafficETA } from "@/hooks/useTrafficETA";
import { usePupilUnreadCount } from "@/hooks/usePupilUnreadCount";
import { useRunningLateDetection } from "@/hooks/useRunningLateDetection";
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
}

function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

export function NextUpTile({
  lessonId, pupilId, pupilName, pupilProfileImage, pupilPhone,
  lessonDate, pickupPostcode, pickupLocation, startTime,
  minutesUntil, accountBalance, prepaidHours, durationMinutes = 60, instructorId,
}: NextUpTileProps) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [, setTick] = useState(0);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: pupilUnreadCount = 0 } = usePupilUnreadCount(instructorId, pupilId);
  const { durationMinutes: etaMinutes, durationText: etaText, trafficCondition, isLoading: etaLoading } = useTrafficETA(pickupPostcode);

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
          background: "linear-gradient(135deg, rgb(38,64,140) 0%, rgb(31,89,166) 50%, rgb(26,115,179) 100%)",
          borderRadius: 22,
          boxShadow: "0 6px 12px rgba(0,0,0,0.15)",
        }}
        className="w-full overflow-hidden"
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
                className="w-[50px] h-[50px] rounded-full flex items-center justify-center text-white font-bold text-lg"
                style={{ background: "rgba(255,255,255,0.2)" }}
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
                <span className="text-[11px] font-bold uppercase tracking-[0.5px]" style={{ color: "#FBBF24" }}>
                  Next Up
                </span>
                <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>·</span>
                <span className="text-[11px] font-bold" style={{ color: "#00E5FF" }}>
                  {getCountdownText()}
                </span>
              </div>
              <p className="text-[20px] font-bold text-white truncate mt-0.5">{pupilName}</p>
            </div>

            {/* Right: time + chevron */}
            <div className="flex flex-col items-end shrink-0">
              <span className="text-[22px] font-bold text-white" style={{ fontVariantNumeric: "tabular-nums", fontFamily: "ui-monospace, monospace" }}>
                {formatTime24(startTime)}
              </span>
              {expanded
                ? <ChevronUp className="h-4 w-4 mt-1" style={{ color: "rgba(255,255,255,0.5)" }} />
                : <ChevronDown className="h-4 w-4 mt-1" style={{ color: "rgba(255,255,255,0.5)" }} />
              }
            </div>
          </div>

          {/* Pill badges row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={pillStyle} style={{ background: "rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.9)" }}>
              <Calendar className="h-[11px] w-[11px]" /> {getDateLabel()}
            </span>
            <span className={pillStyle} style={{ background: "rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.9)" }}>
              <Clock className="h-[11px] w-[11px]" /> {formatDuration()}
            </span>
            {(pickupLocation || pickupPostcode) && (
              <span className={pillStyle} style={{ background: "rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.9)" }}>
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
                  <p className="text-[12px] font-bold text-white">
                    You may arrive ~{lateByMinutes} min late
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>
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
                <div style={{ height: 1, background: "rgba(255,255,255,0.1)" }} />

                {/* 1. Info Badges Row */}
                <div className="grid grid-cols-3 gap-[10px]">
                  {/* Start */}
                  <div className="flex flex-col items-center py-3 rounded-xl" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <Clock className="h-4 w-4 mb-1" style={{ color: "rgba(255,255,255,0.5)" }} />
                    <span className="text-[15px] font-bold text-white">{formatTime24(startTime)}</span>
                    <span className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>Start</span>
                  </div>
                  {/* Duration */}
                  <div className="flex flex-col items-center py-3 rounded-xl" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <Hourglass className="h-4 w-4 mb-1" style={{ color: "rgba(255,255,255,0.5)" }} />
                    <span className="text-[15px] font-bold text-white">{formatDuration()}</span>
                    <span className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>Duration</span>
                  </div>
                  {/* Balance / Due */}
                  <div className="flex flex-col items-center py-3 rounded-xl" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <PoundSterling className="h-4 w-4 mb-1" style={{ color: "rgba(255,255,255,0.5)" }} />
                    <span className={`text-[15px] font-bold ${effectiveBalance < 0 ? "text-orange-400" : "text-emerald-400"}`}>
                      £{Math.abs(effectiveBalance).toFixed(0)}
                    </span>
                    <span className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                      {effectiveBalance < 0 ? "Due" : "Balance"}
                    </span>
                  </div>
                </div>

                {/* 2. Live ETA Row */}
                {(etaLoading || etaMinutes > 0) && (
                  <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <Car className="h-5 w-5 shrink-0" style={{ color: "#00E5FF" }} />
                    {etaLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-white/50" />
                        <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>Calculating ETA...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>Live ETA</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[15px] font-bold text-white">~{etaMinutes} min</span>
                          {trafficCondition && (
                            <>
                              <span style={{ color: "rgba(255,255,255,0.3)" }}>·</span>
                              <span className={`w-2 h-2 rounded-full ${getTrafficDot()}`} />
                              <span className="text-[11px] capitalize" style={{ color: "rgba(255,255,255,0.7)" }}>
                                {trafficCondition} traffic
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Unread Messages Row */}
                {hasUnread && (
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/instructor/messages`); }}
                    className="flex items-center gap-3 p-3 rounded-xl w-full text-left"
                    style={{ background: "rgba(255,255,255,0.08)" }}
                  >
                    <MessageCircle className="h-5 w-5 shrink-0 text-orange-400" />
                    <span className="text-[13px] font-medium text-white flex-1">
                      {pupilUnreadCount} unread message{pupilUnreadCount !== 1 ? "s" : ""} from {firstName}
                    </span>
                    <ChevronDown className="h-4 w-4 -rotate-90" style={{ color: "rgba(255,255,255,0.5)" }} />
                  </button>
                )}

                {/* 4. Start Lesson Button */}
                {minutesUntil <= 15 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      supabase.from("scheduled_lessons").update({ status: "in_progress" }).eq("id", lessonId).then(() => {});
                      navigate(`/instructor/live-map?lesson=${lessonId}`);
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

                <div className="grid grid-cols-4 gap-[10px]">
                  {/* Navigate */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleNavigate(); }}
                    className="flex flex-col items-center gap-1 py-3 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.12)" }}
                  >
                    <Navigation className="h-5 w-5 text-blue-400" />
                    <span className="text-[10px] font-bold text-white">Navigate</span>
                  </button>

                  {/* On My Way */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="flex flex-col items-center gap-1 py-3 rounded-xl"
                        style={{ background: "rgba(255,255,255,0.12)" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Send className="h-5 w-5 text-white" />
                        <span className="text-[10px] font-bold text-white">On My Way</span>
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
                    style={{ background: "rgba(255,255,255,0.12)" }}
                  >
                    <Phone className="h-5 w-5 text-emerald-400" />
                    <span className="text-[10px] font-bold text-white">Call</span>
                  </button>

                  {/* SMS */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleMessage(); }}
                    className="flex flex-col items-center gap-1 py-3 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.12)" }}
                  >
                    <MessageSquare className="h-5 w-5 text-orange-400" />
                    <span className="text-[10px] font-bold text-white">SMS</span>
                  </button>
                </div>

                {/* 6. Secondary Actions Row */}
                <div className="grid grid-cols-2 gap-[10px]">
                  <button
                    onClick={(e) => { e.stopPropagation(); setRescheduleOpen(true); }}
                    className="flex items-center justify-center gap-1.5 py-[10px] rounded-[10px] text-[12px] font-medium"
                    style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.8)" }}
                  >
                    <Calendar className="h-3.5 w-3.5" /> Reschedule
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setCancelOpen(true); }}
                    className="flex items-center justify-center gap-1.5 py-[10px] rounded-[10px] text-[12px] font-medium"
                    style={{ background: "rgba(255,0,0,0.12)", color: "rgba(255,80,80,0.9)" }}
                  >
                    <X className="h-3.5 w-3.5" /> Cancel Lesson
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
    </>
  );
}
