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

export function CourseCardSplitVariant({ instructor, course }: Props) {
  const brand = instructor.brand_colour ?? "#1e3a5f";
  const price = computePrice(course, instructor.hourly_rate);
  const initials = instructor.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
  const date = course.available_from ? parseISO(course.available_from) : null;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden flex shadow-sm hover:shadow-md transition-shadow">
      {/* Left rail */}
      <div className="w-[150px] shrink-0 p-3 flex flex-col gap-2" style={{ backgroundColor: `${brand}10` }}>
        <Avatar className="h-14 w-14">
          <AvatarImage src={instructor.profile_image_url ?? undefined} />
          <AvatarFallback style={{ backgroundColor: brand, color: "white" }} className="font-bold">{initials}</AvatarFallback>
        </Avatar>
        <div className="text-sm font-semibold text-foreground leading-tight">{instructor.name}</div>
        <InstructorSignalRow instructorId={instructor.id} snippetClamp={2} />
      </div>

      {/* Right body */}
      <div className="flex-1 min-w-0 p-3 flex flex-col justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-semibold text-foreground">{course.course_name}</span>
            {course.is_intensive && (
              <Badge variant="secondary" className="text-[10px] gap-0.5">
                <Zap className="h-3 w-3" /> Intensive
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{course.course_hours}h</span>
            {date && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(date, "d MMM")}</span>}
          </div>
        </div>
        <div className="flex items-end justify-between">
          {price != null && <div className="text-lg font-bold text-foreground">£{price.toFixed(0)}</div>}
          <Button size="sm" className="h-8" style={{ backgroundColor: brand }}>Book</Button>
        </div>
      </div>
    </div>
  );
}
