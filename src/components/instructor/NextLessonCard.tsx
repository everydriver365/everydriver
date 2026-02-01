import { Clock, MapPin, MessageSquare, Navigation } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { format, parse } from "date-fns";

interface NextLessonCardProps {
  pupilName: string;
  pupilProfileImage: string | null;
  pupilPhone: string | null;
  pickupPostcode: string | null;
  pickupLocation: string | null;
  startTime: string;
  minutesUntil: number;
}

export function NextLessonCard({
  pupilName,
  pupilProfileImage,
  pupilPhone,
  pickupPostcode,
  pickupLocation,
  startTime,
  minutesUntil,
}: NextLessonCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (time: string) => {
    try {
      const parsed = parse(time, "HH:mm:ss", new Date());
      return format(parsed, "h:mm a");
    } catch {
      return time;
    }
  };

  const getCountdownText = () => {
    if (minutesUntil <= 0) return "Starting now";
    if (minutesUntil < 60) return `In ${minutesUntil} min`;
    const hours = Math.floor(minutesUntil / 60);
    const mins = minutesUntil % 60;
    return `In ${hours}h ${mins}m`;
  };

  const handleNavigate = () => {
    if (pickupPostcode) {
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pickupPostcode)}`;
      window.open(mapsUrl, "_blank");
    }
  };

  const handleSendSMS = () => {
    if (pupilPhone) {
      const message = encodeURIComponent("Hi, I'm on my way!");
      window.open(`sms:${pupilPhone}?body=${message}`, "_self");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mb-4"
    >
      <div className="bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 rounded-xl border border-primary/20 p-3 shadow-sm">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <Avatar className="h-11 w-11 border-2 border-primary/20">
            <AvatarImage src={pupilProfileImage || undefined} alt={pupilName} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
              {getInitials(pupilName)}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground text-sm truncate">
                {pupilName}
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                minutesUntil <= 15 
                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' 
                  : 'bg-primary/15 text-primary'
              }`}>
                {getCountdownText()}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
              <Clock className="h-3 w-3" />
              <span>{formatTime(startTime)}</span>
              {pickupPostcode && (
                <>
                  <span className="text-muted-foreground/50">•</span>
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{pickupPostcode}</span>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {pickupPostcode && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary"
                onClick={handleNavigate}
              >
                <Navigation className="h-4 w-4" />
              </Button>
            )}
            {pupilPhone && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                onClick={handleSendSMS}
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
