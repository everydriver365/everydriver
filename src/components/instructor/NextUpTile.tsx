import { useState } from "react";
import { format, parse, isToday, isTomorrow, parseISO } from "date-fns";
import { Clock, Phone, MessageSquare, X, Navigation, Car, Loader2, Mail, ChevronDown, Check, CreditCard, CalendarClock, User, Timer } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { PupilAvatar } from "./PupilAvatar";
import { PaymentStatusBadge } from "./PaymentStatusBadge";
import { CancelLessonDialog } from "./CancelLessonDialog";
import { useTrafficETA } from "@/hooks/useTrafficETA";
import { usePupilUnreadCount } from "@/hooks/usePupilUnreadCount";

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

// --- Helper functions ---

function getUrgencyBorderColor(minutesUntil: number) {
  if (minutesUntil < 15) return "border-l-red-500";
  if (minutesUntil <= 30) return "border-l-amber-400";
  return "border-l-primary";
}

function getCountdownBadgeColors(minutesUntil: number) {
  if (minutesUntil < 5) return "bg-red-500/15 text-red-700 dark:text-red-400";
  if (minutesUntil <= 15) return "bg-amber-500/15 text-amber-700 dark:text-amber-400";
  return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
}

function formatDuration(mins: number) {
  const h = mins / 60;
  if (h === Math.floor(h)) return `${h}h`;
  return `${h.toFixed(1)}h`;
}

function getPaymentRingColor(effectiveBalance: number) {
  if (effectiveBalance > 20) return "ring-emerald-400";
  if (effectiveBalance > 0) return "ring-amber-400";
  return "ring-red-400";
}

export function NextUpTile({
  lessonId,
  pupilId,
  pupilName,
  pupilProfileImage,
  pupilPhone,
  lessonDate,
  pickupPostcode,
  pickupLocation,
  startTime,
  minutesUntil,
  accountBalance,
  prepaidHours,
  durationMinutes = 60,
  instructorId,
}: NextUpTileProps) {
  const [expanded, setExpanded] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: pupilUnreadCount = 0 } = usePupilUnreadCount(instructorId, pupilId);
  const { durationMinutes: etaMinutes, durationText: etaText, trafficCondition, isLoading: etaLoading } = useTrafficETA(pickupPostcode);

  const effectiveBalance = prepaidHours > 0 ? prepaidHours * 40 : accountBalance;

  const formatTime = (time: string) => {
    try {
      const parsed = parse(time, "HH:mm:ss", new Date());
      return format(parsed, "h:mm a");
    } catch {
      return time;
    }
  };

  const getDateLabel = () => {
    const date = parseISO(lessonDate);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEE d MMM");
  };

  const getCountdownText = () => {
    if (minutesUntil <= 0) return "now";
    if (minutesUntil < 60) return `in ${minutesUntil} min`;
    const hours = Math.floor(minutesUntil / 60);
    const mins = minutesUntil % 60;
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      return `in ${days}d`;
    }
    return mins > 0 ? `in ${hours}h ${mins}m` : `in ${hours}h`;
  };

  const handleNavigate = () => {
    if (pickupPostcode) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pickupPostcode)}`,
        "_blank"
      );
    }
  };

  const handleCall = () => {
    if (pupilPhone) {
      const link = document.createElement("a");
      link.href = `tel:${pupilPhone}`;
      link.click();
    }
  };

  const handleMessage = () => {
    if (pupilPhone) {
      const link = document.createElement("a");
      link.href = `sms:${pupilPhone}`;
      link.click();
    }
  };

  const handleOnMyWay = () => {
    if (pupilPhone) {
      const firstName = pupilName.split(" ")[0];
      const message = encodeURIComponent(`Hi ${firstName}, I'm on my way to you!`);
      const link = document.createElement("a");
      link.href = `sms:${pupilPhone}?body=${message}`;
      link.click();
    }
  };

  const handleViewPupil = () => {
    navigate(`/instructor/pupils`);
  };

  const handleCancelled = () => {
    queryClient.invalidateQueries({ queryKey: ["next-lesson-details"] });
    queryClient.invalidateQueries({ queryKey: ["today-remaining-lessons"] });
  };

  const getEndTime = () => {
    try {
      const parsed = parse(startTime, "HH:mm:ss", new Date());
      const end = new Date(parsed.getTime() + durationMinutes * 60 * 1000);
      return format(end, "HH:mm:ss");
    } catch {
      return undefined;
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Enhancement 2: urgency border-left, 7: gradient bg + tinted border + shadow */}
        <div className={`rounded-2xl overflow-hidden border-l-4 ${getUrgencyBorderColor(minutesUntil)} bg-gradient-to-b from-blue-50/40 to-white dark:from-blue-950/10 dark:to-card border border-blue-200/40 dark:border-blue-800/30 shadow-[0_2px_12px_rgba(20,37,66,0.08)]`}>
          
          {/* Enhancement 1: gradient header strip */}
          <div className="px-5 pt-4 pb-3 bg-gradient-to-br from-primary/5 to-transparent">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Next Lesson
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-foreground">
                {getDateLabel()} · {formatTime(startTime)}
              </h2>
              {/* Enhancement 4: duration badge */}
              <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium">
                {formatDuration(durationMinutes)}
              </span>
            </div>
            {/* Enhancement 3: animated countdown badge */}
            {minutesUntil <= 30 ? (
              <div className={`inline-flex items-center gap-1.5 mt-1.5 rounded-full px-2.5 py-1 text-xs font-semibold animate-pulse ${getCountdownBadgeColors(minutesUntil)}`}>
                <Timer className="h-3 w-3" />
                {getCountdownText()}
              </div>
            ) : minutesUntil < 60 ? (
              <p className="text-sm text-muted-foreground mt-0.5">
                ({getCountdownText()})
              </p>
            ) : null}
          </div>

          {/* Pupil info card */}
          <div className="mx-4 mb-3 rounded-xl border border-border p-3 bg-muted/50">
            <div className="flex items-center gap-3">
              {/* Enhancement 5: payment-status ring on avatar */}
              <div className={`ring-2 ${getPaymentRingColor(effectiveBalance)} ring-offset-2 ring-offset-white dark:ring-offset-card rounded-full`}>
                <PupilAvatar
                  name={pupilName}
                  imageUrl={pupilProfileImage}
                  size="lg"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-base truncate">{pupilName}</p>
                {(pickupLocation || pickupPostcode) && (
                  <p className="text-sm text-muted-foreground mt-0.5 truncate">
                    {pickupLocation ? `${pickupLocation}, ` : ""}{pickupPostcode || ""}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <PaymentStatusBadge balance={effectiveBalance} size="md" />
                  {etaLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  ) : etaMinutes > 0 ? (
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                      trafficCondition === 'heavy' ? 'text-destructive'
                      : trafficCondition === 'moderate' ? 'text-amber-600'
                      : 'text-emerald-600'
                    }`}>
                      <Car className="h-3.5 w-3.5" />
                      {etaText}
                      {trafficCondition && trafficCondition !== 'clear' && trafficCondition !== 'light' && (
                        <span className="ml-0.5">
                          {trafficCondition === 'heavy' ? '🔴' : '🟡'}
                        </span>
                      )}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* Unread message alert */}
          {pupilUnreadCount > 0 && (
            <div className="mx-4 mb-3 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 border border-destructive/20">
              <Mail className="h-4 w-4 text-destructive shrink-0" />
              <span className="text-xs font-medium text-destructive">
                {pupilUnreadCount} unread message{pupilUnreadCount !== 1 ? "s" : ""} from {pupilName.split(" ")[0]}
              </span>
            </div>
          )}

          {/* Start Navigation CTA */}
          {pickupPostcode && (
            <div className="px-4 mb-3">
              <button
                onClick={handleNavigate}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-primary-foreground font-semibold text-base shadow-md hover:shadow-lg transition-all bg-primary hover:bg-primary/90"
              >
                <Navigation className="h-5 w-5" />
                Start Navigation &rsaquo;
              </button>
            </div>
          )}

          {/* Enhancement 6: improved action buttons */}
          <div className="px-4 pb-2 grid grid-cols-3 gap-2">
            <button
              onClick={handleCall}
              disabled={!pupilPhone}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-blue-200/60 py-2.5 text-sm font-medium text-blue-900 dark:text-blue-100 bg-gradient-to-r from-blue-50 to-white dark:from-blue-950/20 dark:to-card hover:ring-1 hover:ring-blue-300/50 shadow-[0_1px_4px_rgba(20,37,66,0.06)] transition-all disabled:opacity-40"
            >
              <Phone className="h-4 w-4" />
              Call
            </button>
            <button
              onClick={handleMessage}
              disabled={!pupilPhone}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-blue-200/60 py-2.5 text-sm font-medium text-blue-900 dark:text-blue-100 bg-gradient-to-r from-blue-50 to-white dark:from-blue-950/20 dark:to-card hover:ring-1 hover:ring-blue-300/50 shadow-[0_1px_4px_rgba(20,37,66,0.06)] transition-all disabled:opacity-40"
            >
              <MessageSquare className="h-4 w-4" />
              Message
            </button>
            <button
              onClick={handleOnMyWay}
              disabled={!pupilPhone}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200/60 py-2.5 text-sm font-medium text-emerald-900 dark:text-emerald-100 bg-gradient-to-r from-emerald-50 to-white dark:from-emerald-950/20 dark:to-card hover:ring-1 hover:ring-emerald-300/50 shadow-[0_1px_4px_rgba(20,37,66,0.06)] transition-all disabled:opacity-40"
            >
              <Check className="h-4 w-4" />
              On Way
            </button>
          </div>

          {/* Expand toggle */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-center gap-1 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>{expanded ? "Less" : "More actions"}</span>
            <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="h-3.5 w-3.5" />
            </motion.div>
          </button>

          {/* Expandable extra actions */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 grid grid-cols-3 gap-2 border-t border-border pt-3">
                  <button
                    onClick={() => setCancelOpen(true)}
                    className="flex flex-col items-center justify-center gap-1 rounded-xl border border-red-200/60 py-3 text-xs font-medium text-red-700 dark:text-red-400 bg-gradient-to-r from-red-50 to-white dark:from-red-950/20 dark:to-card hover:ring-1 hover:ring-red-300/50 shadow-[0_1px_4px_rgba(20,37,66,0.06)] transition-all"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                  <button
                    onClick={handleViewPupil}
                    className="flex flex-col items-center justify-center gap-1 rounded-xl border border-blue-200/60 py-3 text-xs font-medium text-blue-900 dark:text-blue-100 bg-gradient-to-r from-blue-50 to-white dark:from-blue-950/20 dark:to-card hover:ring-1 hover:ring-blue-300/50 shadow-[0_1px_4px_rgba(20,37,66,0.06)] transition-all"
                  >
                    <User className="h-4 w-4 text-primary" />
                    View Pupil
                  </button>
                  <button
                    onClick={() => navigate(`/instructor/schedule?date=${lessonDate}`)}
                    className="flex flex-col items-center justify-center gap-1 rounded-xl border border-blue-200/60 py-3 text-xs font-medium text-blue-900 dark:text-blue-100 bg-gradient-to-r from-blue-50 to-white dark:from-blue-950/20 dark:to-card hover:ring-1 hover:ring-blue-300/50 shadow-[0_1px_4px_rgba(20,37,66,0.06)] transition-all"
                  >
                    <CalendarClock className="h-4 w-4 text-primary" />
                    Schedule
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Cancel lesson dialog */}
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
    </>
  );
}
