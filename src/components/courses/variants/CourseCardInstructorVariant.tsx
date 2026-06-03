import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { InstructorSignalRow } from "./InstructorSignalRow";
import { computePrice, type DemoCourse, type DemoInstructor } from "./types";

interface Props {
  instructor: DemoInstructor;
  courses: DemoCourse[];
}

export function CourseCardInstructorVariant({ instructor, courses }: Props) {
  const brand = instructor.brand_colour ?? "#1e3a5f";
  const initials = instructor.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
  const prices = courses.map((c) => computePrice(c, instructor.hourly_rate)).filter((p): p is number => p != null);
  const fromPrice = prices.length ? Math.min(...prices) : null;
  const sorted = [...courses].sort((a, b) => a.course_hours - b.course_hours);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4 flex items-start gap-3" style={{ backgroundColor: `${brand}12` }}>
        <Avatar className="h-16 w-16 shrink-0 ring-2 ring-white">
          <AvatarImage src={instructor.profile_image_url ?? undefined} />
          <AvatarFallback style={{ backgroundColor: brand, color: "white" }} className="font-bold">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-foreground leading-tight">{instructor.name}</h3>
          {instructor.home_postcode && (
            <p className="text-xs text-muted-foreground mt-0.5">{instructor.home_postcode}</p>
          )}
          <InstructorSignalRow instructorId={instructor.id} snippetClamp={2} className="mt-1.5" />
        </div>
      </div>

      {/* Course chips */}
      <div className="p-4 space-y-2.5">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Choose a course
        </div>
        <div className="flex flex-wrap gap-2">
          {sorted.map((c) => {
            const price = computePrice(c, instructor.hourly_rate);
            return (
              <button
                key={c.id}
                type="button"
                className="rounded-xl border border-border bg-background px-3 py-2 text-left hover:border-foreground/30 hover:shadow-sm transition-all min-w-[88px]"
              >
                <div className="text-xs text-muted-foreground">{c.course_hours}h</div>
                <div className="text-sm font-bold text-foreground">
                  {price != null ? `£${price.toFixed(0)}` : "POA"}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 flex items-center justify-between">
        {fromPrice != null && (
          <div className="text-xs text-muted-foreground">
            From <span className="text-base font-bold text-foreground">£{fromPrice.toFixed(0)}</span>
          </div>
        )}
        <Button size="sm" style={{ backgroundColor: brand }}>View profile</Button>
      </div>
    </div>
  );
}
