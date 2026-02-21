import { useState } from "react";
import { format, parse, isToday, isTomorrow, parseISO, addMinutes } from "date-fns";
import { Clock, Phone, MessageSquare, X, Navigation, Car, Loader2, Mail, Check, CalendarClock, User, Timer, ChevronDown, Send, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { PupilAvatar } from "./PupilAvatar";
import { PaymentStatusBadge } from "./PaymentStatusBadge";
import { CancelLessonDialog } from "./CancelLessonDialog";
import { RescheduleLessonSheet } from "./RescheduleLessonSheet";

import { useTrafficETA } from "@/hooks/useTrafficETA";
import { usePupilUnreadCount } from "@/hooks/usePupilUnreadCount";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
  const [cancelOpen, setCancelOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: pupilUnreadCount = 0 } = usePupilUnreadCount(instructorId, pupilId);
  const { durationMinutes: etaMinutes, durationText: etaText, trafficCondition, isLoading: etaLoading } = useTrafficETA(pickupPostcode);

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

  const formatDuration = () => {
    const h = durationMinutes / 60;
    return `${h}h`;
  };

  const effectiveBalance = prepaidHours > 0 ? prepaidHours * 40 : accountBalance;

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

  const sendSMS = (message: string) => {
    if (pupilPhone) {
      const encoded = encodeURIComponent(message);
      const link = document.createElement("a");
      link.href = `sms:${pupilPhone}?body=${encoded}`;
      link.click();
    }
  };

  const firstName = pupilName.split(" ")[0];

  const handleOnMyWay = () => sendSMS(`Hi ${firstName}, I'm on my way to you!`);
  const handleOnWayDelay = (mins: number) => sendSMS(`Hi ${firstName}, I'm on my way! I'll be with you in about ${mins} minutes.`);
  const handleCallASAP = () => sendSMS(`Hi ${firstName}, I'll call you as soon as I can!`);
  const handleSendETA = () => {
    if (etaText) {
      sendSMS(`Hi ${firstName}, I'm on my way! My estimated arrival time is ${etaText}.`);
    } else {
      sendSMS(`Hi ${firstName}, I'm on my way to you now!`);
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

  const displayLocation = [pickupLocation, pickupPostcode].filter(Boolean).join(", ");
  const isUrgent = minutesUntil <= 30;
  const hasUnread = pupilUnreadCount > 0;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.05)] border border-border/40 bg-card overflow-hidden">
          {/* Header — Quick Access tile style */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full px-3.5 py-3.5 flex items-center gap-3"
          >
            <div className="relative shrink-0">
              <div className="ring-2 ring-primary/20 rounded-full">
                <PupilAvatar
                  name={pupilName}
                  imageUrl={pupilProfileImage}
                  size="md"
                />
              </div>
              {hasUnread && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center px-1">
                  {pupilUnreadCount}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[12px] font-semibold text-foreground leading-tight truncate">{pupilName}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {getDateLabel()} · {formatTime(startTime)} · {formatDuration()}
                {displayLocation && ` · ${pickupPostcode}`}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isUrgent
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                  : "bg-muted text-muted-foreground"
              }`}>
                <Timer className="h-3 w-3" /> {getCountdownText()}
              </span>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", !expanded && "-rotate-90")} />
            </div>
          </button>

          {/* Expandable content */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4">
                  {/* Info badges row */}
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold ${
                      effectiveBalance < 0
                        ? "bg-destructive/10 text-destructive"
                        : "bg-primary/5 text-primary"
                    }`}>
                      £{Math.abs(effectiveBalance).toFixed(0)}{effectiveBalance < 0 ? " due" : ""}
                    </span>
                  </div>

                  {/* ETA row */}
                  {etaLoading ? (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Calculating ETA...
                    </div>
                  ) : etaMinutes > 0 ? (
                    <div className={`flex items-center gap-1.5 text-xs font-medium mb-3 ${
                      trafficCondition === 'heavy' ? 'text-destructive'
                      : trafficCondition === 'moderate' ? 'text-amber-600'
                      : 'text-emerald-600'
                    }`}>
                      <Car className="h-3.5 w-3.5" />
                      ETA {format(addMinutes(new Date(), etaMinutes), "HH:mm")} ({etaText})
                      {trafficCondition && trafficCondition !== 'clear' && trafficCondition !== 'light' && (
                        <span className="ml-0.5">{trafficCondition === 'heavy' ? '🔴' : '🟡'}</span>
                      )}
                    </div>
                  ) : null}

                  {/* Messages row */}
                  <div className={`mb-3 flex items-center gap-2 rounded-lg px-3 py-2 border ${
                    hasUnread
                      ? "bg-destructive/10 border-destructive/20"
                      : "bg-muted/30 border-border/40"
                  }`}>
                    <Mail className={`h-4 w-4 shrink-0 ${hasUnread ? "text-destructive" : "text-muted-foreground"}`} />
                    <span className={`text-xs font-medium ${hasUnread ? "text-destructive" : "text-muted-foreground"}`}>
                      {hasUnread
                        ? `${pupilUnreadCount} unread message${pupilUnreadCount !== 1 ? "s" : ""} from ${firstName}`
                        : `No unread messages from ${firstName}`
                      }
                    </span>
                  </div>

                  {/* Start Lesson — visible when lesson is imminent */}
                  {minutesUntil <= 15 && (
                    <Button
                      size="sm"
                      onClick={() => navigate(`/instructor/live-map?lesson=${lessonId}`)}
                      className="w-full rounded-xl gap-2 h-9 text-sm font-semibold mb-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Play className="h-4 w-4" /> Start Lesson
                    </Button>
                  )}

                  {/* Primary actions */}
                  <div className="flex items-center gap-1.5">
                    {pickupPostcode && (
                      <Button size="sm" onClick={handleNavigate} className="flex-1 rounded-xl gap-1 h-8 text-xs">
                        <Navigation className="h-3.5 w-3.5" /> Navigate
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline" disabled={!pupilPhone} className="rounded-xl gap-1 h-8 text-xs">
                          <Check className="h-3.5 w-3.5 text-emerald-600" /> On Way
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem onClick={handleOnMyWay}>
                          <Check className="h-4 w-4 mr-2 text-emerald-600" />
                          On my way!
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleOnWayDelay(5)}>
                          <Clock className="h-4 w-4 mr-2" /> I'll be 5 mins
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOnWayDelay(10)}>
                          <Clock className="h-4 w-4 mr-2" /> I'll be 10 mins
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOnWayDelay(15)}>
                          <Clock className="h-4 w-4 mr-2" /> I'll be 15 mins
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOnWayDelay(20)}>
                          <Clock className="h-4 w-4 mr-2" /> I'll be 20 mins
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOnWayDelay(30)}>
                          <Clock className="h-4 w-4 mr-2" /> I'll be 30 mins
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleCallASAP}>
                          <Phone className="h-4 w-4 mr-2" /> I'll call you ASAP
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleSendETA}>
                          <Send className="h-4 w-4 mr-2 text-primary" />
                          {etaText ? `Send ETA (${etaText})` : "Send current ETA"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button size="icon" variant="outline" onClick={handleCall} disabled={!pupilPhone} className="rounded-full h-8 w-8 shrink-0">
                      <Phone className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="outline" onClick={handleMessage} disabled={!pupilPhone} className="rounded-full h-8 w-8 shrink-0">
                      <MessageSquare className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* Secondary actions */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border mt-3">
                    <Button size="sm" variant="outline" onClick={() => setRescheduleOpen(true)} className="rounded-xl gap-1.5">
                      <CalendarClock className="h-3.5 w-3.5" /> Reschedule
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setCancelOpen(true)} className="rounded-xl gap-1.5 text-destructive hover:text-destructive">
                      <X className="h-3.5 w-3.5" /> Cancel
                    </Button>
                  </div>
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

      {/* Reschedule sheet with live availability */}
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
    </>
  );
}
