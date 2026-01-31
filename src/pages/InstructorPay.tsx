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
  ArrowDownRight
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
import { Link } from "react-router-dom";

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

  // Calculate month-over-month change
  const monthChange = earnings.lastMonth > 0 
    ? Math.round(((earnings.thisMonth - earnings.lastMonth) / earnings.lastMonth) * 100)
    : earnings.thisMonth > 0 ? 100 : 0;

  if (!instructorId) {
    return (
      <InstructorPortalLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </InstructorPortalLayout>
    );
  }

  // Mobile Layout
  if (isMobile) {
    return (
      <InstructorPortalLayout>
        <div className="space-y-4 pb-4">
          {/* Hero Stats Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 p-5 text-primary-foreground shadow-lg"
          >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-primary-foreground/70 uppercase tracking-wider">This Month</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">£{earnings.thisMonth}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {monthChange !== 0 && (
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${monthChange >= 0 ? 'bg-emerald-500/20 text-emerald-100' : 'bg-red-500/20 text-red-100'}`}
                    >
                      {monthChange >= 0 ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                      {Math.abs(monthChange)}%
                    </Badge>
                  )}
                  <span className="text-xs text-primary-foreground/60">vs last month</span>
                </div>
              </div>
              
              {/* Mini stats row */}
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/10">
                <div>
                  <p className="text-[10px] text-primary-foreground/60 uppercase">This Week</p>
                  <p className="text-lg font-semibold">£{earnings.thisWeek}</p>
                </div>
                <div>
                  <p className="text-[10px] text-primary-foreground/60 uppercase">Hours</p>
                  <p className="text-lg font-semibold">{earnings.hoursThisMonth}h</p>
                </div>
                <div>
                  <p className="text-[10px] text-primary-foreground/60 uppercase">Rate</p>
                  <p className="text-lg font-semibold">£{hourlyRate}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={() => setPaymentModalOpen(true)}
                className="w-full h-auto p-4 flex flex-col items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg"
              >
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <QrCode className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">Take Payment</span>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link to="/instructor/accounts">
                <Card className="h-full bg-card/80 backdrop-blur-sm border-border/50 hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex flex-col items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-violet-500/15 flex items-center justify-center">
                      <Wallet className="h-5 w-5 text-violet-600" />
                    </div>
                    <span className="text-sm font-medium text-foreground">Accounts</span>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link to="/instructor/expenses">
                <Card className="h-full bg-card/80 backdrop-blur-sm border-border/50 hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex flex-col items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-rose-500/15 flex items-center justify-center">
                      <Receipt className="h-5 w-5 text-rose-500" />
                    </div>
                    <span className="text-sm font-medium text-foreground">Expenses</span>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className="h-full bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0 shadow-lg">
                <CardContent className="p-4 flex flex-col items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Gift className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium">£{earnings.bonusEarned}</span>
                  <span className="text-[10px] text-white/70">Bonus Earned</span>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Tabbed Content */}
          <Tabs defaultValue="history" className="w-full">
            <TabsList className="w-full grid grid-cols-2 h-11">
              <TabsTrigger value="history" className="gap-1.5 text-sm">
                <History className="h-4 w-4" />
                History
              </TabsTrigger>
              <TabsTrigger value="details" className="gap-1.5 text-sm">
                <TrendingUp className="h-4 w-4" />
                Details
              </TabsTrigger>
            </TabsList>

            <TabsContent value="history" className="mt-3">
              <PaymentHistory instructorId={instructorId} limit={15} />
            </TabsContent>

            <TabsContent value="details" className="mt-3 space-y-3">
              {/* Earnings Breakdown */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <PoundSterling className="h-4 w-4 text-primary" />
                    Earnings Breakdown
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-2.5 border-b">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">This Week</span>
                      </div>
                      <span className="font-semibold">£{earnings.thisWeek}</span>
                    </div>
                    <div className="flex items-center justify-between py-2.5 border-b">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">This Month</span>
                      </div>
                      <span className="font-semibold text-primary">£{earnings.thisMonth}</span>
                    </div>
                    <div className="flex items-center justify-between py-2.5 border-b">
                      <div className="flex items-center gap-2">
                        <History className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Last Month</span>
                      </div>
                      <span className="font-semibold">£{earnings.lastMonth}</span>
                    </div>
                    <div className="flex items-center justify-between py-2.5 border-b">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Hours This Month</span>
                      </div>
                      <span className="font-semibold">{earnings.hoursThisMonth}h</span>
                    </div>
                    <div className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Hourly Rate</span>
                      </div>
                      <span className="font-semibold">£{hourlyRate}/hr</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Links */}
              <Card>
                <CardContent className="p-0">
                  <Link 
                    to="/instructor/accounts" 
                    className="flex items-center justify-between p-4 border-b hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-violet-500/15 flex items-center justify-center">
                        <Wallet className="h-4 w-4 text-violet-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Income & Expenses</p>
                        <p className="text-xs text-muted-foreground">View full accounts breakdown</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </Link>
                  <Link 
                    to="/instructor/expenses" 
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-rose-500/15 flex items-center justify-center">
                        <Receipt className="h-4 w-4 text-rose-500" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Expense Tracker</p>
                        <p className="text-xs text-muted-foreground">Log fuel, insurance & more</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </Link>
                </CardContent>
              </Card>
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

  // Desktop Layout (existing)
  return (
    <InstructorPortalLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Earnings & Payments
          </h1>
        </div>

        <Button 
          className="w-full gap-2" 
          size="lg"
          onClick={() => setPaymentModalOpen(true)}
        >
          <CreditCard className="h-5 w-5" />
          Take Payment (Show QR)
        </Button>

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

        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold">Earnings Details</h3>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Hourly Rate</span>
              <span className="font-semibold">£{hourlyRate}/hr</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Hours This Month</span>
              <span className="font-semibold">{earnings.hoursThisMonth} hrs</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Last Month</span>
              <span className="font-semibold">£{earnings.lastMonth}</span>
            </div>
          </CardContent>
        </Card>

        <PaymentHistory instructorId={instructorId} limit={15} />
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