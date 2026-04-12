import { useState, useEffect } from "react";
import { format, startOfWeek, startOfMonth, startOfYear, subMonths, parseISO } from "date-fns";
import { 
  Users, 
  TrendingUp, 
  Award,
  Clock,
  Calendar,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Target
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, BarChart, Bar } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { PupilAvatar } from "./PupilAvatar";

interface PerformanceMetrics {
  totalPupils: number;
  activePupils: number;
  passedPupils: number;
  passRate: number;
  totalLessonsThisMonth: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  hoursThisWeek: number;
  cancellationRate: number;
}

interface PassedPupil {
  id: string;
  name: string;
  profile_image_url: string | null;
  test_result_date: string | null;
}

interface ChartDataPoint {
  date: string;
  revenue: number;
  lessons: number;
}

interface PerformanceDashboardProps {
  instructorId: string;
}

export function PerformanceDashboard({ instructorId }: PerformanceDashboardProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [recentPasses, setRecentPasses] = useState<PassedPupil[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState<"week" | "month" | "year">("month");

  useEffect(() => {
    fetchPerformanceData();
  }, [instructorId, chartPeriod]);

  const fetchPerformanceData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const thisMonthStart = startOfMonth(now);
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });

      // Fetch pupils
      const { data: pupils, error: pupilsError } = await supabase
        .from("pupils")
        .select("id, name, profile_image_url, test_passed, test_result_date, progress")
        .eq("instructor_id", instructorId);

      if (pupilsError) throw pupilsError;

      const totalPupils = pupils?.length || 0;
      const activePupils = pupils?.filter(p => (p.progress || 0) < 100).length || 0;
      const passedPupils = pupils?.filter(p => p.test_passed === true).length || 0;
      const passRate = totalPupils > 0 ? Math.round((passedPupils / totalPupils) * 100) : 0;

      // Fetch lessons this month
      const { count: lessonsThisMonth } = await supabase
        .from("lesson_history")
        .select("*", { count: "exact", head: true })
        .eq("instructor_id", instructorId)
        .gte("lesson_date", format(thisMonthStart, "yyyy-MM-dd"));

      // Fetch revenue this month
      const { data: revenueThisMonthData } = await supabase
        .from("payment_history")
        .select("amount, recorded_at")
        .eq("instructor_id", instructorId)
        .gte("recorded_at", format(thisMonthStart, "yyyy-MM-dd"));

      const revenueThisMonth = revenueThisMonthData?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      // Fetch revenue last month
      const { data: revenueLastMonthData } = await supabase
        .from("payment_history")
        .select("amount, recorded_at")
        .eq("instructor_id", instructorId)
        .gte("recorded_at", format(lastMonthStart, "yyyy-MM-dd"))
        .lt("recorded_at", format(thisMonthStart, "yyyy-MM-dd"));

      const revenueLastMonth = revenueLastMonthData?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      // Fetch hours this week
      const { data: weekLessons } = await supabase
        .from("lesson_history")
        .select("duration_minutes")
        .eq("instructor_id", instructorId)
        .gte("lesson_date", format(thisWeekStart, "yyyy-MM-dd"));

      const hoursThisWeek = Math.round((weekLessons?.reduce((sum, l) => sum + (l.duration_minutes || 0), 0) || 0) / 60);

      // Fetch cancellation rate
      const { count: totalScheduled } = await supabase
        .from("scheduled_lessons")
        .select("*", { count: "exact", head: true })
        .eq("instructor_id", instructorId)
        .gte("lesson_date", format(thisMonthStart, "yyyy-MM-dd"));

      const { count: cancelled } = await supabase
        .from("scheduled_lessons")
        .select("*", { count: "exact", head: true })
        .eq("instructor_id", instructorId)
        .eq("status", "cancelled")
        .gte("lesson_date", format(thisMonthStart, "yyyy-MM-dd"));

      const cancellationRate = totalScheduled ? Math.round(((cancelled || 0) / totalScheduled) * 100) : 0;

      // Fetch recent passes
      const recentPassedPupils = pupils
        ?.filter(p => p.test_passed && p.test_result_date)
        .sort((a, b) => new Date(b.test_result_date!).getTime() - new Date(a.test_result_date!).getTime())
        .slice(0, 5) || [];

      setRecentPasses(recentPassedPupils);

      setMetrics({
        totalPupils,
        activePupils,
        passedPupils,
        passRate,
        totalLessonsThisMonth: lessonsThisMonth || 0,
        revenueThisMonth,
        revenueLastMonth,
        hoursThisWeek,
        cancellationRate,
      });

      // Fetch chart data based on period
      await fetchChartData();
    } catch (error) {
      console.error("Error fetching performance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    const now = new Date();
    let startDate: Date;
    let groupBy: "day" | "week" | "month";

    switch (chartPeriod) {
      case "week":
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        groupBy = "day";
        break;
      case "year":
        startDate = startOfYear(now);
        groupBy = "month";
        break;
      default:
        startDate = startOfMonth(now);
        groupBy = "day";
    }

    const { data: payments } = await supabase
      .from("payment_history")
      .select("amount, recorded_at")
      .eq("instructor_id", instructorId)
      .gte("recorded_at", format(startDate, "yyyy-MM-dd"))
      .order("recorded_at", { ascending: true });

    const { data: lessons } = await supabase
      .from("lesson_history")
      .select("lesson_date")
      .eq("instructor_id", instructorId)
      .gte("lesson_date", format(startDate, "yyyy-MM-dd"))
      .order("lesson_date", { ascending: true });

    // Group data by date
    const dataMap = new Map<string, { revenue: number; lessons: number }>();

    payments?.forEach(p => {
      const dateKey = format(parseISO(p.recorded_at), groupBy === "month" ? "MMM" : "dd MMM");
      const existing = dataMap.get(dateKey) || { revenue: 0, lessons: 0 };
      dataMap.set(dateKey, { ...existing, revenue: existing.revenue + (p.amount || 0) });
    });

    lessons?.forEach(l => {
      const dateKey = format(parseISO(l.lesson_date), groupBy === "month" ? "MMM" : "dd MMM");
      const existing = dataMap.get(dateKey) || { revenue: 0, lessons: 0 };
      dataMap.set(dateKey, { ...existing, lessons: existing.lessons + 1 });
    });

    const chartPoints: ChartDataPoint[] = Array.from(dataMap.entries()).map(([date, data]) => ({
      date,
      revenue: data.revenue,
      lessons: data.lessons,
    }));

    setChartData(chartPoints);
  };

  const getRevenueChange = () => {
    if (!metrics || metrics.revenueLastMonth === 0) return null;
    const change = ((metrics.revenueThisMonth - metrics.revenueLastMonth) / metrics.revenueLastMonth) * 100;
    return Math.round(change);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!metrics) return null;

  const revenueChange = getRevenueChange();

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-2xl bg-[#0075c9]/10 text-[#0075c9]">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{metrics.totalPupils}</div>
                <div className="text-xs text-muted-foreground">Total Pupils</div>
              </div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {metrics.activePupils} active • {metrics.passedPupils} passed
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-2xl bg-emerald-500/10 text-emerald-500">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{metrics.passRate}%</div>
                <div className="text-xs text-muted-foreground">Pass Rate</div>
              </div>
            </div>
            <Progress value={metrics.passRate} className="mt-2 h-1.5" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-2xl bg-purple-500/10 text-purple-500">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">£{metrics.revenueThisMonth.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">This Month</div>
              </div>
            </div>
            {revenueChange !== null && (
              <div className={`mt-2 flex items-center text-xs ${revenueChange >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                {revenueChange >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(revenueChange)}% vs last month
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-500">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{metrics.hoursThisWeek}h</div>
                <div className="text-xs text-muted-foreground">This Week</div>
              </div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {metrics.totalLessonsThisMonth} lessons this month
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Revenue Trend
            </CardTitle>
            <Tabs value={chartPeriod} onValueChange={(v) => setChartPeriod(v as any)}>
              <TabsList className="h-8">
                <TabsTrigger value="week" className="text-xs px-2">Week</TabsTrigger>
                <TabsTrigger value="month" className="text-xs px-2">Month</TabsTrigger>
                <TabsTrigger value="year" className="text-xs px-2">Year</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ChartContainer
              config={{
                revenue: { label: "Revenue", color: "hsl(var(--primary))" },
              }}
              className="h-[200px] w-full"
            >
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fontSize: 10 }}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => `£${value}`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  fill="url(#revenueFill)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
              No data for this period
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Passes & Metrics Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Passes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4 text-emerald-500" />
              Recent Passes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentPasses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recorded test passes yet
              </p>
            ) : (
              <div className="space-y-2">
                {recentPasses.map((pupil) => (
                  <div key={pupil.id} className="flex items-center gap-3 p-2 rounded-2xl hover:bg-muted/50">
                    <PupilAvatar name={pupil.name} imageUrl={pupil.profile_image_url} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{pupil.name}</div>
                      {pupil.test_result_date && (
                        <div className="text-xs text-muted-foreground">
                          Passed {format(parseISO(pupil.test_result_date), "d MMM yyyy")}
                        </div>
                      )}
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-0">
                      Passed
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Business Insights */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Business Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Cancellation Rate</div>
              <div className="flex items-center gap-2">
                <Progress value={100 - metrics.cancellationRate} className="w-20 h-2" />
                <span className="text-sm font-medium">{metrics.cancellationRate}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Avg Lessons/Pupil</div>
              <span className="text-sm font-medium">
                {metrics.totalPupils > 0 
                  ? Math.round(metrics.totalLessonsThisMonth / metrics.totalPupils) 
                  : 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Revenue/Hour</div>
              <span className="text-sm font-medium">
                £{metrics.hoursThisWeek > 0 
                  ? Math.round(metrics.revenueThisMonth / (metrics.hoursThisWeek * 4)) 
                  : 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
