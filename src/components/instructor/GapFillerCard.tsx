import { motion } from "framer-motion";
import { CalendarPlus, MessageSquare, Phone, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";

interface SuggestedPupil {
  id: string;
  name: string;
  phone: string | null;
  postcode: string | null;
  isWaitlisted: boolean;
}

interface GapFillerCardProps {
  date: string;
  durationMinutes: number;
  suggestedPupils: SuggestedPupil[];
  className?: string;
}

export function GapFillerCard({
  date,
  durationMinutes,
  suggestedPupils,
  className = "",
}: GapFillerCardProps) {
  const formattedDate = format(parseISO(date), "EEE d MMM");
  const hoursAvailable = Math.round(durationMinutes / 60);

  const handleSMS = (pupil: SuggestedPupil) => {
    if (!pupil.phone) return;
    const message = encodeURIComponent(
      `Hi ${pupil.name.split(" ")[0]}, I have availability on ${formattedDate}. Would you like to book a lesson?`
    );
    window.open(`sms:${pupil.phone}?body=${message}`, "_self");
  };

  if (suggestedPupils.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mx-4 ${className}`}
    >
      <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-500/15 dark:to-orange-500/15 rounded-xl border border-amber-500/20 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CalendarPlus className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span className="font-semibold text-foreground text-sm">Fill Your Gap</span>
          </div>
          <span className="text-xs bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full font-medium">
            ~{hoursAvailable}h free on {formattedDate}
          </span>
        </div>

        {/* Suggested pupils */}
        <p className="text-xs text-muted-foreground mb-2">
          Quick message these pupils:
        </p>
        
        <div className="space-y-2">
          {suggestedPupils.slice(0, 3).map((pupil) => (
            <div
              key={pupil.id}
              className="flex items-center justify-between bg-background/60 rounded-lg p-2"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                  {pupil.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {pupil.name}
                  </p>
                  {pupil.isWaitlisted && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400">
                      Waitlisted
                    </span>
                  )}
                </div>
              </div>
              
              {pupil.phone && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-primary"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSMS(pupil);
                  }}
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
