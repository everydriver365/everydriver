import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  AlertTriangle,
  PoundSterling,
  ClipboardList,
  MapPin,
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
  const dayShort = format(tomorrow, "EEE").toUpperCase();
  const dayNum = format(tomorrow, "d");
  const month = format(tomorrow, "MMM").toUpperCase();

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
        <div className="rounded-2xl border border-border bg-card shadow-md overflow-hidden">
          <div className="bg-primary text-primary-foreground p-4 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-80">{month}</p>
            <p className="text-5xl font-black leading-none mt-1">{dayNum}</p>
            <p className="text-sm font-semibold opacity-80 mt-1">{dayShort}</p>
          </div>
          <div className="p-5 text-center">
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
        <div className="rounded-2xl border border-border bg-card shadow-md overflow-hidden">
          {/* Calendar header */}
          <div className="bg-primary text-primary-foreground p-4 text-center relative">
            <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-80">{month}</p>
            <p className="text-5xl font-black leading-none mt-1">{dayNum}</p>
            <p className="text-sm font-semibold opacity-80 mt-1">{dayShort}</p>

            {/* Weather badge */}
            {weather && WeatherIcon && (
              <div className="absolute top-3 right-3 flex items-center gap-1 bg-primary-foreground/15 backdrop-blur-sm rounded-full px-2.5 py-1">
                <WeatherIcon className="h-3.5 w-3.5 text-primary-foreground" />
                <span className="text-xs font-semibold text-primary-foreground">{weather.temperature}°</span>
              </div>
            )}

            {/* Gaps warning */}
            {hasGaps && (
              <div className="absolute top-3 left-3 flex items-center gap-1 bg-amber-500 text-white rounded-full px-2 py-1">
                <AlertTriangle className="h-3 w-3" />
                <span className="text-[10px] font-medium">Gaps</span>
              </div>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
            {[
              { label: "Lessons", value: lessonCount },
              { label: "Hours", value: totalHours },
              { label: "Earnings", value: `£${expectedEarnings}` },
            ].map((s, i) => (
              <div key={i} className="py-3 text-center">
                <p className="text-lg font-bold text-foreground">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Lesson list */}
          {lessons.length > 0 && (
            <div className="p-3 space-y-1">
              {lessons.map((l) => (
                <div key={l.id} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="w-1 h-8 rounded-full bg-primary/60" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{l.pupilName}</p>
                      {l.pickupPostcode && (
                        <div className="flex items-center gap-0.5">
                          <MapPin className="h-2.5 w-2.5 text-muted-foreground" />
                          <p className="text-[10px] text-muted-foreground">{l.pickupPostcode}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-bold text-foreground">{formatTime(l.startTime)}</p>
                    <p className="text-[10px] text-muted-foreground">{l.durationMinutes}m</p>
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
