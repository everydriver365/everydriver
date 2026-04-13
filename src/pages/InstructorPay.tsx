import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PoundSterling,
  QrCode,
  Wallet,
  Receipt,
  Gift,
  Car,
  Calculator,
  Users,
  ArrowUpRight,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  Trophy,
  MessageSquare,
  Mail,
  Loader2,
} from "lucide-react";
import { TakePaymentModal } from "@/components/instructor/TakePaymentModal";
import { PaymentHistory } from "@/components/instructor/PaymentHistory";
import { InstructorPayoutHistory } from "@/components/instructor/InstructorPayoutHistory";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { useDailyEarnings } from "@/hooks/useDailyEarnings";
import { PupilBalancesList } from "@/components/instructor/money/PupilBalancesList";
import { Button } from "@/components/ui/button";
import { EarningsForecaster } from "@/components/instructor/EarningsForecaster";
import { getActivePaymentQrUrl } from "@/lib/getActivePaymentQrUrl";
import { haptics } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Pupil {
  id: string;
  name: string;
  account_balance: number | null;
  phone: string | null;
  email: string | null;
}

interface QuickAction {
  id: string;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  href?: string;
  onClick?: () => void;
  accent?: boolean;
}

export default function InstructorPay() {
  const { instructor: authInstructor } = useInstructorAuth();
  const instructorId = authInstructor?.id;

  const { data: earnings, isLoading } = useDailyEarnings(instructorId);
  const [resolvedQrUrl, setResolvedQrUrl] = useState<string | null>(null);
  const [commissionPayer, setCommissionPayer] = useState<string | null>("pupil");
  const [instructorName, setInstructorName] = useState<string>("Your Instructor");
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [pupils, setPupils] = useState<Pupil[]>([]);
  const [bonusEarned, setBonusEarned] = useState(0);
  const [recentPaymentCount, setRecentPaymentCount] = useState(0);
  const [owesExpanded, setOwesExpanded] = useState(false);
  const [paymentsExpanded, setPaymentsExpanded] = useState(false);
  const [bonusExpanded, setBonusExpanded] = useState(false);
  const [balancesExpanded, setBalancesExpanded] = useState(false);
  const [chasing, setChasing] = useState<string | null>(null);

  useEffect(() => {
    if (instructorId) {
      fetchInstructor();
      fetchPupils();
      fetchRecentPaymentCount();
    }
  }, [instructorId]);

  const fetchInstructor = async () => {
    if (!instructorId) return;
    const { data } = await supabase
      .from("instructors")
      .select("payment_qr_url, payment_qr_url_pupil_pays, payment_qr_url_instructor_pays, commission_payer, name, bonus_earned")
      .eq("id", instructorId)
      .maybeSingle();
    if (data) {
      setResolvedQrUrl(getActivePaymentQrUrl(data));
      setCommissionPayer(data.commission_payer);
      setInstructorName(data.name || "Your Instructor");
      setBonusEarned(data.bonus_earned || 0);
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

  const fetchRecentPaymentCount = async () => {
    if (!instructorId) return;
    const { count } = await supabase
      .from("payment_history")
      .select("id", { count: "exact", head: true })
      .eq("instructor_id", instructorId);
    setRecentPaymentCount(count || 0);
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

  const monthlyChange =
    earnings?.lastMonth && earnings.lastMonth > 0
      ? Math.round(((earnings.thisMonth - earnings.lastMonth) / earnings.lastMonth) * 100)
      : 0;

  const thisMonth = isLoading ? "—" : (earnings?.thisMonth || 0);
  const thisWeek = earnings?.thisWeek || 0;
  const lastMonth = earnings?.lastMonth || 0;

  const debtors = pupils.filter((p) => (p.account_balance || 0) < 0).sort((a, b) => (a.account_balance || 0) - (b.account_balance || 0));
  const totalOwed = debtors.reduce((sum, p) => sum + Math.abs(p.account_balance || 0), 0);

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const handleChase = async (pupil: Pupil, method: "sms" | "email") => {
    const key = `${pupil.id}-${method}`;
    setChasing(key);
    try {
      const amount = Math.abs(pupil.account_balance || 0).toFixed(2);
      const paymentLinkLine = resolvedQrUrl ? `\n\nPay now: ${resolvedQrUrl}` : "";
      if (method === "sms") {
        if (!pupil.phone) { toast.error("No phone number on file"); return; }
        await supabase.functions.invoke("send-sms", {
          body: { to: pupil.phone, message: `Hi ${pupil.name.split(" ")[0]}, friendly reminder from ${instructorName} — you have an outstanding balance of £${amount}.${paymentLinkLine} Thank you!` },
        });
        toast.success(`SMS reminder sent to ${pupil.name}`);
      } else {
        if (!pupil.email) { toast.error("No email on file"); return; }
        const paymentLinkHtml = resolvedQrUrl ? `<p><a href="${resolvedQrUrl}" style="display:inline-block;padding:12px 24px;background-color:#10b981;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">Pay £${amount} Now</a></p>` : "";
        await supabase.functions.invoke("send-email", {
          body: { to: pupil.email, subject: `Payment Reminder — £${amount} outstanding`, html: `<p>Hi ${pupil.name.split(" ")[0]},</p><p>Friendly reminder: you have an outstanding balance of <strong>£${amount}</strong> with ${instructorName}.</p>${paymentLinkHtml}<p>Thank you!</p>` },
        });
        toast.success(`Email reminder sent to ${pupil.name}`);
      }
      await supabase.from("followup_log").insert({ instructor_id: instructorId, pupil_id: pupil.id, channel: method, trigger_type: "manual_chase", message_content: `Payment reminder for £${amount}` });
    } catch (e) {
      console.error("Chase error:", e);
      toast.error("Failed to send reminder");
    } finally {
      setChasing(null);
    }
  };

  const actions: QuickAction[] = [
    {
      id: "take-payment",
      label: "Take Payment",
      sublabel: "QR or manual",
      icon: QrCode,
      onClick: () => {
        haptics.selection();
        setPaymentModalOpen(true);
      },
      accent: true,
    },
    {
      id: "accounts",
      label: "Accounts",
      sublabel: "Income & outgoings",
      icon: Wallet,
      href: "/instructor/accounts",
    },
    {
      id: "expenses",
      label: "Expenses",
      sublabel: "Track costs",
      icon: Receipt,
      href: "/instructor/expenses",
    },
    {
      id: "bonus",
      label: "Bonus",
      sublabel: "Incentives & rewards",
      icon: Gift,
      href: "/instructor/bonus",
    },
    {
      id: "mileage",
      label: "Mileage",
      sublabel: "Tax tracker",
      icon: Car,
      href: "/instructor/mileage",
    },
    {
      id: "tax",
      label: "Tax Summary",
      sublabel: "HMRC ready",
      icon: Calculator,
      href: "/instructor/accounts?tab=tax",
    },
  ];

  return (
    <InstructorPortalLayout>
      <div className="space-y-5 pb-24">
        {/* ── Vault Card ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/75 p-6 text-white shadow-[0_20px_40px_-15px_hsl(var(--primary)/0.5)]"
        >
          {/* subtle glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_50%)] pointer-events-none" />

          <div className="relative z-10">
            <p className="text-xs font-medium text-white/60 uppercase tracking-wider">
              Net Earnings · This Month
            </p>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold tracking-tighter tabular-nums">
                £{thisMonth}
              </span>
              {monthlyChange !== 0 && (
                <span
                  className={cn(
                    "ml-2 text-xs font-semibold flex items-center gap-0.5 px-1.5 py-0.5 rounded-md",
                    monthlyChange > 0
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-rose-500/20 text-rose-300"
                  )}
                >
                  <ArrowUpRight
                    className={cn("h-3 w-3", monthlyChange < 0 && "rotate-90")}
                  />
                  {Math.abs(monthlyChange)}%
                </span>
              )}
            </div>

            <div className="mt-5 flex gap-8">
              <div>
                <span className="text-[10px] font-semibold text-white/50 uppercase tracking-widest">
                  This Week
                </span>
                <p className="text-lg font-bold tabular-nums">£{thisWeek}</p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-white/50 uppercase tracking-widest">
                  Last Month
                </span>
                <p className="text-lg font-bold tabular-nums">£{lastMonth}</p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-white/50 uppercase tracking-widest">
                  Per Hour
                </span>
                <p className="text-lg font-bold tabular-nums">
                  £{earnings?.hourlyRate || 40}
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── Summary Tiles ── */}
        <div className="grid grid-cols-2 gap-3">
          {/* Owes Money — expandable */}
          <div className={cn(owesExpanded && "col-span-2")}>
            <motion.button
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { haptics.selection(); setOwesExpanded(!owesExpanded); }}
              className={cn(
                "w-full rounded-2xl p-4 bg-card border shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-left transition-colors",
                debtors.length > 0 ? "border-destructive/30" : "border-border",
                !owesExpanded && "min-h-[100px] flex flex-col justify-between"
              )}
            >
              <div className="h-9 w-9 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-4.5 w-4.5 text-destructive" />
              </div>
              <div className="mt-2 flex items-end justify-between">
                <div>
                  <p className="text-xl font-bold tabular-nums text-destructive">
                    {debtors.length > 0 ? `£${totalOwed.toFixed(0)}` : "£0"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Owes Money · {debtors.length} pupil{debtors.length !== 1 ? "s" : ""}
                  </p>
                </div>
                {debtors.length > 0 && (
                  <ChevronDown className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    owesExpanded && "rotate-180"
                  )} />
                )}
              </div>
            </motion.button>

            <AnimatePresence>
              {owesExpanded && debtors.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 bg-card rounded-2xl border border-destructive/20 divide-y divide-border/50 overflow-hidden">
                    {debtors.map((pupil) => {
                      const amount = Math.abs(pupil.account_balance || 0);
                      return (
                        <div key={pupil.id} className="p-3 flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-destructive/10 flex items-center justify-center text-xs font-semibold text-destructive flex-shrink-0">
                            {getInitials(pupil.name)}
                          </div>
                          <Link to={`/instructor/pupils?pupil=${pupil.id}`} className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{pupil.name}</p>
                            <p className="text-destructive text-xs font-semibold">Owes £{amount.toFixed(2)}</p>
                          </Link>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 border-destructive/20 hover:bg-destructive/5"
                              onClick={(e) => { e.stopPropagation(); handleChase(pupil, "sms"); }}
                              disabled={!!chasing || !pupil.phone}
                            >
                              {chasing === `${pupil.id}-sms` ? <Loader2 className="h-3 w-3 animate-spin" /> : <MessageSquare className="h-3 w-3 text-destructive" />}
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 border-destructive/20 hover:bg-destructive/5"
                              onClick={(e) => { e.stopPropagation(); handleChase(pupil, "email"); }}
                              disabled={!!chasing || !pupil.email}
                            >
                              {chasing === `${pupil.id}-email` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Mail className="h-3 w-3 text-destructive" />}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Recent Payments — expandable */}
          <div className={cn(paymentsExpanded && "col-span-2")}>
            <motion.button
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { haptics.selection(); setPaymentsExpanded(!paymentsExpanded); }}
              className={cn(
                "w-full rounded-2xl p-4 bg-card border border-border shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-left transition-colors",
                !paymentsExpanded && "min-h-[100px] flex flex-col justify-between"
              )}
            >
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                <Receipt className="h-4.5 w-4.5 text-primary" />
              </div>
              <div className="mt-2 flex items-end justify-between">
                <div>
                  <p className="text-xl font-bold tabular-nums text-foreground">{recentPaymentCount}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Recent Payments</p>
                </div>
                <ChevronDown className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  paymentsExpanded && "rotate-180"
                )} />
              </div>
            </motion.button>

            <AnimatePresence>
              {paymentsExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2">
                    <PaymentHistory instructorId={instructorId || ""} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Course Rewards — expandable with payouts */}
          <div className={cn(bonusExpanded && "col-span-2")}>
            <motion.button
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.20 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { haptics.selection(); setBonusExpanded(!bonusExpanded); }}
              className={cn(
                "w-full rounded-2xl p-4 bg-card border border-border shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-left transition-colors",
                !bonusExpanded && "min-h-[100px] flex flex-col justify-between"
              )}
            >
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                <Trophy className="h-4.5 w-4.5 text-primary" />
              </div>
              <div className="mt-2 flex items-end justify-between">
                <div>
                  <p className="text-xl font-bold tabular-nums text-foreground">£{bonusEarned}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Course Rewards</p>
                </div>
                <ChevronDown className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  bonusExpanded && "rotate-180"
                )} />
              </div>
            </motion.button>

            <AnimatePresence>
              {bonusExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2">
                    <InstructorPayoutHistory instructorId={instructorId || ""} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Pupil Balances */}
          <Link to="/instructor/accounts" onClick={() => haptics.selection()}>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24 }}
              className="rounded-2xl p-4 bg-card border border-border shadow-[0_2px_8px_rgba(0,0,0,0.04)] min-h-[100px] flex flex-col justify-between"
            >
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-4.5 w-4.5 text-primary" />
              </div>
              <div className="mt-2">
                <p className="text-xl font-bold tabular-nums text-foreground">{pupils.length}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Pupil Balances</p>
              </div>
            </motion.div>
          </Link>
        </div>


        {/* ── Quick Actions Grid ── */}
        <section>
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3 px-0.5">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {actions.map((action, i) => {
              const Icon = action.icon;
              const inner = (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.04 }}
                  whileTap={{ scale: 0.97 }}
                  className={cn(
                    "rounded-2xl p-4 flex flex-col gap-3 min-h-[110px] transition-shadow",
                    action.accent
                      ? "bg-primary text-white shadow-[0_8px_24px_hsl(var(--primary)/0.3)]"
                      : "bg-card border border-border shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md"
                  )}
                >
                  <div
                    className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                      action.accent ? "bg-white/15" : "bg-primary/10"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5",
                        action.accent ? "text-white" : "text-primary"
                      )}
                    />
                  </div>
                  <div>
                    <p
                      className={cn(
                        "text-sm font-semibold leading-tight",
                        action.accent ? "text-white" : "text-foreground"
                      )}
                    >
                      {action.label}
                    </p>
                    <p
                      className={cn(
                        "text-[10px] mt-0.5",
                        action.accent ? "text-white/60" : "text-muted-foreground"
                      )}
                    >
                      {action.sublabel}
                    </p>
                  </div>
                </motion.div>
              );

              if (action.href) {
                return (
                  <Link
                    key={action.id}
                    to={action.href}
                    onClick={() => haptics.selection()}
                  >
                    {inner}
                  </Link>
                );
              }
              return (
                <button
                  key={action.id}
                  onClick={action.onClick}
                  className="text-left"
                >
                  {inner}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Recent Payments ── */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-2xl border border-border overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" />
              Recent Payments
            </h3>
            <Link
              to="/instructor/accounts"
              className="text-xs text-primary font-medium flex items-center gap-0.5"
            >
              See all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-4">
            <PaymentHistory instructorId={instructorId} limit={5} />
          </div>
        </motion.section>


        {/* ── Pupil Balances ── */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-card rounded-2xl border border-border overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Pupil Balances
            </h3>
            <Link
              to="/instructor/accounts"
              className="text-xs text-primary font-medium flex items-center gap-0.5"
            >
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-4">
            <PupilBalancesList pupils={pupils} limit={5} />
          </div>
        </motion.section>

        {/* ── Forecaster ── */}
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
        commissionSplitPercent={authInstructor?.commission_split_percent}
        instructorName={instructorName}
        instructorId={instructorId}
        pupils={pupils}
      />
    </InstructorPortalLayout>
  );
}
