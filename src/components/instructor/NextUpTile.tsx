import { useState } from "react";
import { format, parse, isToday, isTomorrow, parseISO } from "date-fns";
import { Clock, MessageSquare, Phone, Navigation, X, Car, Loader2, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { PupilAvatar } from "./PupilAvatar";
import { PaymentStatusBadge } from "./PaymentStatusBadge";
import { useTrafficETA } from "@/hooks/useTrafficETA";
import { usePupilUnreadCount } from "@/hooks/usePupilUnreadCount";
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
      return format(parsed, "h:mm a").toUpperCase();
    } catch {
      return time;
    }
  };

  const getDateLabel = () => {
    const date = parseISO(lessonDate);
    if (isToday(date)) return format(date, "EEE d MMM");
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

  const handleText = () => {
    if (pupilPhone) {
      window.open(`sms:${pupilPhone}`, "_self");
    }
  };

  const handleCall = () => {
    if (pupilPhone) {
      window.open(`tel:${pupilPhone}`, "_self");
    }
  };

  const effectiveBalance = prepaidHours > 0 ? prepaidHours * 40 : accountBalance;
  const displayAddress = pickupLocation
    ? `${pickupLocation}${pickupPostcode ? `, ${pickupPostcode}` : ''}`
    : pickupPostcode || '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4"
    >
      <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(20,37,66,0.08)] border border-border overflow-hidden">
        {/* Top section with date/time and pupil photo */}
        <div className="relative">
          {/* Header label */}
          <div className="px-5 pt-4 pb-2">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                <Clock className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Next Lesson
              </span>
            </div>

            {/* Date and time - large */}
            <h2 className="text-2xl font-bold text-foreground mt-2 leading-tight">
              {getDateLabel()} · {formatTime(startTime)}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              ({getCountdownText()})
            </p>
          </div>

          {/* Pupil photo - positioned to the right */}
          {pupilProfileImage && (
            <div className="absolute top-3 right-3 w-28 h-28 rounded-2xl overflow-hidden shadow-md">
              <img
                src={pupilProfileImage}
                alt={pupilName}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        {/* Pupil info card */}
        <div className="mx-4 mb-3 bg-white rounded-xl border border-border/60 p-3 shadow-sm">
          <div className="flex items-center gap-3">
            <PupilAvatar
              name={pupilName}
              imageUrl={pupilProfileImage}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground text-[15px] truncate">{pupilName}</p>
              {displayAddress && (
                <p className="text-sm text-muted-foreground truncate mt-0.5">
                  {displayAddress}
                </p>
              )}
            </div>
          </div>

          {/* Credit badge and traffic status */}
          <div className="flex items-center gap-2 mt-2.5">
            <PaymentStatusBadge balance={effectiveBalance} size="md" />
            {etaLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            ) : trafficCondition ? (
              <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                trafficCondition === 'heavy'
                  ? 'text-red-600'
                  : trafficCondition === 'moderate'
                  ? 'text-amber-600'
                  : 'text-emerald-600'
              }`}>
                <Car className="h-3.5 w-3.5" />
                {trafficCondition === 'heavy' ? 'Heavy traffic' :
                 trafficCondition === 'moderate' ? 'Moderate' :
                 trafficCondition === 'light' ? 'Light traffic' : 'Clear'}
              </span>
            ) : null}
          </div>
        </div>

        {/* Unread message alert */}
        {pupilUnreadCount > 0 && (
          <div className="mx-4 mb-3 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 border border-destructive/20">
            <Mail className="h-4 w-4 text-destructive shrink-0" />
            <span className="text-xs font-medium text-destructive">
              {pupilUnreadCount} unread message{pupilUnreadCount !== 1 ? 's' : ''} from {pupilName.split(" ")[0]}
            </span>
          </div>
        )}

        {/* Start Navigation button */}
        <div className="px-4 mb-3">
          <Button
            onClick={handleNavigate}
            disabled={!pickupPostcode}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground text-base font-bold rounded-xl"
          >
            Start Navigation &gt;
          </Button>
        </div>

        {/* Action buttons row */}
        <div className="grid grid-cols-3 border-t border-border/60">
          <button
            onClick={handleCall}
            disabled={!pupilPhone}
            className="flex items-center justify-center gap-2 py-3.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors disabled:opacity-40 border-r border-border/60"
          >
            <Phone className="h-4 w-4 text-primary" />
            Call pupil
          </button>
          <button
            onClick={handleText}
            disabled={!pupilPhone}
            className="flex items-center justify-center gap-2 py-3.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors disabled:opacity-40 border-r border-border/60"
          >
            <MessageSquare className="h-4 w-4 text-primary" />
            Message
          </button>
          <button
            onClick={() => {}}
            className="flex items-center justify-center gap-2 py-3.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="h-4 w-4 text-destructive" />
            Cancel
          </button>
        </div>
      </div>
    </motion.div>
  );
}
