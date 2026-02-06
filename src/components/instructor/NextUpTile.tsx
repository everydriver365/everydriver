import { useState } from "react";
import { format, parse, isToday, isTomorrow, parseISO } from "date-fns";
import { Clock, MessageSquare, Phone, Navigation, Check, Car, Loader2, Mail } from "lucide-react";
import { motion, useMotionValue, useTransform, useAnimation, PanInfo } from "framer-motion";
import { PupilAvatar } from "./PupilAvatar";
import { PaymentStatusBadge } from "./PaymentStatusBadge";
import { PostcodeMapPreview } from "./PostcodeMapPreview";
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

const SWIPE_THRESHOLD = 80;
const ACTION_WIDTH = 240;

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
  const [isRevealed, setIsRevealed] = useState(false);
  const x = useMotionValue(0);
  const controls = useAnimation();
  const actionOpacity = useTransform(x, [-ACTION_WIDTH, -SWIPE_THRESHOLD, 0], [1, 0.8, 0]);

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
    if (isToday(date)) return null;
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEE d MMM");
  };

  const getCountdownText = () => {
    if (minutesUntil <= 0) return "Now";
    if (minutesUntil < 60) return `${minutesUntil}m`;
    const hours = Math.floor(minutesUntil / 60);
    const mins = minutesUntil % 60;
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      return `${days}d`;
    }
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const dateLabel = getDateLabel();

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

  const handleOnMyWay = () => {
    if (pupilPhone) {
      const firstName = pupilName.split(" ")[0];
      const message = encodeURIComponent(`Hi ${firstName}, I'm on my way to you!`);
      window.open(`sms:${pupilPhone}?body=${message}`, "_self");
    }
  };

  const handleCall = () => {
    if (pupilPhone) {
      window.open(`tel:${pupilPhone}`, "_self");
    }
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x < -SWIPE_THRESHOLD) {
      controls.start({ x: -ACTION_WIDTH });
      setIsRevealed(true);
    } else {
      controls.start({ x: 0 });
      setIsRevealed(false);
    }
  };

  const closeActions = () => {
    controls.start({ x: 0 });
    setIsRevealed(false);
  };

  const effectiveBalance = prepaidHours > 0 ? prepaidHours * 40 : accountBalance;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4"
    >
      <div className="relative overflow-hidden rounded-xl border border-border shadow-[0_2px_8px_rgba(20,37,66,0.08)]">
        {/* Action buttons revealed behind */}
        <motion.div
          style={{ opacity: actionOpacity }}
          className="absolute inset-y-0 right-0 flex items-stretch z-0"
        >
          <div className="flex items-stretch">
            {pickupPostcode && (
              <button
                onClick={() => { handleNavigate(); closeActions(); }}
                className="w-[60px] flex flex-col items-center justify-center gap-1 bg-primary text-white"
              >
                <Navigation className="h-5 w-5" />
                <span className="text-[9px] font-medium">Nav</span>
              </button>
            )}
            {pupilPhone && (
              <>
                <button
                  onClick={() => { handleCall(); closeActions(); }}
                  className="w-[60px] flex flex-col items-center justify-center gap-1 bg-emerald-500 text-white"
                >
                  <Phone className="h-5 w-5" />
                  <span className="text-[9px] font-medium">Call</span>
                </button>
                <button
                  onClick={() => { handleText(); closeActions(); }}
                  className="w-[60px] flex flex-col items-center justify-center gap-1 bg-slate-600 text-white"
                >
                  <MessageSquare className="h-5 w-5" />
                  <span className="text-[9px] font-medium">Text</span>
                </button>
                <button
                  onClick={() => { handleOnMyWay(); closeActions(); }}
                  className="w-[60px] flex flex-col items-center justify-center gap-1 bg-amber-500 text-white"
                >
                  <Check className="h-5 w-5" />
                  <span className="text-[9px] font-medium">On Way</span>
                </button>
              </>
            )}
          </div>
        </motion.div>

        {/* Swipeable foreground card */}
        <motion.div
          drag="x"
          dragConstraints={{ left: -ACTION_WIDTH, right: 0 }}
          dragElastic={0.1}
          onDragEnd={handleDragEnd}
          animate={controls}
          style={{ x }}
          className="relative z-10 bg-white touch-pan-y"
        >
          {/* Accent bar */}
          <div className={`h-1.5 ${
            minutesUntil <= 15 
              ? 'bg-gradient-to-r from-amber-400 via-orange-400 to-red-400' 
              : 'bg-gradient-to-r from-primary via-blue-400 to-cyan-400'
          }`} />

          {/* Header */}
          <div className="px-4 pt-3 pb-2">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                <motion.span
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  className={`inline-block h-2 w-2 rounded-full ${
                    minutesUntil <= 15 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                />
                Next up
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                minutesUntil <= 15 
                  ? 'bg-gradient-to-r from-amber-500/15 to-orange-500/15 text-amber-600' 
                  : 'bg-primary/10 text-primary'
              }`}>
                <Clock className="h-3 w-3 inline mr-1" />
                {dateLabel ? `${dateLabel} · ` : ''}{formatTime(startTime)}
              </span>
            </div>

            {/* Pupil row */}
            <div className="flex items-center gap-3">
              <PupilAvatar 
                name={pupilName} 
                imageUrl={pupilProfileImage} 
                size="md" 
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm truncate">{pupilName}</p>
                {pickupLocation && (
                  <p className="text-sm text-foreground mt-0.5 truncate">
                    {pickupLocation}
                  </p>
                )}
                {pickupPostcode && (
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                    <span>{pickupPostcode}</span>
                    {etaLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : etaMinutes > 0 ? (
                      <span className={`flex items-center gap-1 font-medium ${
                        etaMinutes >= minutesUntil 
                          ? 'text-destructive' 
                          : etaMinutes >= minutesUntil - 10
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}>
                        <Car className="h-3 w-3" />
                        {etaText}
                        {trafficCondition && trafficCondition !== 'clear' && (
                          <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            trafficCondition === 'heavy' 
                              ? 'bg-red-100 text-red-700' 
                              : trafficCondition === 'moderate'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-yellow-50 text-yellow-700'
                          }`}>
                            {trafficCondition === 'heavy' ? '🔴 Heavy' : trafficCondition === 'moderate' ? '🟡 Moderate' : '🟢 Light'}
                          </span>
                        )}
                        {trafficCondition === 'clear' && (
                          <span className="ml-1 text-[10px] text-emerald-500 font-medium">✓ Clear</span>
                        )}
                      </span>
                    ) : null}
                  </p>
                )}
                <div className="mt-1">
                  <PaymentStatusBadge 
                    balance={effectiveBalance} 
                    size="sm" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Unread message alert */}
          {pupilUnreadCount > 0 && (
            <div className="mx-4 mb-2 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 border border-destructive/20">
              <Mail className="h-4 w-4 text-destructive shrink-0" />
              <span className="text-xs font-medium text-destructive">
                {pupilUnreadCount} unread message{pupilUnreadCount !== 1 ? 's' : ''} from {pupilName.split(" ")[0]}
              </span>
            </div>
          )}

          {/* Mini map */}
          {pickupPostcode && (
            <div className="px-4 pb-2">
              <PostcodeMapPreview
                postcode={pickupPostcode}
                onClick={handleNavigate}
                className="mt-1"
              />
            </div>
          )}

          {/* Swipe hint */}
          <div className="flex items-center justify-center py-2 border-t border-border">
            <span className="text-[10px] text-muted-foreground/60 font-medium">
              ← Swipe for actions
            </span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
