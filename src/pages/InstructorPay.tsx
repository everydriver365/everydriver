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
import { TakePaymentModal } from "@/components/instructor/TakePaymentModal";
import { PaymentHistory } from "@/components/instructor/PaymentHistory";
import { InstructorPayoutHistory } from "@/components/instructor/InstructorPayoutHistory";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { useDailyEarnings } from "@/hooks/useDailyEarnings";
import { EarningsChart } from "@/components/instructor/money/EarningsChart";
import { WeeklyComparisonBar } from "@/components/instructor/money/WeeklyComparisonBar";
import { PupilBalancesList } from "@/components/instructor/money/PupilBalancesList";
import { EarningsForecaster } from "@/components/instructor/EarningsForecaster";
import { OwesMoneyCard } from "@/components/instructor/money/OwesMoneyCard";

import { getActivePaymentQrUrl } from "@/lib/getActivePaymentQrUrl";

interface Pupil {
  id: string;
  name: string;
  account_balance: number | null;
  phone: string | null;
  email: string | null;
}

export default function InstructorPay() {
  const { instructor: authInstructor } = useInstructorAuth();
  const instructorId = authInstructor?.id;
  
  const { data: earnings, isLoading } = useDailyEarnings(instructorId);
  const [resolvedQrUrl, setResolvedQrUrl] = useState<string | null>(null);
  const [commissionPayer, setCommissionPayer] = useState<string | null>('pupil');
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
      .select("payment_qr_url, payment_qr_url_pupil_pays, payment_qr_url_instructor_pays, commission_payer, name")
      .eq("id", instructorId)
      .maybeSingle();
    if (data) {
      setResolvedQrUrl(getActivePaymentQrUrl(data));
      setCommissionPayer(data.commission_payer);
      setInstructorName(data.name || "Your Instructor");
    }
  };

  const fetchPupils = async () => {
    if (!instructorId) return;
    const { data } = await supabase
      .from("pupils")
      .select("id, name, account_balance, phone, email")
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
            <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <PoundSterling className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            Money
          </h1>
          <Button size="sm" className="bg-primary hover:bg-primary/90 text-white" onClick={() => setPaymentModalOpen(true)}>
            <QrCode className="h-4 w-4 mr-1.5" />
            Take Payment
          </Button>
        </div>

        {/* Main Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4 text-white bg-gradient-to-br from-primary via-primary/85 to-primary/70"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-xs">This Month</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">
                  £{isLoading ? "—" : earnings?.thisMonth || 0}
                </span>
                {monthlyChange !== 0 && (
                  <span className={`text-xs font-medium flex items-center gap-0.5 ${
                    monthlyChange > 0 ? "text-emerald-300" : "text-rose-300"
                  }`}>
                    <ArrowUpRight className={`h-3 w-3 ${monthlyChange < 0 ? "rotate-90" : ""}`} />
                    {Math.abs(monthlyChange)}%
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/70 text-xs">Hours</p>
              <p className="text-xl font-bold">{earnings?.hoursThisMonth || 0}h</p>
            </div>
          </div>
        </motion.div>

        {/* Owes Money - debtors first */}
        <OwesMoneyCard pupils={pupils} instructorId={instructorId} instructorName={instructorName} paymentLink={resolvedQrUrl} />

        {/* Quick Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-xl border p-3 text-center"
          >
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-1">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <p className="text-lg font-bold">£{earnings?.thisWeek || 0}</p>
            <p className="text-[10px] text-muted-foreground">This Week</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-card rounded-xl border p-3 text-center"
          >
            <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-1">
              <History className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-lg font-bold">£{earnings?.lastMonth || 0}</p>
            <p className="text-[10px] text-muted-foreground">Last Month</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-xl border p-3 text-center"
          >
            <div className="h-8 w-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mx-auto mb-1">
              <Clock className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
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
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-primary" />
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
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Receipt className="h-5 w-5 text-primary" />
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

        {/* Payouts from Admin */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42 }}
        >
          <InstructorPayoutHistory instructorId={instructorId} />
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

        {/* Earnings Forecaster */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <EarningsForecaster instructorId={instructorId} />
        </motion.div>

      </div>

      <TakePaymentModal
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        paymentQrUrl={resolvedQrUrl}
        commissionPayer={commissionPayer}
        commissionSplitPercent={instructor?.commission_split_percent}
        instructorName={instructorName}
        instructorId={instructorId}
        pupils={pupils}
      />
    </InstructorPortalLayout>
  );
}
