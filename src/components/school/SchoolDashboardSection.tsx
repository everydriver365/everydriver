import { useState, useEffect, useMemo } from "react";
import { Calendar, TrendingUp, Users, Award, Clock, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolDemo } from "@/context/SchoolDemoContext";
import { demoSchoolStats, demoSchoolLessons } from "@/data/demoSchoolData";

interface Props {
  instructorIds: string[];
  schoolName: string;
}

const INSTRUCTOR_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  "demo-inst-1": { bg: "bg-blue-100", text: "text-blue-800", dot: "bg-blue-500" },
  "demo-inst-2": { bg: "bg-emerald-100", text: "text-emerald-800", dot: "bg-emerald-500" },
  "demo-inst-3": { bg: "bg-purple-100", text: "text-purple-800", dot: "bg-purple-500" },
};
const DEFAULT_COLORS = [
  { bg: "bg-rose-100", text: "text-rose-800", dot: "bg-rose-500" },
  { bg: "bg-amber-100", text: "text-amber-800", dot: "bg-amber-500" },
  { bg: "bg-cyan-100", text: "text-cyan-800", dot: "bg-cyan-500" },
];

function getInstructorColor(id: string, idx: number) {
  return INSTRUCTOR_COLORS[id] || DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
}

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

function getMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const startDay = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  const cells: { date: Date; isCurrentMonth: boolean }[] = [];
  for (let i = startDay - 1; i >= 0; i--) cells.push({ date: new Date(year, month - 1, prevMonthDays - i), isCurrentMonth: false });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ date: new Date(year, month, d), isCurrentMonth: true });
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) cells.push({ date: new Date(year, month + 1, d), isCurrentMonth: false });
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
        <span className="text-sm font-medium">{currentMonth.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</span>
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

export default function SchoolDashboardSection({ instructorIds, schoolName }: Props) {
  const { isDemo } = useSchoolDemo();
  const [stats, setStats] = useState({ totalLessons: 0, totalEarnings: 0, totalPupils: 0, passRate: 0, upcomingLessons: 0, activeInstructors: 0 });
  const [calendarLessons, setCalendarLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [selectedInstructor, setSelectedInstructor] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d;
  });

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  useEffect(() => {
    if (isDemo) {
      setStats(demoSchoolStats);
      setCalendarLessons(demoSchoolLessons);
      setLoading(false);
      setCalendarLoading(false);
      return;
    }
    if (instructorIds.length === 0) { setLoading(false); setCalendarLoading(false); return; }
    fetchStats();
  }, [instructorIds, isDemo]);

  useEffect(() => {
    if (isDemo || instructorIds.length === 0) return;
    fetchCalendarLessons();
  }, [instructorIds, currentMonth, isDemo]);

  const fetchStats = async () => {
    const [lessonsRes, pupilsRes, testsRes, upcomingRes] = await Promise.all([
      supabase.from("scheduled_lessons").select("amount_due, status").in("instructor_id", instructorIds),
      supabase.from("pupils").select("id").in("instructor_id", instructorIds).is("deleted_at", null),
      supabase.from("driving_test_results").select("result").in("instructor_id", instructorIds),
      supabase.from("scheduled_lessons").select("id, start_time, pupils(name)").in("instructor_id", instructorIds).eq("status", "scheduled").gte("start_time", new Date().toISOString()).order("start_time", { ascending: true }).limit(5),
    ]);
    const completed = (lessonsRes.data || []).filter(l => l.status === "completed");
    const passed = (testsRes.data || []).filter(t => t.result === "pass").length;
    const total = (testsRes.data || []).length;
    setStats({
      totalLessons: completed.length,
      totalEarnings: completed.reduce((s, l) => s + (l.amount_due || 0), 0),
      totalPupils: (pupilsRes.data || []).length,
      passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
      upcomingLessons: (upcomingRes.data || []).length,
      activeInstructors: instructorIds.length,
    });
    setLoading(false);
  };

  const fetchCalendarLessons = async () => {
    setCalendarLoading(true);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month + 2, 0);
    const { data } = await supabase
      .from("scheduled_lessons").select("*, pupils(name), instructors(name)")
      .in("instructor_id", instructorIds)
      .gte("start_time", start.toISOString()).lt("start_time", end.toISOString())
      .order("start_time", { ascending: true });
    setCalendarLessons(data || []);
    setCalendarLoading(false);
  };

  const cells = useMemo(() => getMonthGrid(year, month), [year, month]);

  const instructorColorMap = useMemo(() => {
    const map: Record<string, { bg: string; text: string; dot: string }> = {};
    const allIds = [...new Set(calendarLessons.map(l => l.instructor_id))];
    allIds.forEach((id, idx) => { map[id] = getInstructorColor(id, idx); });
    return map;
  }, [calendarLessons]);

  const instructorLegend = useMemo(() => {
    const seen = new Map<string, { id: string; name: string; color: { bg: string; text: string; dot: string } }>();
    calendarLessons.forEach(l => {
      if (!seen.has(l.instructor_id)) {
        seen.set(l.instructor_id, {
          id: l.instructor_id,
          name: l.instructors?.name || "Instructor",
          color: instructorColorMap[l.instructor_id] || DEFAULT_COLORS[0],
        });
      }
    });
    return [...seen.values()];
  }, [calendarLessons, instructorColorMap]);

  const filteredLessons = useMemo(() => {
    if (!selectedInstructor) return calendarLessons;
    return calendarLessons.filter(l => l.instructor_id === selectedInstructor);
  }, [calendarLessons, selectedInstructor]);

  const lessonsForDay = (day: Date) => filteredLessons.filter(l => {
    const ld = new Date(l.start_time);
    return ld.getDate() === day.getDate() && ld.getMonth() === day.getMonth() && ld.getFullYear() === day.getFullYear();
  });

  const today = new Date();
  const monthLabel = currentMonth.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const shiftMonth = (dir: number) => setCurrentMonth(new Date(year, month + dir, 1));
  const goToToday = () => { const d = new Date(); setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1)); };

  if (loading) return <div className="flex items-center justify-center py-12"><Clock className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">{schoolName}</h2>
        <p className="text-muted-foreground">School overview and key metrics</p>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { icon: Users, label: "Active Instructors", value: stats.activeInstructors, color: "text-primary" },
          { icon: Users, label: "Total Pupils", value: stats.totalPupils, color: "text-sky-500" },
          { icon: Calendar, label: "Lessons Completed", value: stats.totalLessons, color: "text-primary" },
          { icon: TrendingUp, label: "Total Earnings", value: `£${stats.totalEarnings.toLocaleString()}`, color: "text-emerald-500" },
          { icon: Award, label: "Pass Rate", value: `${stats.passRate}%`, color: "text-amber-500" },
          { icon: Clock, label: "Upcoming Lessons", value: stats.upcomingLessons, color: "text-violet-500" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="pt-4 text-center">
              <s.icon className={`h-5 w-5 mx-auto mb-1 ${s.color}`} />
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Calendar section */}
      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="hidden lg:flex flex-col gap-4 w-52 shrink-0">
          <MiniCalendar currentMonth={currentMonth} onMonthChange={setCurrentMonth} />
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
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-lg font-semibold">{monthLabel}</h3>
            <div className="flex items-center gap-1 ml-2">
              <Button variant="outline" size="sm" onClick={goToToday} className="text-xs h-7 px-3">Today</Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => shiftMonth(-1)}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => shiftMonth(1)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>

          {calendarLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="grid grid-cols-7 border-b border-border bg-muted/30">
                {DAYS.map(d => (
                  <div key={d} className="text-[11px] font-medium text-muted-foreground text-center py-2 border-r border-border last:border-r-0">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {cells.map((cell, i) => {
                  const dayLessons = lessonsForDay(cell.date);
                  const isToday = cell.date.toDateString() === today.toDateString();
                  const isWeekEnd = i % 7 === 5 || i % 7 === 6;
                  return (
                    <div
                      key={i}
                      className={`min-h-[90px] p-1 border-r border-b border-border last:border-r-0
                        ${!cell.isCurrentMonth ? "bg-muted/20" : isWeekEnd ? "bg-muted/10" : "bg-background"}`}
                    >
                      <div className="flex justify-end mb-0.5">
                        <span className={`text-xs leading-none w-6 h-6 flex items-center justify-center rounded-full
                          ${isToday ? "bg-primary text-primary-foreground font-bold" : ""}
                          ${!cell.isCurrentMonth ? "text-muted-foreground/50" : "text-foreground"}`}>
                          {cell.date.getDate()}
                        </span>
                      </div>
                      <div className="space-y-0.5 overflow-hidden">
                        {dayLessons.slice(0, 3).map(l => {
                          const color = instructorColorMap[l.instructor_id] || DEFAULT_COLORS[0];
                          const time = new Date(l.start_time).toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit" });
                          return (
                            <div key={l.id} className={`text-[10px] px-1.5 py-0.5 rounded truncate flex items-center gap-1 ${color.bg} ${color.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${color.dot} shrink-0`} />
                              <span className="font-medium">{time}</span>
                              <span className="truncate">{l.pupils?.name || "Student"}</span>
                            </div>
                          );
                        })}
                        {dayLessons.length > 3 && (
                          <div className="text-[10px] text-muted-foreground pl-1.5 font-medium">+{dayLessons.length - 3} more</div>
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
    </div>
  );
}
