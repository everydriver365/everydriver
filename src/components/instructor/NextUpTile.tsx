import { format, parse, isToday, isTomorrow, parseISO } from "date-fns";
import { Clock, Phone, MessageSquare, X, Navigation, Car, Loader2, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { PupilAvatar } from "./PupilAvatar";
import { PaymentStatusBadge } from "./PaymentStatusBadge";
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
  instructorId,
}: NextUpTileProps) {
  const { data: pupilUnreadCount = 0 } = usePupilUnreadCount(instructorId, pupilId);

  const { durationMinutes: etaMinutes, durationText: etaText, trafficCondition, isLoading: etaLoading } = useTrafficETA(
    pickupPostcode
  );

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
      window.open(`tel:${pupilPhone}`, "_self");
    }
  };

  const handleMessage = () => {
    if (pupilPhone) {
      window.open(`sms:${pupilPhone}`, "_self");
    }
  };

  const handleCancel = () => {
    // Cancel functionality — could open a confirmation dialog
    // Keeping as placeholder to retain existing pattern
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4"
    >
      <div className="rounded-2xl bg-white border border-border shadow-[0_2px_8px_rgba(20,37,66,0.08)] overflow-hidden">
        {/* Header section — date/time + countdown */}
        <div className="px-5 pt-4 pb-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Next Lesson
            </span>
          </div>
          <h2 className="text-xl font-bold text-foreground">
            {getDateLabel()} · {formatTime(startTime)}
          </h2>
          {minutesUntil < 60 && (
            <p className="text-sm text-muted-foreground mt-0.5">
              ({getCountdownText()})
            </p>
          )}
        </div>

        {/* Pupil info card */}
        <div className="mx-4 mb-3 rounded-xl bg-secondary/50 border border-border p-3">
          <div className="flex items-center gap-3">
            <PupilAvatar
              name={pupilName}
              imageUrl={pupilProfileImage}
              size="lg"
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground text-base truncate">{pupilName}</p>
              {(pickupLocation || pickupPostcode) && (
                <p className="text-sm text-muted-foreground mt-0.5 truncate">
                  {pickupLocation ? `${pickupLocation}, ` : ""}{pickupPostcode || ""}
                </p>
              )}
              {/* Payment + Traffic row */}
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
                    {trafficCondition === 'clear' ? '✓ Clear' : trafficCondition === 'heavy' ? '🔴 Heavy' : trafficCondition === 'moderate' ? '🟡 Moderate' : `✓ ${etaText}`}
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
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-white font-semibold text-base shadow-md hover:shadow-lg transition-all"
              style={{ background: "linear-gradient(to right, #1877F2, #1466d8)" }}
            >
              <Navigation className="h-5 w-5" />
              Start Navigation &rsaquo;
            </button>
          </div>
        )}

        {/* Action buttons row */}
        <div className="px-4 pb-4 grid grid-cols-3 gap-2">
          <button
            onClick={handleCall}
            disabled={!pupilPhone}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/50 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors disabled:opacity-40"
          >
            <Phone className="h-4 w-4" />
            Call
          </button>
          <button
            onClick={handleMessage}
            disabled={!pupilPhone}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/50 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors disabled:opacity-40"
          >
            <MessageSquare className="h-4 w-4" />
            Message
          </button>
          <button
            onClick={handleCancel}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/50 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>
        </div>
      </div>
    </motion.div>
  );
}
