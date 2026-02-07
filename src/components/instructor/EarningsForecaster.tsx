import { useEffect, useState } from "react";
import { TrendingUp, Calendar, AlertTriangle, Loader2, BarChart3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, addMonths, eachDayOfInterval, startOfWeek, endOfWeek, subMonths, parseISO } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

interface EarningsForecasterProps {
  instructorId: string;
}

interface ForecastData {
  month: string;
  projected: number;
  booked: number;
  historical: number;
}

export function EarningsForecaster({ instructorId }: EarningsForecasterProps) {
  const [loading, setLoading] = useState(true);
  const [forecast, setForecast] = useState<ForecastData[]>([]);
  const [cancellationRate, setCancellationRate] = useState(0);
  const [avgLessonValue, setAvgLessonValue] = useState(0);
  const [weeklyBookedLessons, setWeeklyBookedLessons] = useState(0);
  const [monthProjected, setMonthProjected] = useState(0);

  useEffect(() => {
    if (!instructorId) return;
    calculateForecast();
  }, [instructorId]);

  const calculateForecast = async () => {
    try {
      const today = new Date();
      const threeMonthsAgo = subMonths(today, 3);

      // Fetch historical lessons (last 3 months)
      const { data: historicalLessons } = await supabase
        .from("scheduled_lessons")
        .select("lesson_date, status, duration_minutes, amount_due")
        .eq("instructor_id", instructorId)
        .gte("lesson_date", format(threeMonthsAgo, "yyyy-MM-dd"))
        .lte("lesson_date", format(today, "yyyy-MM-dd"));

      // Fetch upcoming booked lessons (next 3 months)
      const threeMonthsAhead = addMonths(today, 3);
      const { data: upcomingLessons } = await supabase
        .from("scheduled_lessons")
        .select("lesson_date, status, duration_minutes, amount_due")
        .eq("instructor_id", instructorId)
        .eq("status", "scheduled")
        .gte("lesson_date", format(today, "yyyy-MM-dd"))
        .lte("lesson_date", format(threeMonthsAhead, "yyyy-MM-dd"));

      // Fetch payment history for average lesson value
      const { data: payments } = await supabase
        .from("payment_history")
        .select("amount")
        .eq("instructor_id", instructorId)
        .gte("recorded_at", format(threeMonthsAgo, "yyyy-MM-dd"));

      // Calculate cancellation rate
      const totalHistorical = historicalLessons?.length || 0;
      const cancelledOrNoShow = historicalLessons?.filter(
        l => l.status === "cancelled" || l.status === "no-show"
      ).length || 0;
      const calcCancelRate = totalHistorical > 0 ? (cancelledOrNoShow / totalHistorical) * 100 : 5;
      setCancellationRate(Math.round(calcCancelRate));

      // Calculate average lesson value
      const totalPayments = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const paymentCount = payments?.length || 1;
      const calcAvgValue = totalPayments / paymentCount;
      setAvgLessonValue(Math.round(calcAvgValue * 100) / 100);

      // This week's booked lessons
      const weekStart = startOfWeek(today, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
      const thisWeekBooked = upcomingLessons?.filter(l => {
        const d = parseISO(l.lesson_date);
        return d >= weekStart && d <= weekEnd;
      }).length || 0;
      setWeeklyBookedLessons(thisWeekBooked);

      // Build 3-month forecast
      const forecastData: ForecastData[] = [];
      
      for (let i = 0; i < 3; i++) {
        const month = addMonths(today, i);
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        const monthLabel = format(month, "MMM yyyy");

        // Count booked lessons for this month
        const bookedCount = upcomingLessons?.filter(l => {
          const d = parseISO(l.lesson_date);
          return d >= monthStart && d <= monthEnd;
        }).length || 0;

        // Historical average monthly lessons (from past 3 months)
        const historicalMonth = subMonths(today, 3 - i);
        const histStart = startOfMonth(historicalMonth);
        const histEnd = endOfMonth(historicalMonth);
        const histCount = historicalLessons?.filter(l => {
          const d = parseISO(l.lesson_date);
          return d >= histStart && d <= histEnd && l.status === "completed";
        }).length || 0;
        const histRevenue = histCount * (calcAvgValue || 35);

        // Projected = booked lessons adjusted for cancellation rate
        const adjustedBookedCount = bookedCount * (1 - calcCancelRate / 100);
        const projectedRevenue = Math.round(adjustedBookedCount * (calcAvgValue || 35));
        const bookedRevenue = Math.round(bookedCount * (calcAvgValue || 35));

        forecastData.push({
          month: format(month, "MMM"),
          projected: projectedRevenue,
          booked: bookedRevenue,
          historical: Math.round(histRevenue),
        });
      }

      setForecast(forecastData);
      setMonthProjected(forecastData[0]?.projected || 0);
    } catch (err) {
      console.error("Error calculating forecast:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5" />
          Earnings Forecast
        </CardTitle>
        <CardDescription>3-month projection based on bookings &amp; history</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <div className="text-lg font-bold text-primary">£{monthProjected}</div>
            <div className="text-[10px] text-muted-foreground uppercase">This Month</div>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <div className="text-lg font-bold">{weeklyBookedLessons}</div>
            <div className="text-[10px] text-muted-foreground uppercase">This Week</div>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <div className="flex items-center justify-center gap-1">
              <AlertTriangle className="h-3 w-3 text-destructive" />
              <span className="text-lg font-bold text-destructive">{cancellationRate}%</span>
            </div>
            <div className="text-[10px] text-muted-foreground uppercase">Cancel Rate</div>
          </div>
        </div>

        {/* Forecast chart */}
        {forecast.length > 0 && (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={forecast} barGap={4}>
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `£${v}`} width={50} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `£${value}`,
                    name === "projected" ? "Projected (adj. for cancellations)" : name === "booked" ? "If all booked attend" : "Historical"
                  ]}
                />
                <Bar dataKey="projected" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="projected" />
                <Bar dataKey="booked" fill="hsl(var(--primary) / 0.3)" radius={[4, 4, 0, 0]} name="booked" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Info badges */}
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <Badge variant="outline" className="text-xs">
            Avg lesson: £{avgLessonValue.toFixed(0)}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Cancel rate: {cancellationRate}%
          </Badge>
          <Badge variant="secondary" className="text-xs">
            Projections adjust for cancellations
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
