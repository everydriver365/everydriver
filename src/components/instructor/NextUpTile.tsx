import { useState } from "react";
import { format, parse, isToday, isTomorrow, parseISO, addMinutes } from "date-fns";
import { Clock, Phone, MessageSquare, X, Navigation, Car, Loader2, Mail, Check, CalendarClock, User, Timer, ChevronDown, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { PupilAvatar } from "./PupilAvatar";
import { PaymentStatusBadge } from "./PaymentStatusBadge";
import { CancelLessonDialog } from "./CancelLessonDialog";
import { PostcodeMapPreview } from "./PostcodeMapPreview";
import { useTrafficETA } from "@/hooks/useTrafficETA";
import { usePupilUnreadCount } from "@/hooks/usePupilUnreadCount";
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
        <div className="rounded-2xl bg-card border border-border/40 shadow-[0_2px_12px_rgba(20,37,66,0.10)] overflow-hidden">
          {/* Map with floating countdown chip */}
          <div className="relative">
            {pickupPostcode && (
              <PostcodeMapPreview
                postcode={pickupPostcode}
                onClick={handleNavigate}
              />
            )}
            {/* Floating "Next Up" label on map */}
            <div className="absolute top-3 left-3 z-10">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-card/90 backdrop-blur-sm border border-border/60 text-[11px] font-bold text-foreground shadow-md">
                <Clock className="h-3 w-3 text-primary" /> Next Up
              </span>
            </div>
            {/* Floating countdown chip on map */}
            <div className="absolute top-3 right-3 z-10">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold shadow-md ${
                isUrgent
                  ? "bg-amber-50 dark:bg-amber-900/80 border border-amber-200/60 text-amber-700 dark:text-amber-300 animate-pulse"
                  : "bg-card/90 backdrop-blur-sm border border-border/60 text-foreground"
              }`}>
                <Timer className="h-3 w-3" /> {getCountdownText()}
              </span>
            </div>
          </div>

          {/* Avatar overlapping map, name below */}
          <div className="relative px-4">
            <div className="-mt-8 mb-2">
              <div className="ring-4 ring-card rounded-full shrink-0 inline-block">
                <PupilAvatar
                  name={pupilName}
                  imageUrl={pupilProfileImage}
                  size="lg"
                />
              </div>
            </div>
            <div className="mb-3">
              <p className="font-bold text-foreground text-base truncate">{pupilName}</p>
              {displayLocation && (
                <p className="text-xs text-muted-foreground truncate">{displayLocation}</p>
              )}
            </div>
          </div>

          <div className="px-4 pb-4">
            {/* Info badges row */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-primary/5 border border-primary/10 text-xs font-medium text-foreground">
                <Clock className="h-3.5 w-3.5 text-primary" /> {getDateLabel()} · {formatTime(startTime)}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/60 dark:border-emerald-800/30 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                {formatDuration()} lesson
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] font-semibold ${
                effectiveBalance < 0
                  ? "bg-destructive/10 border border-destructive/30 text-destructive"
                  : "bg-blue-50 dark:bg-blue-900/20 border border-blue-200/60 dark:border-blue-800/30 text-blue-700 dark:text-blue-300"
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

            {/* Messages row — always visible */}
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

            {/* Primary actions — Navigate full width + icon circles */}
            <div className="flex items-center gap-2">
              {pickupPostcode && (
                <Button size="sm" onClick={handleNavigate} className="flex-1 rounded-xl gap-1.5">
                  <Navigation className="h-4 w-4" /> Navigate
                </Button>
              )}
              <Button size="icon" variant="outline" onClick={handleCall} disabled={!pupilPhone} className="rounded-full h-10 w-10 shrink-0">
                <Phone className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline" onClick={handleMessage} disabled={!pupilPhone} className="rounded-full h-10 w-10 shrink-0">
                <MessageSquare className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="outline" disabled={!pupilPhone} className="rounded-full h-10 w-10 shrink-0">
                    <Check className="h-4 w-4 text-emerald-600" />
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
            </div>

            {/* Expand toggle */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-center gap-1 pt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
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
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border mt-2">
                    <Button size="sm" variant="outline" onClick={handleViewPupil} className="rounded-xl gap-1.5">
                      <User className="h-3.5 w-3.5" /> Pupil
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => navigate(`/instructor/schedule?date=${lessonDate}`)} className="rounded-xl gap-1.5">
                      <CalendarClock className="h-3.5 w-3.5" /> Schedule
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setCancelOpen(true)} className="rounded-xl gap-1.5 text-destructive hover:text-destructive">
                      <X className="h-3.5 w-3.5" /> Cancel
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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
