import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Zap } from "lucide-react";
import { format, parseISO } from "date-fns";
import { InstructorSignalRow } from "./InstructorSignalRow";
import { computePrice, type DemoCourse, type DemoInstructor } from "./types";

interface Props {
  instructor: DemoInstructor;
  course: DemoCourse;
}

export function CourseCardHeroVariant({ instructor, course }: Props) {
  const brand = instructor.brand_colour ?? "#1e3a5f";
  const price = computePrice(course, instructor.hourly_rate);
  const initials = instructor.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
  const date = course.available_from ? parseISO(course.available_from) : null;

  return (
    <div className="rounded-2xl overflow-hidden border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
      {/* Instructor hero band */}
      <div className="p-4 text-white" style={{ backgroundColor: brand }}>
        <div className="flex items-start gap-3">
          <Avatar className="h-16 w-16 ring-2 ring-white/30 shrink-0">
            <AvatarImage src={instructor.profile_image_url ?? undefined} />
            <AvatarFallback style={{ backgroundColor: "rgba(255,255,255,0.2)" }} className="text-white font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold leading-tight truncate">{instructor.name}</h3>
            <InstructorSignalRow instructorId={instructor.id} tone="dark" snippetClamp={1} className="mt-1" />
          </div>
        </div>
      </div>

      {/* Course footer strip */}
      <div className="p-3 bg-card flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-semibold text-foreground truncate">{course.course_name}</span>
            {course.is_intensive && (
              <Badge variant="secondary" className="text-[10px] gap-0.5">
                <Zap className="h-3 w-3" /> Intensive
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{course.course_hours}h</span>
            {date && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(date, "d MMM")}</span>}
          </div>
        </div>
        <div className="text-right shrink-0">
          {price != null && <div className="text-base font-bold text-foreground">£{price.toFixed(0)}</div>}
          <Button size="sm" className="mt-1 h-7 text-xs" style={{ backgroundColor: brand }}>Book</Button>
        </div>
      </div>
    </div>
  );
}
