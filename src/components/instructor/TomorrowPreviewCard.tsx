import { motion } from "framer-motion";
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  ChevronRight, 
  PoundSterling, 
  Sunrise,
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
  Sparkles
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
  const dateStr = format(tomorrow, "d MMMM");

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
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/80 dark:to-slate-900/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/50 p-5">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{dayName}</h3>
                  <p className="text-xs text-muted-foreground">{dateStr}</p>
                </div>
              </div>
              {weather && WeatherIcon && (
                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 rounded-full px-3 py-1.5 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
                  <WeatherIcon className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-semibold text-foreground">{weather.temperature}°</span>
                </div>
              )}
            </div>

            {/* Empty message */}
            <div className="flex items-center gap-3 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 mb-4 border border-slate-200/50 dark:border-slate-700/30">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Sunrise className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">Day Off</p>
                <p className="text-xs text-muted-foreground">No lessons scheduled</p>
              </div>
            </div>

            {/* Action */}
            <Link to="/instructor/schedule">
              <Button variant="outline" size="sm" className="w-full gap-2 h-9">
                <Calendar className="h-4 w-4" />
                View Full Schedule
                <ChevronRight className="h-4 w-4 ml-auto" />
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  // Has lessons state
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mx-4 ${className}`}
    >
      <Link to="/instructor/schedule">
        <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/90 dark:from-primary/95 dark:via-primary/85 dark:to-primary/80 rounded-2xl shadow-lg shadow-primary/25">
          {/* Decorative glow */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
          
          <div className="relative p-5">
            {/* Header row */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-lg">{dayName}</h3>
                    {hasGaps && (
                      <span className="flex items-center gap-1 bg-amber-400/90 text-amber-900 rounded-full px-2 py-0.5 text-[10px] font-semibold">
                        <AlertTriangle className="h-3 w-3" />
                        Gap
                      </span>
                    )}
                  </div>
                  <p className="text-white/70 text-sm">{dateStr}</p>
                </div>
              </div>
              
              {/* Weather badge */}
              {weather && WeatherIcon && (
                <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/10">
                  <WeatherIcon className="h-4 w-4 text-white" />
                  <span className="text-sm font-bold text-white">{weather.temperature}°</span>
                </div>
              )}
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {/* Lessons */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <BookOpen className="h-4 w-4 text-white/80" />
                  <span className="text-2xl font-bold text-white">{lessonCount}</span>
                </div>
                <p className="text-[11px] text-white/60 font-medium uppercase tracking-wide">
                  Lesson{lessonCount !== 1 ? "s" : ""}
                </p>
              </div>

              {/* Hours */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Clock className="h-4 w-4 text-white/80" />
                  <span className="text-2xl font-bold text-white">{totalHours}</span>
                </div>
                <p className="text-[11px] text-white/60 font-medium uppercase tracking-wide">Hours</p>
              </div>

              {/* Earnings */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <PoundSterling className="h-4 w-4 text-white/80" />
                  <span className="text-2xl font-bold text-white">{expectedEarnings}</span>
                </div>
                <p className="text-[11px] text-white/60 font-medium uppercase tracking-wide">Expected</p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-white/50" />
                <span className="text-sm text-white/70">
                  {formatTime(firstLessonTime)} — {formatTime(lastLessonTime)}
                </span>
              </div>
              <div className="flex items-center gap-1 text-white font-medium text-sm">
                <span>View</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
