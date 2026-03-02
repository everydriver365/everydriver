import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, XCircle, TrendingDown, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface CancellationAnalyticsProps {
  instructorId: string;
}

interface CancelledLesson {
  id: string;
  lesson_date: string;
  cancellation_reason: string | null;
  status: string;
  created_at: string;
}

const REASON_CATEGORIES: Record<string, string[]> = {
  "Illness": ["ill", "sick", "unwell", "covid", "flu", "cold", "medical", "hospital", "doctor"],
  "Work/Study": ["work", "job", "shift", "meeting", "school", "university", "college", "exam", "class"],
  "Weather": ["weather", "rain", "snow", "ice", "fog", "storm", "wind"],
  "Vehicle": ["car", "vehicle", "breakdown", "mot", "service"],
  "Personal": ["family", "emergency", "funeral", "wedding", "holiday", "vacation"],
  "Financial": ["money", "afford", "pay", "cost", "expensive", "budget"],
  "No-show": ["no show", "no-show", "didn't turn up", "ghost"],
};

function categoriseReason(reason: string | null): string {
  if (!reason) return "Not Given";
  const lower = reason.toLowerCase();
  for (const [cat, keywords] of Object.entries(REASON_CATEGORIES)) {
    if (keywords.some(kw => lower.includes(kw))) return cat;
  }
  return "Other";
}

const PIE_COLORS = [
  "hsl(var(--primary))", "hsl(var(--destructive))", "#f59e0b", "#10b981",
  "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16", "#6b7280"
];

export function CancellationAnalytics({ instructorId }: CancellationAnalyticsProps) {
  const [lessons, setLessons] = useState<CancelledLesson[]>([]);
  const [totalLessons, setTotalLessons] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [instructorId]);

  const fetchData = async () => {
    const sixMonthsAgo = format(subMonths(new Date(), 6), "yyyy-MM-dd");

    const [{ data: cancelled }, { count }] = await Promise.all([
      supabase
        .from("scheduled_lessons")
        .select("id, lesson_date, cancellation_reason, status, created_at")
        .eq("instructor_id", instructorId)
        .eq("status", "cancelled")
        .gte("lesson_date", sixMonthsAgo),
      supabase
        .from("scheduled_lessons")
        .select("*", { count: "exact", head: true })
        .eq("instructor_id", instructorId)
        .gte("lesson_date", sixMonthsAgo),
    ]);

    setLessons(cancelled || []);
    setTotalLessons(count || 0);
    setLoading(false);
  };

  const monthlyData = useMemo(() => {
    const months: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      months[format(d, "MMM yy")] = 0;
    }
    for (const l of lessons) {
      const key = format(new Date(l.lesson_date), "MMM yy");
      if (key in months) months[key]++;
    }
    return Object.entries(months).map(([month, count]) => ({ month, count }));
  }, [lessons]);

  const reasonData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const l of lessons) {
      const cat = categoriseReason(l.cancellation_reason);
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [lessons]);

  const cancelRate = totalLessons > 0 ? ((lessons.length / totalLessons) * 100).toFixed(1) : "0";

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <XCircle className="h-5 w-5 text-destructive mx-auto mb-1" />
            <p className="text-2xl font-bold">{lessons.length}</p>
            <p className="text-xs text-muted-foreground">Cancellations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingDown className="h-5 w-5 text-amber-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{cancelRate}%</p>
            <p className="text-xs text-muted-foreground">Cancel Rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{totalLessons}</p>
            <p className="text-xs text-muted-foreground">Total Lessons</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Monthly Cancellations (6 months)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Reason breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Cancellation Reasons</CardTitle>
        </CardHeader>
        <CardContent>
          {reasonData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No cancellation data</p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={reasonData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {reasonData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {reasonData.map((r, i) => (
                  <div key={r.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-xs flex-1 truncate">{r.name}</span>
                    <Badge variant="secondary" className="text-xs">{r.value}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
