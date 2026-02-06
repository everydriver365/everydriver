import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  CreditCard, 
  TrendingUp, 
  PoundSterling, 
  Calendar, 
  Clock,
  ChevronRight,
  QrCode,
  History,
  Receipt,
  Wallet,
  Users,
  ArrowUpRight,
  Gift
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PaymentQRModal } from "@/components/instructor/PaymentQRModal";
import { PaymentHistory } from "@/components/instructor/PaymentHistory";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { useDailyEarnings } from "@/hooks/useDailyEarnings";
import { EarningsChart } from "@/components/instructor/money/EarningsChart";
import { WeeklyComparisonBar } from "@/components/instructor/money/WeeklyComparisonBar";
import { PupilBalancesList } from "@/components/instructor/money/PupilBalancesList";

interface Pupil {
  id: string;
  name: string;
  account_balance: number | null;
  phone: string | null;
}

export default function InstructorPay() {
  const { instructor: authInstructor } = useInstructorAuth();
  const instructorId = authInstructor?.id;
  
  const { data: earnings, isLoading } = useDailyEarnings(instructorId);
  const [paymentQrUrl, setPaymentQrUrl] = useState<string | null>(null);
  const [instructorName, setInstructorName] = useState<string>("Your Instructor");
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [pupils, setPupils] = useState<Pupil[]>([]);

  useEffect(() => {
    if (instructorId) {
      fetchInstructor();
      fetchPupils();
    }
  }, [instructorId]);

  const fetchInstructor = async () => {
    if (!instructorId) return;
    const { data } = await supabase
      .from("instructors")
      .select("payment_qr_url, name")
      .eq("id", instructorId)
      .maybeSingle();
    if (data) {
      setPaymentQrUrl(data.payment_qr_url);
      setInstructorName(data.name || "Your Instructor");
    }
  };

  const fetchPupils = async () => {
    if (!instructorId) return;
    const { data } = await supabase
      .from("pupils")
      .select("id, name, account_balance, phone")
      .eq("instructor_id", instructorId)
      .order("name", { ascending: true });
    setPupils(data || []);
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

  const monthlyChange = earnings?.lastMonth && earnings.lastMonth > 0
    ? Math.round(((earnings.thisMonth - earnings.lastMonth) / earnings.lastMonth) * 100)
    : 0;

  return (
    <InstructorPortalLayout>
      <div className="space-y-4 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <PoundSterling className="h-5 w-5 text-primary" />
            Money
          </h1>
          <Button size="sm" onClick={() => setPaymentModalOpen(true)}>
            <QrCode className="h-4 w-4 mr-1.5" />
            Take Payment
          </Button>
        </div>

        {/* Main Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5 text-white" style={{ background: 'linear-gradient(to bottom right, #1877F2, #1466d8)' }}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-primary-foreground/70 text-sm">This Month</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">
                  £{isLoading ? "—" : earnings?.thisMonth || 0}
                </span>
                {monthlyChange !== 0 && (
                  <span className={`text-sm font-medium flex items-center gap-0.5 ${
                    monthlyChange > 0 ? "text-emerald-300" : "text-rose-300"
                  }`}>
                    <ArrowUpRight className={`h-3.5 w-3.5 ${monthlyChange < 0 ? "rotate-90" : ""}`} />
                    {Math.abs(monthlyChange)}%
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-primary-foreground/70 text-sm">Hours</p>
              <p className="text-2xl font-bold">{earnings?.hoursThisMonth || 0}h</p>
            </div>
          </div>

          {/* Mini Chart */}
          <div className="mt-2 -mx-1">
            <EarningsChart 
              data={earnings?.dailyEarnings || []} 
              isLoading={isLoading} 
            />
          </div>
          <p className="text-xs text-primary-foreground/60 text-center mt-2">
            Last 14 days
          </p>
        </motion.div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-xl border p-3 text-center"
          >
            <Calendar className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-lg font-bold">£{earnings?.thisWeek || 0}</p>
            <p className="text-[10px] text-muted-foreground">This Week</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-card rounded-xl border p-3 text-center"
          >
            <History className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-lg font-bold">£{earnings?.lastMonth || 0}</p>
            <p className="text-[10px] text-muted-foreground">Last Month</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-xl border p-3 text-center"
          >
            <Clock className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-lg font-bold">£{earnings?.hourlyRate || 40}</p>
            <p className="text-[10px] text-muted-foreground">Per Hour</p>
          </motion.div>
        </div>

        {/* Week Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-card rounded-xl border p-4"
        >
          <WeeklyComparisonBar 
            thisWeek={earnings?.thisWeek || 0} 
            lastWeek={earnings?.lastWeek || 0} 
          />
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/instructor/accounts">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card rounded-xl border p-4 hover:bg-muted/50 transition-colors h-full"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-violet-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Accounts</p>
                  <p className="text-xs text-muted-foreground">Full breakdown</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </motion.div>
          </Link>
          <Link to="/instructor/expenses">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-card rounded-xl border p-4 hover:bg-muted/50 transition-colors h-full"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                  <Receipt className="h-5 w-5 text-rose-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Expenses</p>
                  <p className="text-xs text-muted-foreground">Track costs</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </motion.div>
          </Link>
        </div>

        {/* Recent Payments */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-xl border"
        >
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" />
              Recent Payments
            </h3>
            <Link to="/instructor/accounts" className="text-xs text-primary font-medium">
              See all
            </Link>
          </div>
          <div className="p-4">
            <PaymentHistory instructorId={instructorId} limit={5} />
          </div>
        </motion.div>

        {/* Pupil Balances */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-card rounded-xl border"
        >
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Pupil Balances
            </h3>
            <Link to="/instructor/accounts" className="text-xs text-primary font-medium">
              View all
            </Link>
          </div>
          <div className="p-4">
            <PupilBalancesList pupils={pupils} limit={5} />
          </div>
        </motion.div>
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
