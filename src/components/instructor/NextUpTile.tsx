import { useState } from "react";
import { format, parse, isToday, isTomorrow, parseISO } from "date-fns";
import { Clock, Phone, MessageSquare, X, Navigation, Car, Loader2, Mail, Check, CreditCard, CalendarClock, User, MapPin, Timer, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { PupilAvatar } from "./PupilAvatar";
import { PaymentStatusBadge } from "./PaymentStatusBadge";
import { CancelLessonDialog } from "./CancelLessonDialog";
import { useTrafficETA } from "@/hooks/useTrafficETA";
import { usePupilUnreadCount } from "@/hooks/usePupilUnreadCount";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
    return h % 1 === 0 ? `${h}h` : `${h}h`;
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

  const displayLocation = [pickupLocation, pickupPostcode].filter(Boolean).join(", ");

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="rounded-2xl bg-card border border-border shadow-[0_2px_12px_rgba(20,37,66,0.08)] overflow-hidden">
          {/* Map placeholder */}
          {pickupPostcode && (
            <button
              onClick={handleNavigate}
              className="w-full h-28 bg-muted flex items-center justify-center gap-2 text-muted-foreground hover:bg-muted/80 transition-colors cursor-pointer"
            >
              <MapPin className="h-5 w-5" />
              <span className="text-sm font-medium">Map preview · {pickupPostcode}</span>
            </button>
          )}

          <div className="p-4">
            {/* Pupil info */}
            <div className="flex items-center gap-3 mb-3">
              <PupilAvatar
                name={pupilName}
                imageUrl={pupilProfileImage}
                size="lg"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-base truncate">{pupilName}</p>
                {displayLocation && (
                  <p className="text-sm text-muted-foreground truncate">{displayLocation}</p>
                )}
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
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

            {/* Unread message alert */}
            {pupilUnreadCount > 0 && (
              <div className="mb-3 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 border border-destructive/20">
                <Mail className="h-4 w-4 text-destructive shrink-0" />
                <span className="text-xs font-medium text-destructive">
                  {pupilUnreadCount} unread message{pupilUnreadCount !== 1 ? "s" : ""} from {pupilName.split(" ")[0]}
                </span>
              </div>
            )}

            {/* Countdown + duration badges */}
            <div className="flex items-center gap-2 mb-3">
              {minutesUntil <= 30 ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-sm font-bold text-amber-700 dark:text-amber-300 animate-pulse">
                  <Timer className="h-4 w-4" /> Starts {getCountdownText()}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-sm font-medium text-muted-foreground">
                  <Clock className="h-4 w-4" /> {getDateLabel()} · {formatTime(startTime)}
                </span>
              )}
              <Badge variant="secondary" className="text-xs">{formatDuration()} lesson</Badge>
            </div>

            {/* Primary actions — grid */}
            <div className="grid grid-cols-3 gap-2">
              {pickupPostcode && (
                <Button size="sm" onClick={handleNavigate} className="rounded-xl gap-1.5 col-span-3">
                  <Navigation className="h-4 w-4" /> Start Navigation
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={handleCall} disabled={!pupilPhone} className="rounded-xl gap-1.5">
                <Phone className="h-3.5 w-3.5" /> Call
              </Button>
              <Button size="sm" variant="outline" onClick={handleMessage} disabled={!pupilPhone} className="rounded-xl gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" /> Message
              </Button>
              <Button size="sm" variant="outline" onClick={handleOnMyWay} disabled={!pupilPhone} className="rounded-xl gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-600" /> On Way
              </Button>
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
