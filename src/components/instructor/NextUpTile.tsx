import { useState } from "react";
import { format, parse, isToday, isTomorrow, parseISO } from "date-fns";
import { Clock, MessageSquare, Phone, Navigation, Check, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
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
              {(pickupLocation || pickupPostcode) && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                  <Navigation className="h-3 w-3 shrink-0" />
                  {pickupLocation && <span className="truncate">{pickupLocation}</span>}
                  {pickupLocation && pickupPostcode && <span className="text-muted-foreground/50">·</span>}
                  {pickupPostcode && <span className="shrink-0">{pickupPostcode}</span>}
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

        {/* Expandable quick actions */}
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
            <div className="px-4 pb-3">
              <div className="flex items-center justify-between gap-2">
                {pickupPostcode && (
                  <button onClick={handleNavigate} className="flex flex-col items-center gap-1.5 flex-1 py-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="h-10 w-10 rounded-lg border border-border bg-background flex items-center justify-center">
                      <Navigation className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground">Nav</span>
                  </button>
                )}
                {pupilPhone && (
                  <>
                    <button onClick={handleCall} className="flex flex-col items-center gap-1.5 flex-1 py-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="h-10 w-10 rounded-lg border border-border bg-background flex items-center justify-center">
                        <Phone className="h-4 w-4 text-emerald-600" />
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground">Call</span>
                    </button>
                    <button onClick={handleText} className="flex flex-col items-center gap-1.5 flex-1 py-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="h-10 w-10 rounded-lg border border-border bg-background flex items-center justify-center">
                        <MessageSquare className="h-4 w-4 text-foreground" />
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground">Text</span>
                    </button>
                    <button onClick={handleOnMyWay} className="flex flex-col items-center gap-1.5 flex-1 py-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="h-10 w-10 rounded-lg border border-border bg-background flex items-center justify-center">
                        <Check className="h-4 w-4 text-amber-500" />
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground">On Way</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </motion.div>
  );
}
