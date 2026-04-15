import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, CalendarX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTodayOverview } from "@/hooks/useTodayOverview";
import { format, parse } from "date-fns";

interface HomeTodayScheduleProps {
  instructorId: string | undefined;
}

export function HomeTodaySchedule({ instructorId }: HomeTodayScheduleProps) {
  const { data: overview, isLoading } = useTodayOverview(instructorId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">Today's Schedule</h3>
        <div className="bg-card rounded-2xl border p-4 animate-pulse shadow-sm">
          <div className="h-5 bg-muted rounded w-1/2" />
          <div className="h-4 bg-muted rounded w-3/4 mt-2" />
        </div>
      </div>
    );
  }

  const hasLessons = overview && overview.lessonCount > 0;

  // Parse TIME string (HH:mm:ss) from database
  const firstLessonTimeFormatted = overview?.firstLessonTime
    ? format(parse(overview.firstLessonTime, "HH:mm:ss", new Date()), "h:mm a")
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-2"
    >
      <h3 className="text-base font-semibold text-foreground">Today's Schedule</h3>
      
      <div className="bg-card rounded-2xl border p-4 shadow-sm">
        {hasLessons ? (
          <Link to={overview.firstPupilId ? `/instructor/pupils/${overview.firstPupilId}` : "/instructor/pupils"} className="block">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                  {overview.firstPupilName ? overview.firstPupilName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-foreground">
                    {overview.lessonCount} lesson{overview.lessonCount > 1 ? 's' : ''}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    • {overview.totalHours}h • £{overview.expectedEarnings}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {firstLessonTimeFormatted && (
                    <>First lesson at {firstLessonTimeFormatted}</>
                  )}
                  {overview.firstPickupPostcode && (
                    <> • {overview.firstPickupPostcode}</>
                  )}
                </p>
              </div>
            </div>
          </Link>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-muted">
                <CalendarX className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <span className="text-base font-medium text-foreground">
                  No lessons scheduled
                </span>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Your calendar is open. Students are booking now.
                </p>
              </div>
            </div>
            <Link to="/instructor/gaps">
              <Button className="w-full" variant="default">
                Fill Gaps
              </Button>
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
}
