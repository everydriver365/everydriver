import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, CalendarDays, Award, Clock, PoundSterling, BarChart3, TrendingUp, UserCheck, Users, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { demoSchoolLessons, demoSchoolPupils, demoSchoolPayments, demoSchoolTestResults, demoSchoolInstructors, demoSchoolPayroll } from "@/data/demoSchoolData";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

interface WidgetProps {
  onRemove: () => void;
}

function WidgetWrapper({ title, icon: Icon, children, onRemove }: { title: string; icon: any; children: React.ReactNode; onRemove: () => void }) {
  return (
    <Card className="relative group">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
        onClick={onRemove}
      >
        <X className="h-3.5 w-3.5 text-muted-foreground" />
      </Button>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function BookingLogWidget({ onRemove }: WidgetProps) {
  const recent = demoSchoolLessons
    .filter(l => l.status === "scheduled")
    .slice(0, 6);

  return (
    <WidgetWrapper title="Booking Log" icon={BookOpen} onRemove={onRemove}>
      <div className="space-y-2">
        {recent.map(l => (
          <div key={l.id} className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0 last:pb-0">
            <div>
              <span className="font-medium">{l.pupils?.name}</span>
              <span className="text-muted-foreground ml-2 text-xs">w/ {l.instructors?.name}</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {new Date(l.start_time).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
            </Badge>
          </div>
        ))}
      </div>
    </WidgetWrapper>
  );
}

export function UpcomingTestsWidget({ onRemove }: WidgetProps) {
  const upcoming = demoSchoolPupils
    .filter(p => p.test_date && new Date(p.test_date) > new Date())
    .sort((a, b) => new Date(a.test_date!).getTime() - new Date(b.test_date!).getTime())
    .slice(0, 5);

  return (
    <WidgetWrapper title="Upcoming Tests" icon={Award} onRemove={onRemove}>
      <div className="space-y-2">
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming tests</p>
        ) : upcoming.map(p => (
          <div key={p.id} className="flex items-center justify-between text-sm">
            <span className="font-medium">{p.name}</span>
            <Badge variant="secondary" className="text-xs">
              {format(new Date(p.test_date!), "d MMM")}
            </Badge>
          </div>
        ))}
      </div>
    </WidgetWrapper>
  );
}

export function TodaysScheduleWidget({ onRemove }: WidgetProps) {
  const todayLessons = demoSchoolLessons.filter(l => {
    const d = new Date(l.start_time);
    const now = new Date();
    return d.toDateString() === now.toDateString() && l.status === "scheduled";
  }).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  return (
    <WidgetWrapper title="Today's Schedule" icon={Clock} onRemove={onRemove}>
      <div className="space-y-2">
        {todayLessons.length === 0 ? (
          <p className="text-sm text-muted-foreground">No lessons today</p>
        ) : todayLessons.map(l => (
          <div key={l.id} className="flex items-center gap-3 text-sm">
            <span className="text-xs font-mono text-muted-foreground w-12">
              {new Date(l.start_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
            </span>
            <span className="font-medium">{l.pupils?.name}</span>
            <span className="text-xs text-muted-foreground ml-auto">{l.instructors?.name}</span>
          </div>
        ))}
      </div>
    </WidgetWrapper>
  );
}

export function RevenueByMonthWidget({ onRemove }: WidgetProps) {
  const months = useMemo(() => {
    const result: { label: string; amount: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const m = subMonths(new Date(), i);
      const start = startOfMonth(m);
      const end = endOfMonth(m);
      const total = demoSchoolPayments
        .filter(p => isWithinInterval(new Date(p.created_at), { start, end }))
        .reduce((s, p) => s + p.amount, 0);
      result.push({ label: format(m, "MMM"), amount: total });
    }
    return result;
  }, []);

  const max = Math.max(...months.map(m => m.amount), 1);

  return (
    <WidgetWrapper title="Revenue by Month" icon={PoundSterling} onRemove={onRemove}>
      <div className="flex items-end gap-2 h-32">
        {months.map(m => (
          <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] font-medium text-muted-foreground">£{m.amount}</span>
            <div
              className="w-full bg-primary/20 rounded-t-sm min-h-[4px]"
              style={{ height: `${(m.amount / max) * 100}%` }}
            >
              <div className="w-full h-full bg-primary rounded-t-sm" />
            </div>
            <span className="text-[10px] text-muted-foreground">{m.label}</span>
          </div>
        ))}
      </div>
    </WidgetWrapper>
  );
}

export function LessonVolumeWidget({ onRemove }: WidgetProps) {
  const months = useMemo(() => {
    const result: { label: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const m = subMonths(new Date(), i);
      const start = startOfMonth(m);
      const end = endOfMonth(m);
      const count = demoSchoolLessons
        .filter(l => l.status !== "cancelled" && isWithinInterval(new Date(l.start_time), { start, end }))
        .length;
      result.push({ label: format(m, "MMM"), count });
    }
    return result;
  }, []);

  const max = Math.max(...months.map(m => m.count), 1);

  return (
    <WidgetWrapper title="Lesson Volume" icon={BarChart3} onRemove={onRemove}>
      <div className="flex items-end gap-2 h-32">
        {months.map(m => (
          <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] font-medium text-muted-foreground">{m.count}</span>
            <div
              className="w-full min-h-[4px] rounded-t-sm"
              style={{ height: `${(m.count / max) * 100}%` }}
            >
              <div className="w-full h-full bg-sky-500 rounded-t-sm" />
            </div>
            <span className="text-[10px] text-muted-foreground">{m.label}</span>
          </div>
        ))}
      </div>
    </WidgetWrapper>
  );
}

export function PassRateTrendsWidget({ onRemove }: WidgetProps) {
  const passCount = demoSchoolTestResults.filter(t => t.result === "pass").length;
  const total = demoSchoolTestResults.length;
  const rate = total > 0 ? Math.round((passCount / total) * 100) : 0;

  return (
    <WidgetWrapper title="Pass Rate Trends" icon={TrendingUp} onRemove={onRemove}>
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20">
          <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
            <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
            <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(var(--primary))" strokeWidth="3"
              strokeDasharray={`${rate * 0.88} 88`} strokeLinecap="round" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">{rate}%</span>
        </div>
        <div className="text-sm space-y-1">
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-primary" />{passCount} passed</div>
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-destructive" />{total - passCount} failed</div>
          <div className="text-xs text-muted-foreground">{total} total tests</div>
        </div>
      </div>
    </WidgetWrapper>
  );
}

export function InstructorPerformanceWidget({ onRemove }: WidgetProps) {
  return (
    <WidgetWrapper title="Instructor Performance" icon={UserCheck} onRemove={onRemove}>
      <div className="space-y-3">
        {demoSchoolPayroll.map(inst => (
          <div key={inst.name} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{inst.name}</span>
              <span className="text-xs text-muted-foreground">{inst.lessonCount} lessons</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${(inst.lessonCount / 200) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </WidgetWrapper>
  );
}

export function InstructorAvailabilityWidget({ onRemove }: WidgetProps) {
  return (
    <WidgetWrapper title="Instructor Availability" icon={Users} onRemove={onRemove}>
      <div className="space-y-2">
        {demoSchoolInstructors.map(inst => (
          <div key={inst.id} className="flex items-center justify-between text-sm">
            <span className="font-medium">{inst.instructors.name}</span>
            <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-800">Available</Badge>
          </div>
        ))}
      </div>
    </WidgetWrapper>
  );
}

export function PupilProgressWidget({ onRemove }: WidgetProps) {
  const active = demoSchoolPupils.filter(p => p.course_status === "active").slice(0, 6);

  return (
    <WidgetWrapper title="Pupil Progress" icon={FileText} onRemove={onRemove}>
      <div className="space-y-2.5">
        {active.map(p => (
          <div key={p.id} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{p.name}</span>
              <span className="text-xs text-muted-foreground">{p.progress}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${p.progress}%` }} />
            </div>
          </div>
        ))}
      </div>
    </WidgetWrapper>
  );
}

export const WIDGET_COMPONENTS: Record<string, React.ComponentType<WidgetProps>> = {
  "booking-log": BookingLogWidget,
  "upcoming-tests": UpcomingTestsWidget,
  "todays-schedule": TodaysScheduleWidget,
  "revenue-by-month": RevenueByMonthWidget,
  "lesson-volume": LessonVolumeWidget,
  "pass-rate-trends": PassRateTrendsWidget,
  "instructor-performance": InstructorPerformanceWidget,
  "instructor-availability": InstructorAvailabilityWidget,
  "pupil-progress": PupilProgressWidget,
};
