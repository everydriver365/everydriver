import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, subMonths, parseISO, startOfYear } from "date-fns";
import { TrendingUp, Calendar, PoundSterling, ChevronLeft, ChevronRight, Users, Clock, Banknote } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { supabase } from "@/integrations/supabase/client";

interface IncomeRecord {
  id: string;
  amount: number;
  recorded_at: string;
  payment_method: string;
  pupil_name: string;
}

interface MonthlyStats {
  totalIncome: number;
  lessonCount: number;
  totalHours: number;
  paymentCount: number;
}

interface YearlyStats {
  financialYearTotal: number;
  yearToDateTotal: number;
  financialYearLabel: string;
}

// Get UK financial year start (April 6th)
function getFinancialYearStart(date: Date): Date {
  const year = date.getFullYear();
  const april6th = new Date(year, 3, 6); // April is month 3 (0-indexed)
  
  if (date >= april6th) {
    return april6th;
  } else {
    return new Date(year - 1, 3, 6);
  }
}

function getFinancialYearLabel(date: Date): string {
  const fyStart = getFinancialYearStart(date);
  const startYear = fyStart.getFullYear();
  const endYear = startYear + 1;
  return `${startYear}/${endYear.toString().slice(-2)}`;
}

export default function InstructorIncome() {
  const { instructor } = useInstructorAuth();
  const instructorId = instructor?.id;
  
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [incomeRecords, setIncomeRecords] = useState<IncomeRecord[]>([]);
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [yearlyStats, setYearlyStats] = useState<YearlyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (instructorId) {
      fetchIncomeData();
      fetchYearlyData();
    }
  }, [instructorId, selectedMonth]);

  const fetchYearlyData = async () => {
    if (!instructorId) return;

    try {
      const now = new Date();
      
      // Financial year (April 6 - April 5)
      const fyStart = getFinancialYearStart(now);
      const fyStartStr = format(fyStart, "yyyy-MM-dd");
      
      // Calendar year to date (Jan 1)
      const calendarYearStart = format(startOfYear(now), "yyyy-MM-dd");
      const today = format(now, "yyyy-MM-dd");

      // Fetch financial year payments
      const { data: fyPayments } = await supabase
        .from("payment_history")
        .select("amount")
        .eq("instructor_id", instructorId)
        .gte("recorded_at", `${fyStartStr}T00:00:00`)
        .lte("recorded_at", `${today}T23:59:59`);

      // Fetch calendar year payments
      const { data: ytdPayments } = await supabase
        .from("payment_history")
        .select("amount")
        .eq("instructor_id", instructorId)
        .gte("recorded_at", `${calendarYearStart}T00:00:00`)
        .lte("recorded_at", `${today}T23:59:59`);

      const financialYearTotal = fyPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const yearToDateTotal = ytdPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      setYearlyStats({
        financialYearTotal,
        yearToDateTotal,
        financialYearLabel: getFinancialYearLabel(now),
      });
    } catch (error) {
      console.error("Error fetching yearly data:", error);
    }
  };

  const fetchIncomeData = async () => {
    if (!instructorId) return;
    
    setLoading(true);
    try {
      const monthStart = format(startOfMonth(selectedMonth), "yyyy-MM-dd");
      const monthEnd = format(endOfMonth(selectedMonth), "yyyy-MM-dd");

      // Fetch payments for the month
      const { data: payments, error: paymentsError } = await supabase
        .from("payment_history")
        .select(`
          id,
          amount,
          recorded_at,
          payment_method,
          pupils (name)
        `)
        .eq("instructor_id", instructorId)
        .gte("recorded_at", `${monthStart}T00:00:00`)
        .lte("recorded_at", `${monthEnd}T23:59:59`)
        .order("recorded_at", { ascending: false });

      if (paymentsError) throw paymentsError;

      // Fetch lessons for the month
      const { data: lessons, error: lessonsError } = await supabase
        .from("scheduled_lessons")
        .select("duration_minutes")
        .eq("instructor_id", instructorId)
        .gte("lesson_date", monthStart)
        .lte("lesson_date", monthEnd)
        .neq("status", "cancelled");

      if (lessonsError) throw lessonsError;

      const formattedRecords = (payments || []).map((p: any) => ({
        id: p.id,
        amount: Number(p.amount),
        recorded_at: p.recorded_at,
        payment_method: p.payment_method,
        pupil_name: p.pupils?.name || "Unknown",
      }));

      const totalIncome = formattedRecords.reduce((sum, r) => sum + r.amount, 0);
      const totalMinutes = lessons?.reduce((sum, l) => sum + (l.duration_minutes || 0), 0) || 0;

      setIncomeRecords(formattedRecords);
      setStats({
        totalIncome,
        lessonCount: lessons?.length || 0,
        totalHours: Math.round(totalMinutes / 60 * 10) / 10,
        paymentCount: formattedRecords.length,
      });
    } catch (error) {
      console.error("Error fetching income data:", error);
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setSelectedMonth(prev => 
      direction === "prev" ? subMonths(prev, 1) : subMonths(prev, -1)
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount);
  };

  if (!instructorId) {
    return (
      <InstructorPortalLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </InstructorPortalLayout>
    );
  }

  return (
    <InstructorPortalLayout>
      <div className="space-y-4 pb-24">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            <h1 className="text-xl font-bold">Income</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Track your earnings</p>
        </div>

        {/* Financial Year & YTD Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Banknote className="h-4 w-4 text-amber-600" />
                <span className="text-xs text-muted-foreground">FY {yearlyStats?.financialYearLabel}</span>
              </div>
              {yearlyStats ? (
                <p className="text-xl font-bold text-amber-600">
                  {formatCurrency(yearlyStats.financialYearTotal)}
                </p>
              ) : (
                <Skeleton className="h-7 w-24" />
              )}
              <p className="text-[10px] text-muted-foreground mt-0.5">Tax Year Total</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-violet-600" />
                <span className="text-xs text-muted-foreground">{format(new Date(), "yyyy")}</span>
              </div>
              {yearlyStats ? (
                <p className="text-xl font-bold text-violet-600">
                  {formatCurrency(yearlyStats.yearToDateTotal)}
                </p>
              ) : (
                <Skeleton className="h-7 w-24" />
              )}
              <p className="text-[10px] text-muted-foreground mt-0.5">Year to Date</p>
            </CardContent>
          </Card>
        </div>

        {/* Month Selector */}
        <div className="flex items-center justify-between bg-muted/50 rounded-lg p-2">
          <Button variant="ghost" size="icon" onClick={() => navigateMonth("prev")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{format(selectedMonth, "MMMM yyyy")}</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigateMonth("next")}
            disabled={format(selectedMonth, "yyyy-MM") === format(new Date(), "yyyy-MM")}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Stats Cards */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <PoundSterling className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs text-muted-foreground">Total Income</span>
                </div>
                <p className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(stats?.totalIncome || 0)}
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-xs text-muted-foreground">Hours Worked</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {stats?.totalHours || 0}h
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Lessons</span>
                </div>
                <p className="text-2xl font-bold">{stats?.lessonCount || 0}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <PoundSterling className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Payments</span>
                </div>
                <p className="text-2xl font-bold">{stats?.paymentCount || 0}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Payment Records */}
        <div className="space-y-3">
          <h2 className="font-semibold">Payment History</h2>
          
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 rounded-lg" />
              <Skeleton className="h-16 rounded-lg" />
              <Skeleton className="h-16 rounded-lg" />
            </div>
          ) : incomeRecords.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <PoundSterling className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No payments this month</p>
              </CardContent>
            </Card>
          ) : (
            incomeRecords.map((record) => (
              <Card key={record.id}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{record.pupil_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(record.recorded_at), "d MMM yyyy, HH:mm")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-emerald-600">
                        {formatCurrency(record.amount)}
                      </p>
                      <Badge variant="secondary" className="text-[10px] capitalize">
                        {record.payment_method}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </InstructorPortalLayout>
  );
}
