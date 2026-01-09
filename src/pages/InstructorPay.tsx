import { useState, useEffect } from "react";
import { CreditCard, TrendingUp, PoundSterling, Calendar, Gift } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InstructorBottomNav } from "@/components/instructor/InstructorBottomNav";
import { PaymentQRModal } from "@/components/instructor/PaymentQRModal";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths } from "date-fns";

const MOCK_INSTRUCTOR_ID = "b7987d5e-348f-4047-a8d4-ee71fab1f01d";

interface EarningsSummary {
  thisWeek: number;
  thisMonth: number;
  lastMonth: number;
  hoursThisMonth: number;
  bonusEarned: number;
}

export default function InstructorPay() {
  const [earnings, setEarnings] = useState<EarningsSummary>({
    thisWeek: 0,
    thisMonth: 0,
    lastMonth: 0,
    hoursThisMonth: 0,
    bonusEarned: 0,
  });
  const [hourlyRate, setHourlyRate] = useState<number>(40);
  const [paymentQrUrl, setPaymentQrUrl] = useState<string | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch instructor hourly rate and payment QR
      const { data: instructor } = await supabase
        .from("instructors")
        .select("hourly_rate, payment_qr_url")
        .eq("id", MOCK_INSTRUCTOR_ID)
        .single();

      if (instructor) {
        setHourlyRate(instructor.hourly_rate || 40);
        setPaymentQrUrl(instructor.payment_qr_url);
      }

      // Bonus earned - will be 0 until database column is added
      const bonusAmount = 0;

      const now = new Date();
      const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
      const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
      const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
      const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");
      const lastMonthStart = format(startOfMonth(subMonths(now, 1)), "yyyy-MM-dd");
      const lastMonthEnd = format(endOfMonth(subMonths(now, 1)), "yyyy-MM-dd");

      // Fetch lesson history for earnings
      const { data: thisWeekData } = await supabase
        .from("lesson_history")
        .select("duration_minutes")
        .eq("instructor_id", MOCK_INSTRUCTOR_ID)
        .gte("lesson_date", weekStart)
        .lte("lesson_date", weekEnd);

      const { data: thisMonthData } = await supabase
        .from("lesson_history")
        .select("duration_minutes")
        .eq("instructor_id", MOCK_INSTRUCTOR_ID)
        .gte("lesson_date", monthStart)
        .lte("lesson_date", monthEnd);

      const { data: lastMonthData } = await supabase
        .from("lesson_history")
        .select("duration_minutes")
        .eq("instructor_id", MOCK_INSTRUCTOR_ID)
        .gte("lesson_date", lastMonthStart)
        .lte("lesson_date", lastMonthEnd);

      const rate = instructor?.hourly_rate || 40;
      const thisWeekHours = (thisWeekData?.reduce((sum, l) => sum + l.duration_minutes, 0) || 0) / 60;
      const thisMonthHours = (thisMonthData?.reduce((sum, l) => sum + l.duration_minutes, 0) || 0) / 60;
      const lastMonthHours = (lastMonthData?.reduce((sum, l) => sum + l.duration_minutes, 0) || 0) / 60;

      setEarnings({
        thisWeek: Math.round(thisWeekHours * rate),
        thisMonth: Math.round(thisMonthHours * rate),
        lastMonth: Math.round(lastMonthHours * rate),
        hoursThisMonth: Math.round(thisMonthHours),
        bonusEarned: bonusAmount,
      });
    } catch (error) {
      console.error("Error fetching earnings:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="px-3 md:container py-4 pb-24 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Earnings & Payments
          </h1>
        </div>

        {/* Take Payment Button */}
        <Button 
          className="w-full gap-2" 
          size="lg"
          onClick={() => setPaymentModalOpen(true)}
        >
          <CreditCard className="h-5 w-5" />
          Take Payment (Show QR)
        </Button>

        {/* Earnings Summary */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-xs">This Week</span>
              </div>
              <div className="text-2xl font-bold">£{earnings.thisWeek}</div>
            </CardContent>
          </Card>
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-primary-foreground/70 mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs">This Month</span>
              </div>
              <div className="text-2xl font-bold">£{earnings.thisMonth}</div>
            </CardContent>
          </Card>
        </div>

        {/* Bonus Earned */}
        <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-white/80 mb-1">
              <Gift className="h-4 w-4" />
              <span className="text-xs">Bonus Earned</span>
            </div>
            <div className="text-2xl font-bold">£{earnings.bonusEarned}</div>
            <p className="text-xs text-white/70 mt-1">£50 per completed course</p>
          </CardContent>
        </Card>

        {/* Details */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Earnings Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Hourly Rate</span>
              <span className="font-semibold">£{hourlyRate}/hr</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Hours This Month</span>
              <span className="font-semibold">{earnings.hoursThisMonth} hrs</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Last Month</span>
              <span className="font-semibold">£{earnings.lastMonth}</span>
            </div>
          </CardContent>
        </Card>

        {/* Outstanding Payments */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <PoundSterling className="h-4 w-4" />
              Outstanding from Pupils
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-4">
              No outstanding payments
            </p>
          </CardContent>
        </Card>
      </div>

      <PaymentQRModal 
        open={paymentModalOpen} 
        onOpenChange={setPaymentModalOpen}
        paymentQrUrl={paymentQrUrl}
      />
      <InstructorBottomNav />
    </MainLayout>
  );
}
