import { motion } from "framer-motion";
import { Clock, Car, MapPin, AlertTriangle } from "lucide-react";
import { format, parse, differenceInMinutes } from "date-fns";
import { SmartAvatar } from "@/components/ui/SmartAvatar";

interface TimelineLesson {
  id: string;
  lesson_date: string;
  start_time: string;
  duration_minutes: number;
  lesson_type: string;
  pickup_location: string | null;
  pickup_postcode: string | null;
  status: string;
  pupil: {
    id: string;
    name: string;
    phone: string | null;
    account_balance?: number;
    test_date?: string | null;
    profile_image_url?: string | null;
  };
}

interface TravelGap {
  durationMinutes: number;
  status: "ok" | "tight" | "warning";
}

interface VerticalTimelineViewProps {
  lessons: TimelineLesson[];
  travelTimes?: Map<string, TravelGap>;
  onLessonClick?: (lesson: TimelineLesson) => void;
}

const formatTime = (time: string) => {
  try {
    const parsed = parse(time, "HH:mm:ss", new Date());
    return format(parsed, "HH:mm");
  } catch {
    return time.slice(0, 5);
  }
};

const getEndTime = (startTime: string, durationMinutes: number) => {
  try {
    const parsed = parse(startTime, "HH:mm:ss", new Date());
    const endDate = new Date(parsed.getTime() + durationMinutes * 60000);
    return format(endDate, "HH:mm");
  } catch {
    return "";
  }
};

const getGapBetweenLessons = (lesson1: TimelineLesson, lesson2: TimelineLesson): number => {
  try {
    const end1 = parse(lesson1.start_time, "HH:mm:ss", new Date());
    const endTime = new Date(end1.getTime() + lesson1.duration_minutes * 60000);
    const start2 = parse(lesson2.start_time, "HH:mm:ss", new Date());
    return differenceInMinutes(start2, endTime);
  } catch {
    return 0;
  }
};

export function VerticalTimelineView({
  lessons,
  travelTimes = new Map(),
  onLessonClick,
}: VerticalTimelineViewProps) {
  if (lessons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Clock className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground font-medium">No lessons today</p>
      </div>
    );
  }

  return (
    <div className="relative pl-6">
      {/* Vertical timeline track */}
      <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-border" />

      {lessons.map((lesson, index) => {
        const nextLesson = lessons[index + 1];
        const gapMinutes = nextLesson ? getGapBetweenLessons(lesson, nextLesson) : 0;
        const travelKey = nextLesson ? `${lesson.id}-${nextLesson.id}` : null;
        const travelInfo = travelKey ? travelTimes.get(travelKey) : null;
        
        // Check if pupil owes money
        const owesAmount = lesson.pupil.account_balance || 0;
        const hasTestSoon = lesson.pupil.test_date ? 
          new Date(lesson.pupil.test_date).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000 : false;

        return (
          <motion.div
            key={lesson.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            {/* Time marker */}
            <div className="flex items-start gap-3 relative">
              {/* Timeline dot */}
              <div className="absolute left-[-15px] mt-1">
                <div className="w-3 h-3 rounded-full bg-primary border-2 border-background shadow-sm" />
              </div>
              
              {/* Time label */}
              <div className="w-12 text-right shrink-0">
                <span className="text-xs font-medium text-foreground">
                  {formatTime(lesson.start_time)}
                </span>
              </div>
              
              {/* Lesson Card */}
              <motion.div
                onClick={() => onLessonClick?.(lesson)}
                className="flex-1 bg-card rounded-2xl border border-border p-3 cursor-pointer
                  hover:border-primary/30 hover:shadow-sm transition-all"
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-start gap-3">
                  <SmartAvatar
                    name={lesson.pupil.name}
                    imageUrl={lesson.pupil.profile_image_url}
                    size="sm"
                    owesAmount={owesAmount}
                    testDateSoon={hasTestSoon}
                    hasLessonToday={true}
                    showBadge={true}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm text-foreground truncate">
                        {lesson.pupil.name}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {lesson.duration_minutes / 60}h
                      </span>
                    </div>
                    
                    {lesson.pickup_postcode && (
                      <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{lesson.pickup_postcode}</span>
                      </div>
                    )}
                    
                    <div className="text-[10px] text-muted-foreground/70 mt-0.5">
                      {formatTime(lesson.start_time)} - {getEndTime(lesson.start_time, lesson.duration_minutes)}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
            
            {/* Travel Gap Indicator */}
            {nextLesson && gapMinutes > 0 && (
              <div className="flex items-start gap-3 my-1 relative">
                {/* Timeline connector */}
                <div className="absolute left-[-15px] top-0 bottom-0 flex items-center">
                  <div className={`w-0.5 h-full ${
                    travelInfo?.status === "warning" ? "bg-destructive/50" :
                    travelInfo?.status === "tight" ? "bg-amber-500/50" :
                    "bg-emerald-500/50"
                  }`} />
                </div>
                
                <div className="w-12" />
                
                <div className={`flex-1 py-2 px-3 rounded-2xl text-xs ${
                  travelInfo?.status === "warning" ? "bg-destructive/10 text-destructive" :
                  travelInfo?.status === "tight" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" :
                  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                }`}>
                  <div className="flex items-center gap-2">
                    <Car className="h-3.5 w-3.5" />
                    <span className="font-medium">
                      {travelInfo ? `~${travelInfo.durationMinutes} min drive` : `${gapMinutes} min gap`}
                    </span>
                    {travelInfo?.status === "warning" && (
                      <AlertTriangle className="h-3.5 w-3.5" />
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* End time marker for last lesson */}
            {!nextLesson && (
              <div className="flex items-start gap-3 relative mt-2">
                <div className="absolute left-[-15px]">
                  <div className="w-3 h-3 rounded-full bg-muted-foreground/30 border-2 border-background" />
                </div>
                <div className="w-12 text-right">
                  <span className="text-xs text-muted-foreground">
                    {getEndTime(lesson.start_time, lesson.duration_minutes)}
                  </span>
                </div>
                <div className="flex-1 text-xs text-muted-foreground">
                  Day ends
                </div>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
