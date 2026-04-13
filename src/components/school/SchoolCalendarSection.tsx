import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolDemo } from "@/context/SchoolDemoContext";
import { demoSchoolLessons } from "@/data/demoSchoolData";

interface Props { instructorIds: string[]; }

export default function SchoolCalendarSection({ instructorIds }: Props) {
  const { isDemo } = useSchoolDemo();
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1); d.setHours(0, 0, 0, 0); return d;
  });

  useEffect(() => {
    if (isDemo) { setLessons(demoSchoolLessons); setLoading(false); return; }
    if (instructorIds.length === 0) { setLoading(false); return; }
    fetchLessons();
  }, [instructorIds, weekStart, isDemo]);

  const fetchLessons = async () => {
    setLoading(true);
    const end = new Date(weekStart); end.setDate(end.getDate() + 7);
    const { data } = await supabase
      .from("scheduled_lessons").select("*, pupils(name), instructors(name)")
      .in("instructor_id", instructorIds)
      .gte("start_time", weekStart.toISOString()).lt("start_time", end.toISOString())
      .order("start_time", { ascending: true });
    setLessons(data || []);
    setLoading(false);
  };

  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; });
  const shiftWeek = (dir: number) => { const d = new Date(weekStart); d.setDate(d.getDate() + dir * 7); setWeekStart(d); };

  const lessonsForDay = (day: Date) => lessons.filter(l => {
    const ld = new Date(l.start_time);
    return ld.getDate() === day.getDate() && ld.getMonth() === day.getMonth() && ld.getFullYear() === day.getFullYear();
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Calendar</h2>
          <p className="text-muted-foreground">Weekly view across all instructors</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => shiftWeek(-1)}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm font-medium min-w-[180px] text-center">
            {weekStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} — {days[6].toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </span>
          <Button variant="outline" size="icon" onClick={() => shiftWeek(1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {days.map(day => {
            const dayLessons = lessonsForDay(day);
            const isToday = day.toDateString() === new Date().toDateString();
            return (
              <Card key={day.toISOString()} className={isToday ? "border-primary" : ""}>
                <CardHeader className="p-2 pb-1">
                  <CardTitle className="text-xs text-center">
                    <span className="text-muted-foreground">{day.toLocaleDateString("en-GB", { weekday: "short" })}</span>
                    <br />
                    <span className={isToday ? "text-primary font-bold" : ""}>{day.getDate()}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-1 space-y-1 min-h-[80px]">
                  {dayLessons.map(l => (
                    <div key={l.id} className="text-[10px] p-1 bg-primary/10 rounded truncate">
                      <span className="font-medium">{new Date(l.start_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
                      <br />{l.pupils?.name || "Student"}
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
