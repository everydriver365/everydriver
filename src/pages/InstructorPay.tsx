import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  CreditCard, 
  TrendingUp, 
  PoundSterling, 
  Calendar, 
  Gift,
  Clock,
  ChevronRight,
  QrCode,
  History,
  Receipt,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Users
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaymentQRModal } from "@/components/instructor/PaymentQRModal";
import { PaymentHistory } from "@/components/instructor/PaymentHistory";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths } from "date-fns";
import { Link, useSearchParams } from "react-router-dom";

// New redesigned components
import { MoneyHeroCard } from "@/components/instructor/money/MoneyHeroCard";
import { MoneyActionGrid } from "@/components/instructor/money/MoneyActionGrid";
import { MoneyQuickStats } from "@/components/instructor/money/MoneyQuickStats";
import { PupilBalancesList } from "@/components/instructor/money/PupilBalancesList";
import { RecentPaymentsCard } from "@/components/instructor/money/RecentPaymentsCard";
import { GlassCard } from "@/components/ui/GlassCard";

interface EarningsSummary {
  thisWeek: number;
  thisMonth: number;
  lastMonth: number;
  hoursThisMonth: number;
  bonusEarned: number;
}

interface Pupil {
  id: string;
  name: string;
  account_balance: number | null;
  phone: string | null;
}

export default function InstructorPay() {
  const { instructor: authInstructor } = useInstructorAuth();
  const instructorId = authInstructor?.id;
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "overview";
  
  const [earnings, setEarnings] = useState<EarningsSummary>({
    thisWeek: 0,
    thisMonth: 0,
    lastMonth: 0,
    hoursThisMonth: 0,
    bonusEarned: 0,
  });
  const [hourlyRate, setHourlyRate] = useState<number>(40);
  const [paymentQrUrl, setPaymentQrUrl] = useState<string | null>(null);
  const [instructorName, setInstructorName] = useState<string>("Your Instructor");
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pupils, setPupils] = useState<Pupil[]>([]);

  useEffect(() => {
    if (instructorId) {
      fetchData();
      fetchPupils();
    }
  }, [instructorId]);

  const fetchPupils = async () => {
    if (!instructorId) return;
    try {
      const { data, error } = await supabase
        .from("pupils")
        .select("id, name, account_balance, phone")
        .eq("instructor_id", instructorId)
        .order("name", { ascending: true });

      if (error) throw error;
      setPupils(data || []);
    } catch (error) {
      console.error("Error fetching pupils:", error);
    }
  };

  const fetchData = async () => {
    if (!instructorId) return;
    try {
      const { data: instructor } = await supabase
        .from("instructors")
        .select("hourly_rate, payment_qr_url, bonus_earned, name")
        .eq("id", instructorId)
        .single();

      if (instructor) {
        setHourlyRate(instructor.hourly_rate || 40);
        setPaymentQrUrl(instructor.payment_qr_url);
        setInstructorName(instructor.name || "Your Instructor");
      }

      const bonusAmount = instructor?.bonus_earned || 0;

      const now = new Date();
      const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
      const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
      const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
      const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");
      const lastMonthStart = format(startOfMonth(subMonths(now, 1)), "yyyy-MM-dd");
      const lastMonthEnd = format(endOfMonth(subMonths(now, 1)), "yyyy-MM-dd");

      const { data: thisWeekData } = await supabase
        .from("lesson_history")
        .select("duration_minutes")
        .eq("instructor_id", instructorId)
        .gte("lesson_date", weekStart)
        .lte("lesson_date", weekEnd);

      const { data: thisMonthData } = await supabase
        .from("lesson_history")
        .select("duration_minutes")
        .eq("instructor_id", instructorId)
        .gte("lesson_date", monthStart)
        .lte("lesson_date", monthEnd);

      const { data: lastMonthData } = await supabase
        .from("lesson_history")
        .select("duration_minutes")
        .eq("instructor_id", instructorId)
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

  if (!instructorId) {
    return (
      <InstructorPortalLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </InstructorPortalLayout>
    );
  }

  // Mobile Layout - Completely redesigned
  if (isMobile) {
    return (
      <InstructorPortalLayout>
        <div className="space-y-4 pb-24">
          {/* Hero Card with animated progress ring */}
          <MoneyHeroCard
            thisMonth={earnings.thisMonth}
            lastMonth={earnings.lastMonth}
            thisWeek={earnings.thisWeek}
            hoursThisMonth={earnings.hoursThisMonth}
            hourlyRate={hourlyRate}
            isLoading={loading}
          />

          {/* Quick Stats Chips */}
          <MoneyQuickStats
            thisWeek={earnings.thisWeek}
            thisMonth={earnings.thisMonth}
            lastMonth={earnings.lastMonth}
            hoursThisMonth={earnings.hoursThisMonth}
            hourlyRate={hourlyRate}
          />

          {/* Bento Action Grid */}
          <MoneyActionGrid
            bonusEarned={earnings.bonusEarned}
            onTakePayment={() => setPaymentModalOpen(true)}
          />

          {/* Tabbed Content */}
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="w-full grid grid-cols-3 h-12 bg-muted/50 backdrop-blur-sm">
              <TabsTrigger value="overview" className="gap-1.5 text-xs data-[state=active]:bg-background">
                <TrendingUp className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-1.5 text-xs data-[state=active]:bg-background">
                <History className="h-4 w-4" />
                History
              </TabsTrigger>
              <TabsTrigger value="balances" className="gap-1.5 text-xs data-[state=active]:bg-background">
                <Users className="h-4 w-4" />
                Balances
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-4">
              {/* Recent Payments */}
              <GlassCard className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-primary" />
                    Recent Payments
                  </h3>
                  <Link 
                    to="/instructor/pay?tab=history"
                    className="text-xs text-primary font-medium"
                  >
                    See all
                  </Link>
                </div>
                <RecentPaymentsCard instructorId={instructorId} limit={4} />
              </GlassCard>

              {/* Earnings Breakdown */}
              <GlassCard className="p-4">
                <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                  <PoundSterling className="h-4 w-4 text-primary" />
                  Earnings Breakdown
                </h3>
                
                <div className="space-y-2.5">
                  {[
                    { label: "This Week", value: earnings.thisWeek, icon: Calendar },
                    { label: "This Month", value: earnings.thisMonth, icon: TrendingUp, highlight: true },
                    { label: "Last Month", value: earnings.lastMonth, icon: History },
                    { label: "Hours This Month", value: `${earnings.hoursThisMonth}h`, icon: Clock, isHours: true },
                    { label: "Hourly Rate", value: `£${hourlyRate}/hr`, icon: CreditCard, isRate: true },
                  ].map((item, index) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center">
                          <item.icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                      </div>
                      <span className={`font-semibold ${item.highlight ? 'text-primary' : ''}`}>
                        {item.isHours || item.isRate ? item.value : `£${item.value}`}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </GlassCard>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <PaymentHistory instructorId={instructorId} limit={20} />
            </TabsContent>

            <TabsContent value="balances" className="mt-4">
              <GlassCard className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Pupil Balances
                  </h3>
                  <Link 
                    to="/instructor/accounts"
                    className="text-xs text-primary font-medium"
                  >
                    Full accounts
                  </Link>
                </div>
                <PupilBalancesList pupils={pupils} limit={10} />
              </GlassCard>
            </TabsContent>
          </Tabs>
        </div>

        <PaymentQRModal 
          open={paymentModalOpen} 
          onOpenChange={setPaymentModalOpen}
          paymentQrUrl={paymentQrUrl}
          pupils={pupils}
          instructorId={instructorId}
          instructorName={instructorName}
          onPaymentRecorded={fetchPupils}
        />
      </InstructorPortalLayout>
    );
  }

  // Desktop Layout (keep existing)
  return (
    <InstructorPortalLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Payments & Earnings
          </h1>
          <Button onClick={() => setPaymentModalOpen(true)}>
            <QrCode className="mr-2 h-4 w-4" />
            Take Payment
          </Button>
        </div>

        {/* Desktop Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <PoundSterling className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">This Month</p>
                  <p className="text-xl font-bold">£{earnings.thisMonth}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">This Week</p>
                  <p className="text-xl font-bold">£{earnings.thisWeek}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Hours This Month</p>
                  <p className="text-xl font-bold">{earnings.hoursThisMonth}h</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <Gift className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Bonus Earned</p>
                  <p className="text-xl font-bold">£{earnings.bonusEarned}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Desktop Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Payment History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PaymentHistory instructorId={instructorId} limit={10} />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Pupil Balances
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PupilBalancesList pupils={pupils} limit={5} />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 space-y-2">
                <Link 
                  to="/instructor/accounts"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Wallet className="h-5 w-5 text-violet-600" />
                    <span className="font-medium">Full Accounts</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Link>
                <Link 
                  to="/instructor/expenses"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Receipt className="h-5 w-5 text-rose-500" />
                    <span className="font-medium">Expenses</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <PaymentQRModal 
        open={paymentModalOpen} 
        onOpenChange={setPaymentModalOpen}
        paymentQrUrl={paymentQrUrl}
        pupils={pupils}
        instructorId={instructorId}
        instructorName={instructorName}
        onPaymentRecorded={fetchPupils}
      />
    </InstructorPortalLayout>
  );
}
