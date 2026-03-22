import { useState, useEffect } from "react";
import { PoundSterling, TrendingUp, Crown, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { subDays } from "date-fns";

export default function InstructorIncomeFreeSummary() {
  const { instructor } = useInstructorAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [totalIncome, setTotalIncome] = useState(0);
  const [paymentCount, setPaymentCount] = useState(0);
  const [topMethod, setTopMethod] = useState("—");

  useEffect(() => {
    if (!instructor?.id) return;
    const fetch = async () => {
      const since = subDays(new Date(), 30).toISOString();
      // @ts-ignore
      const { data, error } = await supabase
        .from("payment_history")
        .select("amount, payment_method")
        .eq("instructor_id", instructor.id)
        .gte("recorded_at", since);
      if (!error && data) {
        const total = data.reduce((s: number, r: any) => s + (r.amount || 0), 0);
        setTotalIncome(total);
        setPaymentCount(data.length);
        const methods: Record<string, number> = {};
        data.forEach((r: any) => {
          methods[r.payment_method] = (methods[r.payment_method] || 0) + 1;
        });
        const top = Object.entries(methods).sort((a, b) => b[1] - a[1])[0];
        if (top) setTopMethod(top[0].replace("_", " "));
      }
      setLoading(false);
    };
    fetch();
  }, [instructor?.id]);

  return (
    <InstructorPortalLayout title="Income">
      <div className="space-y-4 p-4">
        <h1 className="text-xl font-bold">Income Summary</h1>
        <p className="text-sm text-muted-foreground">Last 30 days overview</p>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                  <PoundSterling className="h-3.5 w-3.5" /> Total Income
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">£{totalIncome.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5" /> Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{paymentCount}</p>
                <p className="text-xs text-muted-foreground capitalize">Top: {topMethod}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Blurred teaser */}
        <div className="relative rounded-xl border overflow-hidden">
          <div className="blur-sm pointer-events-none p-4 space-y-3 opacity-60">
            <div className="flex justify-between items-center">
              <span className="font-medium text-sm">Financial Year Total</span>
              <span className="text-lg font-bold">£12,450.00</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-sm">Year-to-Date</span>
              <span className="text-lg font-bold">£8,320.00</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-sm">Monthly Breakdown</span>
              <span className="text-lg font-bold">Chart</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-sm">HMRC Export</span>
              <span className="text-lg font-bold">CSV / PDF</span>
            </div>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[2px]">
            <Lock className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm font-semibold text-foreground mb-1">Full Income Dashboard</p>
            <p className="text-xs text-muted-foreground text-center max-w-[240px] mb-3">
              Financial year totals, monthly breakdowns, HMRC exports, and more
            </p>
            <Button size="sm" onClick={() => navigate("/instructor/plans")} className="gap-1.5">
              <Crown className="h-3.5 w-3.5" /> Upgrade to All-In
            </Button>
          </div>
        </div>
      </div>
    </InstructorPortalLayout>
  );
}
