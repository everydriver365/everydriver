import { useState } from "react";
import { format, parse, isToday, isTomorrow, parseISO } from "date-fns";
import { 
  Clock, MessageSquare, Phone, Navigation, X, CalendarClock, 
  ChevronDown, Send 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PupilAvatar } from "./PupilAvatar";
import { PaymentStatusBadge } from "./PaymentStatusBadge";
import { PostcodeMapPreview } from "./PostcodeMapPreview";

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
}: NextUpTileProps) {
  const [isOpen, setIsOpen] = useState(false);

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

  // Determine effective balance for badge
  const effectiveBalance = prepaidHours > 0 ? prepaidHours * 40 : accountBalance;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4"
    >
      <div className="bg-white rounded-xl border border-border shadow-[0_2px_8px_rgba(20,37,66,0.08)] overflow-hidden">
        {/* Header */}
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Next up...
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              minutesUntil <= 15 
                ? 'bg-amber-500/15 text-amber-600' 
                : 'bg-primary/10 text-primary'
            }`}>
              <Clock className="h-3 w-3 inline mr-1" />
              {dateLabel ? `${dateLabel} · ` : ''}{formatTime(startTime)} · {getCountdownText()}
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
              {pickupPostcode && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Navigation className="h-3 w-3" />
                  {pickupPostcode}
                </p>
              )}
            </div>
            <PaymentStatusBadge 
              balance={effectiveBalance} 
              size="sm" 
            />
          </div>
        </div>

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

        {/* Expandable actions */}
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border-t border-border">
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="h-4 w-4" />
              </motion.div>
              {isOpen ? "Close" : "Quick actions"}
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-4 pb-3 grid grid-cols-2 gap-2"
                >
                  {pupilPhone && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 text-xs gap-1.5"
                        onClick={handleText}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        Text
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 text-xs gap-1.5"
                        onClick={handleOnMyWay}
                      >
                        <Send className="h-3.5 w-3.5" />
                        On my way
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 text-xs gap-1.5"
                        onClick={handleCall}
                      >
                        <Phone className="h-3.5 w-3.5" />
                        Call
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 text-xs gap-1.5 text-destructive hover:text-destructive"
                    onClick={() => window.location.href = `/instructor/lessons/${lessonId}?action=cancel`}
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 text-xs gap-1.5"
                    onClick={() => window.location.href = `/instructor/lessons/${lessonId}?action=reschedule`}
                  >
                    <CalendarClock className="h-3.5 w-3.5" />
                    Rearrange
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </motion.div>
  );
}
