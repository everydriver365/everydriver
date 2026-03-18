import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Moon, TrendingUp, TrendingDown, Minus, CreditCard, Banknote, Car, XCircle, Users } from "lucide-react";
import { format, subDays } from "date-fns";
import { downloadPDFBackend } from "@/utils/generatePDFBackend";

export function EnhancedEODReport() {
  const { instructor } = useInstructorAuth();
  const today = format(new Date(), "yyyy-MM-dd");
  const lastWeekSameDay = format(subDays(new Date(), 7), "yyyy-MM-dd");

  const { data, isLoading } = useQuery({
    queryKey: ["enhanced-eod", instructor?.id, today],
    queryFn: async () => {
      const [lessonsRes, paymentsRes, mileageRes, lastWeekLessonsRes, lastWeekPaymentsRes] = await Promise.all([
        supabase.from("scheduled_lessons")
          .select("id, status, duration_minutes, pupils!inner(name)")
          .eq("instructor_id", instructor!.id)
          .eq("lesson_date", today),
        supabase.from("payment_history")
          .select("amount, payment_method")
          .eq("instructor_id", instructor!.id)
          .gte("payment_date", today)
          .lt("payment_date", today + "T23:59:59"),
        supabase.from("mileage_logs")
          .select("distance_km")
          .eq("instructor_id", instructor!.id)
          .eq("log_date", today),
        supabase.from("scheduled_lessons")
          .select("id, status, duration_minutes")
          .eq("instructor_id", instructor!.id)
          .eq("lesson_date", lastWeekSameDay),
        supabase.from("payment_history")
          .select("amount, payment_method")
          .eq("instructor_id", instructor!.id)
          .gte("payment_date", lastWeekSameDay)
          .lt("payment_date", lastWeekSameDay + "T23:59:59"),
      ]);

      const lessons = lessonsRes.data || [];
      const payments = paymentsRes.data || [];
      const mileage = mileageRes.data || [];
      const lastWeekLessons = lastWeekLessonsRes.data || [];
      const lastWeekPayments = lastWeekPaymentsRes.data || [];

      const completed = lessons.filter(l => l.status === "completed").length;
      const cancelled = lessons.filter(l => l.status === "cancelled").length;
      const noShows = lessons.filter(l => l.status === "no_show").length;
      const totalHours = lessons.filter(l => l.status !== "cancelled").reduce((s, l) => s + (l.duration_minutes || 60), 0) / 60;

      const cashTotal = payments.filter(p => p.payment_method?.toLowerCase() === "cash").reduce((s, p) => s + (p.amount || 0), 0);
      const cardTotal = payments.filter(p => p.payment_method?.toLowerCase() !== "cash").reduce((s, p) => s + (p.amount || 0), 0);
      const totalRevenue = cashTotal + cardTotal;

      const totalMiles = Math.round(mileage.reduce((s, m) => s + (m.distance_km || 0), 0) * 0.621371);

      const lwCompleted = lastWeekLessons.filter(l => l.status === "completed").length;
      const lwRevenue = lastWeekPayments.reduce((s, p) => s + (p.amount || 0), 0);

      return {
        completed, cancelled, noShows, totalHours, totalLessons: lessons.length,
        cashTotal, cardTotal, totalRevenue, totalMiles,
        lwCompleted, lwRevenue,
        lessonDelta: completed - lwCompleted,
        revenueDelta: totalRevenue - lwRevenue,
      };
    },
    enabled: !!instructor?.id,
  });

  const TrendIcon = ({ delta }: { delta: number }) => {
    if (delta > 0) return <TrendingUp className="h-3.5 w-3.5 text-green-500" />;
    if (delta < 0) return <TrendingDown className="h-3.5 w-3.5 text-destructive" />;
    return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  if (isLoading) return <p className="text-sm text-muted-foreground text-center py-8">Loading report...</p>;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Moon className="h-5 w-5 text-primary" />
        <h2 className="text-base font-bold text-foreground">End of Day Report</h2>
        <span className="text-xs text-muted-foreground ml-auto">{format(new Date(), "EEEE, d MMM")}</span>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-1">
              <Users className="h-4 w-4 text-primary" />
              <div className="flex items-center gap-1">
                <TrendIcon delta={data.lessonDelta} />
                <span className={`text-[10px] ${data.lessonDelta >= 0 ? "text-green-500" : "text-destructive"}`}>
                  {data.lessonDelta > 0 ? "+" : ""}{data.lessonDelta} vs last week
                </span>
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{data.completed}/{data.totalLessons}</p>
            <p className="text-xs text-muted-foreground">Lessons completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-1">
              <CreditCard className="h-4 w-4 text-primary" />
              <div className="flex items-center gap-1">
                <TrendIcon delta={data.revenueDelta} />
                <span className={`text-[10px] ${data.revenueDelta >= 0 ? "text-green-500" : "text-destructive"}`}>
                  {data.revenueDelta > 0 ? "+" : ""}£{data.revenueDelta}
                </span>
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">£{data.totalRevenue}</p>
            <p className="text-xs text-muted-foreground">Total revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Breakdown */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Payment Breakdown</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Banknote className="h-4 w-4 text-green-600" />
              <span className="text-sm text-foreground">Cash</span>
            </div>
            <span className="text-sm font-semibold text-foreground">£{data.cashTotal}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-foreground">Card / Online</span>
            </div>
            <span className="text-sm font-semibold text-foreground">£{data.cardTotal}</span>
          </div>
        </CardContent>
      </Card>

      {/* Additional Stats */}
      <div className="grid grid-cols-3 gap-2">
        <Card>
          <CardContent className="p-3 text-center">
            <XCircle className="h-4 w-4 mx-auto mb-1 text-destructive" />
            <p className="text-lg font-bold text-foreground">{data.cancelled}</p>
            <p className="text-[10px] text-muted-foreground">Cancelled</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Users className="h-4 w-4 mx-auto mb-1 text-amber-500" />
            <p className="text-lg font-bold text-foreground">{data.noShows}</p>
            <p className="text-[10px] text-muted-foreground">No Shows</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Car className="h-4 w-4 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold text-foreground">{data.totalMiles}</p>
            <p className="text-[10px] text-muted-foreground">Miles</p>
          </CardContent>
        </Card>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => downloadPDFBackend({
          reportType: "eod-report",
          instructorId: instructor?.id,
          data,
          filename: `eod-report-${today}.pdf`,
        })}
      >
        Download PDF
      </Button>
    </div>
  );
}
