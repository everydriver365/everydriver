import { motion } from "framer-motion";
import {
  Clock,
  AlertTriangle,
  PoundSterling,
  ClipboardList,
  MapPin,
  BookOpen,
  Sun,
  Cloud,
  CloudSun,
  CloudRain,
  CloudDrizzle,
  CloudSnow,
  CloudFog,
  CloudLightning,
  Snowflake,
} from "lucide-react";
import calendarIcon from "@/assets/calendar-icon.png";
import { format, parse, addDays } from "date-fns";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTomorrowWeather } from "@/hooks/useTomorrowWeather";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TomorrowLesson {
  id: string;
  pupilName: string;
  pupilPhone?: string | null;
  pickupPostcode?: string | null;
  startTime: string;
  durationMinutes: number;
}

interface TomorrowPreviewCardProps {
  lessonCount: number;
  totalHours: number;
  expectedEarnings: number;
  firstLessonTime: string | null;
  lastLessonTime: string | null;
  hasGaps: boolean;
  instructorId?: string;
  className?: string;
  lessons?: TomorrowLesson[];
}

const weatherIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Sun, Cloud, CloudSun, CloudRain, CloudDrizzle, CloudSnow, CloudFog, CloudLightning, Snowflake,
};

export function TomorrowPreviewCard({
  lessonCount,
  totalHours,
  expectedEarnings,
  firstLessonTime,
  lastLessonTime,
  hasGaps,
  instructorId,
  className = "",
  lessons = [],
}: TomorrowPreviewCardProps) {
  const tomorrow = addDays(new Date(), 1);
  const dayName = format(tomorrow, "EEEE");
  const dateStr = format(tomorrow, "d MMM");

  const { data: coords } = useQuery({
    queryKey: ["instructor-coords", instructorId],
    queryFn: async () => {
      if (!instructorId) return null;
      const { data } = await supabase
        .from("instructors")
        .select("lat, lng")
        .eq("id", instructorId)
        .single();
      return data;
    },
    enabled: !!instructorId,
    staleTime: 60 * 60 * 1000,
  });

  const { data: weather } = useTomorrowWeather(coords?.lat, coords?.lng);
  const WeatherIcon = weather ? weatherIcons[weather.icon] || Cloud : null;

  const formatTime = (time: string | null) => {
    if (!time) return "—";
    try {
      return format(parse(time, "HH:mm:ss", new Date()), "h:mm a");
    } catch {
      return time;
    }
  };

  // Empty state
  if (lessonCount === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mx-4 ${className}`}
      >
        <div className="rounded-2xl border border-border bg-card shadow-md p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary">Tomorrow</p>
              <p className="text-sm text-muted-foreground">{dayName} {dateStr}</p>
            </div>
            {weather && WeatherIcon && (
              <div className="flex items-center gap-1 bg-muted rounded-full px-2.5 py-1">
                <WeatherIcon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground">{weather.temperature}°</span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-center gap-2 mb-4 bg-amber-50/80 dark:bg-amber-950/30 rounded-2xl px-4 py-3 border border-amber-100/50 dark:border-amber-800/30">
            <span className="text-lg">☕</span>
            <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Enjoy a well-deserved break</span>
            <span className="text-lg">☕</span>
          </div>
          <div className="flex gap-3">
            <Link to="/instructor/schedule" className="flex-1">
              <Button variant="outline" size="default" className="w-full gap-2 h-12 rounded-2xl font-semibold">
                <img src={calendarIcon} alt="Calendar" className="h-5 w-5" />
                View Schedule
              </Button>
            </Link>
            <Link to="/instructor/gaps" className="flex-1">
              <Button size="default" className="w-full gap-2 h-12 rounded-2xl font-semibold">
                <ClipboardList className="h-5 w-5" />
                Check Waitlist
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mx-4 ${className}`}
    >
      <Link to="/instructor/schedule">
        <div className="rounded-2xl border border-border bg-card shadow-md p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary">Tomorrow</p>
              <p className="text-sm text-muted-foreground">{dayName} {dateStr}</p>
            </div>
            <div className="flex items-center gap-2">
              {weather && WeatherIcon && (
                <div className="flex items-center gap-1 bg-muted rounded-full px-2.5 py-1">
                  <WeatherIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold text-foreground">{weather.temperature}°</span>
                </div>
              )}
              {hasGaps && (
                <div className="flex items-center gap-1 bg-amber-500 text-white rounded-full px-2 py-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span className="text-[10px] font-medium">Gaps</span>
                </div>
              )}
              <span className="text-xs font-semibold text-foreground">{totalHours}h</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">£{expectedEarnings}</span>
            </div>
          </div>

          {/* Timeline */}
          {lessons.length > 0 && (
            <div className="relative pl-6">
              {/* Timeline line */}
              <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-primary/20" />

              {lessons.map((l) => (
                <div key={l.id} className="relative flex items-start gap-3 pb-4 last:pb-0">
                  {/* Node */}
                  <div className="absolute left-[-15px] top-1.5 w-3 h-3 rounded-full bg-primary border-2 border-primary/30" />
                  <div className="flex-1 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">{l.pupilName}</span>
                        <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                          {l.durationMinutes}m
                        </span>
                      </div>
                      {l.pickupPostcode && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{l.pickupPostcode}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-mono font-bold text-foreground">{formatTime(l.startTime)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
