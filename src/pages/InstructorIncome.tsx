import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from "date-fns";
import { TrendingUp, Calendar, PoundSterling, ChevronLeft, ChevronRight, Users, Clock } from "lucide-react";
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

export default function InstructorIncome() {
  const { instructor } = useInstructorAuth();
  const instructorId = instructor?.id;
  
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [incomeRecords, setIncomeRecords] = useState<IncomeRecord[]>([]);
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (instructorId) {
      fetchIncomeData();
    }
  }, [instructorId, selectedMonth]);

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
