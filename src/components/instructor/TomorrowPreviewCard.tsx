import { motion } from "framer-motion";
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  ChevronRight, 
  PoundSterling, 
  Coffee, 
  ClipboardList,
  Sun,
  Cloud,
  CloudSun,
  CloudRain,
  CloudDrizzle,
  CloudSnow,
  CloudFog,
  CloudLightning,
  Snowflake
} from "lucide-react";
import { format, parse, addDays } from "date-fns";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTomorrowWeather } from "@/hooks/useTomorrowWeather";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TomorrowPreviewCardProps {
  lessonCount: number;
  totalHours: number;
  expectedEarnings: number;
  firstLessonTime: string | null;
  lastLessonTime: string | null;
  hasGaps: boolean;
  instructorId?: string;
  className?: string;
}

const weatherIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Sun,
  Cloud,
  CloudSun,
  CloudRain,
  CloudDrizzle,
  CloudSnow,
  CloudFog,
  CloudLightning,
  Snowflake,
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
}: TomorrowPreviewCardProps) {
  const tomorrow = addDays(new Date(), 1);
  const dayName = format(tomorrow, "EEEE");
  const dateStr = format(tomorrow, "d MMM");

  // Fetch instructor's coordinates
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
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  // Fetch tomorrow's weather
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

  if (lessonCount === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mx-4 ${className}`}
      >
        <div className="bg-muted/50 rounded-xl border border-dashed border-border p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground text-sm">{dayName}'s Schedule</p>
                {weather && WeatherIcon && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <WeatherIcon className="h-4 w-4" />
                    <span className="text-xs">{weather.temperature}°</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">No lessons booked yet</p>
            </div>
          </div>
          
          {/* Quiet day tip */}
          <div className="flex items-center gap-2 text-muted-foreground mb-3">
            <Coffee className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-xs">Enjoy a well-deserved break</span>
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-2">
            <Link to="/instructor/schedule" className="flex-1">
              <Button variant="outline" size="sm" className="w-full text-xs h-8 gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                View Schedule
              </Button>
            </Link>
            <Link to="/instructor/waitlist" className="flex-1">
              <Button variant="ghost" size="sm" className="w-full text-xs h-8 gap-1.5">
                <ClipboardList className="h-3.5 w-3.5" />
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
        <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-500/15 dark:to-indigo-500/15 rounded-xl border border-blue-500/20 p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="font-semibold text-foreground text-sm">{dayName}</span>
              <span className="text-xs text-muted-foreground">{dateStr}</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Weather display */}
              {weather && WeatherIcon && (
                <div className="flex items-center gap-1 text-muted-foreground bg-background/60 rounded-full px-2 py-0.5">
                  <WeatherIcon className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">{weather.temperature}°</span>
                </div>
              )}
              {hasGaps && (
                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-3 w-3" />
                  <span className="text-[10px] font-medium">Has gaps</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <span className="text-lg font-bold">{lessonCount}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                Lesson{lessonCount !== 1 ? "s" : ""}
              </span>
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                <Clock className="h-3 w-3" />
                <span className="text-lg font-bold">{totalHours}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">Hours</span>
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <PoundSterling className="h-3 w-3" />
                <span className="text-lg font-bold">{expectedEarnings}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">Expected</span>
            </div>
          </div>

          {/* Time range */}
          {firstLessonTime && lastLessonTime && (
            <div className="mt-3 pt-3 border-t border-blue-500/20 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {formatTime(firstLessonTime)} — {formatTime(lastLessonTime)}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
