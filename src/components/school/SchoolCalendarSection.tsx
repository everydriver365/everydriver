import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolDemo } from "@/context/SchoolDemoContext";
import { demoSchoolLessons } from "@/data/demoSchoolData";

interface Props { instructorIds: string[]; }

const INSTRUCTOR_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  "demo-inst-1": { bg: "bg-blue-100", text: "text-blue-800", dot: "bg-blue-500" },
  "demo-inst-2": { bg: "bg-emerald-100", text: "text-emerald-800", dot: "bg-emerald-500" },
  "demo-inst-3": { bg: "bg-purple-100", text: "text-purple-800", dot: "bg-purple-500" },
};
const DEFAULT_COLORS = [
  { bg: "bg-rose-100", text: "text-rose-800", dot: "bg-rose-500" },
  { bg: "bg-amber-100", text: "text-amber-800", dot: "bg-amber-500" },
  { bg: "bg-cyan-100", text: "text-cyan-800", dot: "bg-cyan-500" },
  { bg: "bg-pink-100", text: "text-pink-800", dot: "bg-pink-500" },
];

function getInstructorColor(id: string, idx: number) {
  return INSTRUCTOR_COLORS[id] || DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
}

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

function getMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const startDay = (firstDay.getDay() + 6) % 7; // 0=Mon
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const cells: { date: Date; isCurrentMonth: boolean }[] = [];

  // Previous month fill
  for (let i = startDay - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month - 1, prevMonthDays - i), isCurrentMonth: false });
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), isCurrentMonth: true });
  }
  // Next month fill
  const remaining = 42 - cells.length; // 6 rows
  for (let d = 1; d <= remaining; d++) {
    cells.push({ date: new Date(year, month + 1, d), isCurrentMonth: false });
  }
  return cells;
}

function MiniCalendar({ currentMonth, onMonthChange }: { currentMonth: Date; onMonthChange: (d: Date) => void }) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const cells = getMonthGrid(year, month);
  const today = new Date();

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-2">
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onMonthChange(new Date(year, month - 1, 1))}>
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <span className="text-sm font-medium">
          {currentMonth.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
        </span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onMonthChange(new Date(year, month + 1, 1))}>
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-0">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <div key={i} className="text-[10px] text-center text-muted-foreground font-medium py-1">{d}</div>
        ))}
        {cells.map((cell, i) => {
          const isToday = cell.date.toDateString() === today.toDateString();
          return (
            <div
              key={i}
              className={`text-[11px] text-center py-0.5 cursor-pointer rounded-full w-6 h-6 flex items-center justify-center mx-auto
                ${!cell.isCurrentMonth ? "text-muted-foreground/40" : ""}
                ${isToday ? "bg-primary text-primary-foreground font-bold" : "hover:bg-muted"}
              `}
              onClick={() => onMonthChange(new Date(cell.date.getFullYear(), cell.date.getMonth(), 1))}
            >
              {cell.date.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SchoolCalendarSection({ instructorIds }: Props) {
  const { isDemo } = useSchoolDemo();
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstructor, setSelectedInstructor] = useState<string | null>(null); // null = all
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d;
  });

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  useEffect(() => {
    if (isDemo) { setLessons(demoSchoolLessons); setLoading(false); return; }
    if (instructorIds.length === 0) { setLoading(false); return; }
    fetchLessons();
  }, [instructorIds, currentMonth, isDemo]);

  const fetchLessons = async () => {
    setLoading(true);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month + 2, 0);
    const { data } = await supabase
      .from("scheduled_lessons").select("*, pupils(name), instructors(name)")
      .in("instructor_id", instructorIds)
      .gte("start_time", start.toISOString()).lt("start_time", end.toISOString())
      .order("start_time", { ascending: true });
    setLessons(data || []);
    setLoading(false);
  };

  const cells = useMemo(() => getMonthGrid(year, month), [year, month]);

  // Build instructor color map
  const instructorColorMap = useMemo(() => {
    const map: Record<string, { bg: string; text: string; dot: string }> = {};
    const allIds = [...new Set(lessons.map(l => l.instructor_id))];
    allIds.forEach((id, idx) => { map[id] = getInstructorColor(id, idx); });
    return map;
  }, [lessons]);

  // Unique instructor legend
  const instructorLegend = useMemo(() => {
    const seen = new Map<string, { id: string; name: string; color: { bg: string; text: string; dot: string } }>();
    lessons.forEach(l => {
      if (!seen.has(l.instructor_id)) {
        seen.set(l.instructor_id, {
          id: l.instructor_id,
          name: l.instructors?.name || "Instructor",
          color: instructorColorMap[l.instructor_id] || DEFAULT_COLORS[0],
        });
      }
    });
    return [...seen.values()];
  }, [lessons, instructorColorMap]);

  const filteredLessons = useMemo(() => {
    if (!selectedInstructor) return lessons;
    return lessons.filter(l => l.instructor_id === selectedInstructor);
  }, [lessons, selectedInstructor]);

  const lessonsForDay = (day: Date) => filteredLessons.filter(l => {
    const ld = new Date(l.start_time);
    return ld.getDate() === day.getDate() && ld.getMonth() === day.getMonth() && ld.getFullYear() === day.getFullYear();
  });

  const today = new Date();
  const monthLabel = currentMonth.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  const shiftMonth = (dir: number) => setCurrentMonth(new Date(year, month + dir, 1));
  const goToToday = () => { const d = new Date(); setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1)); };

  return (
    <div className="flex gap-6 h-full">
      {/* Sidebar */}
      <div className="hidden lg:flex flex-col gap-4 w-52 shrink-0">
        <MiniCalendar currentMonth={currentMonth} onMonthChange={setCurrentMonth} />
        {/* Legend */}
        {instructorLegend.length > 0 && (
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Instructors</span>
            <button
              onClick={() => setSelectedInstructor(null)}
              className={`flex items-center gap-2 text-xs w-full rounded px-1.5 py-1 text-left transition-colors
                ${selectedInstructor === null ? "bg-primary/10 font-semibold text-primary" : "hover:bg-muted"}`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-foreground/40 shrink-0" />
              All Instructors
            </button>
            {instructorLegend.map((inst) => (
              <button
                key={inst.id}
                onClick={() => setSelectedInstructor(selectedInstructor === inst.id ? null : inst.id)}
                className={`flex items-center gap-2 text-xs w-full rounded px-1.5 py-1 text-left transition-colors
                  ${selectedInstructor === inst.id ? "bg-primary/10 font-semibold text-primary" : "hover:bg-muted"}`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${inst.color.dot} shrink-0`} />
                {inst.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main calendar */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-2xl font-bold">{monthLabel}</h2>
          <div className="flex items-center gap-1 ml-2">
            <Button variant="outline" size="sm" onClick={goToToday} className="text-xs h-7 px-3">Today</Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => shiftMonth(-1)}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => shiftMonth(1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-border bg-muted/30">
              {DAYS.map(d => (
                <div key={d} className="text-[11px] font-medium text-muted-foreground text-center py-2 border-r border-border last:border-r-0">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7">
              {cells.map((cell, i) => {
                const dayLessons = lessonsForDay(cell.date);
                const isToday = cell.date.toDateString() === today.toDateString();
                const isWeekEnd = i % 7 === 5 || i % 7 === 6;
                const rowStart = Math.floor(i / 7) < 5;

                return (
                  <div
                    key={i}
                    className={`min-h-[90px] p-1 border-r border-b border-border last:border-r-0
                      ${!cell.isCurrentMonth ? "bg-muted/20" : isWeekEnd ? "bg-muted/10" : "bg-background"}
                      ${rowStart ? "" : ""}
                    `}
                  >
                    {/* Date number */}
                    <div className="flex justify-end mb-0.5">
                      <span
                        className={`text-xs leading-none w-6 h-6 flex items-center justify-center rounded-full
                          ${isToday ? "bg-primary text-primary-foreground font-bold" : ""}
                          ${!cell.isCurrentMonth ? "text-muted-foreground/50" : "text-foreground"}
                        `}
                      >
                        {cell.date.getDate()}
                      </span>
                    </div>

                    {/* Events */}
                    <div className="space-y-0.5 overflow-hidden">
                      {dayLessons.slice(0, 3).map(l => {
                        const color = instructorColorMap[l.instructor_id] || DEFAULT_COLORS[0];
                        const time = new Date(l.start_time).toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit" });
                        return (
                          <div
                            key={l.id}
                            className={`text-[10px] px-1.5 py-0.5 rounded truncate flex items-center gap-1 ${color.bg} ${color.text}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${color.dot} shrink-0`} />
                            <span className="font-medium">{time}</span>
                            <span className="truncate">{l.pupils?.name || "Student"}</span>
                          </div>
                        );
                      })}
                      {dayLessons.length > 3 && (
                        <div className="text-[10px] text-muted-foreground pl-1.5 font-medium">
                          +{dayLessons.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
