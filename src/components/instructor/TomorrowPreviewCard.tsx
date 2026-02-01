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
        <div className="bg-gradient-to-br from-slate-100 via-blue-50/50 to-indigo-50/30 dark:from-slate-800 dark:via-blue-950/30 dark:to-indigo-950/20 rounded-3xl border border-slate-200/80 dark:border-slate-700/50 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 flex items-center justify-center shadow-sm">
              <Calendar className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-bold text-slate-800 dark:text-slate-100 text-lg">{dayName}'s Schedule</p>
                {weather && WeatherIcon && (
                  <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-700/50 rounded-full px-2.5 py-1 shadow-sm border border-slate-100 dark:border-slate-600">
                    <WeatherIcon className="h-4 w-4" />
                    <span className="text-sm font-semibold">{weather.temperature}°</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">No lessons booked yet</p>
            </div>
          </div>
          
          {/* Quiet day tip */}
          <div className="flex items-center justify-center gap-2 mb-4 bg-amber-50/80 dark:bg-amber-950/30 rounded-2xl px-4 py-3 border border-amber-100/50 dark:border-amber-800/30">
            <span className="text-lg">☕</span>
            <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Enjoy a well-deserved break</span>
            <span className="text-lg">☕</span>
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-3">
            <Link to="/instructor/schedule" className="flex-1">
              <Button variant="outline" size="default" className="w-full gap-2 h-12 rounded-2xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm font-semibold text-slate-700 dark:text-slate-200">
                <Calendar className="h-5 w-5" />
                View Schedule
              </Button>
            </Link>
            <Link to="/instructor/gaps" className="flex-1">
              <Button size="default" className="w-full gap-2 h-12 rounded-2xl bg-blue-400 hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-md font-semibold">
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
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-blue-700 dark:to-indigo-800 rounded-2xl p-5 shadow-lg shadow-blue-500/20">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-white text-lg">{dayName}</span>
                <p className="text-blue-100 text-xs">{dateStr}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Weather display */}
              {weather && WeatherIcon && (
                <div className="flex items-center gap-1.5 text-white bg-white/20 rounded-full px-3 py-1">
                  <WeatherIcon className="h-4 w-4" />
                  <span className="text-sm font-semibold">{weather.temperature}°</span>
                </div>
              )}
              {hasGaps && (
                <div className="flex items-center gap-1 bg-amber-500 text-white rounded-full px-2 py-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span className="text-[10px] font-medium">Has gaps</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 bg-white/10 rounded-xl p-3">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-white">{lessonCount}</span>
              <span className="text-xs text-blue-100">
                Lesson{lessonCount !== 1 ? "s" : ""}
              </span>
            </div>
            
            <div className="flex flex-col items-center border-x border-white/20">
              <div className="flex items-center gap-1 text-white">
                <Clock className="h-4 w-4" />
                <span className="text-2xl font-bold">{totalHours}</span>
              </div>
              <span className="text-xs text-blue-100">Hours</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-white">
                <PoundSterling className="h-4 w-4" />
                <span className="text-2xl font-bold">{expectedEarnings}</span>
              </div>
              <span className="text-xs text-blue-100">Expected</span>
            </div>
          </div>

          {/* Time range */}
          {firstLessonTime && lastLessonTime && (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-blue-100">
                {formatTime(firstLessonTime)} — {formatTime(lastLessonTime)}
              </span>
              <div className="flex items-center gap-1 text-white">
                <span className="text-xs font-medium">View</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
