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
  CreditCard,
  BarChart2,
  FileText,
} from "lucide-react";
import { type LucideIcon } from "lucide-react";
import { TakePaymentModal } from "@/components/instructor/TakePaymentModal";
import { PaymentHistory } from "@/components/instructor/PaymentHistory";
import { InstructorPayoutHistory } from "@/components/instructor/InstructorPayoutHistory";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { PageSkeleton } from "@/components/ui/skeletons/PageSkeleton";
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
  profile_image_url: string | null;
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
      .select("id, name, account_balance, phone, email, profile_image_url")
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
        <PageSkeleton />
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

  const actions: { id: string; label: string; sublabel: string; icon: LucideIcon; iconColor: string; iconBg: string; href?: string; onClick?: () => void; accent?: boolean }[] = [
    {
      id: "take-payment",
      label: "Take Payment",
      sublabel: "QR or manual",
      icon: CreditCard,
      iconColor: "#FFFFFF",
      iconBg: "rgba(255,255,255,0.2)",
      onClick: () => {
        haptics.selection();
        setPaymentModalOpen(true);
      },
      accent: true,
    },
    { id: "accounts", label: "Accounts", sublabel: "Income & outgoings", icon: BarChart2, iconColor: "#5B21B6", iconBg: "#EDE9FE", href: "/instructor/accounts" },
    { id: "expenses", label: "Expenses", sublabel: "Track costs", icon: Receipt, iconColor: "#92400E", iconBg: "#FEF3C7", href: "/instructor/expenses" },
    { id: "bonus", label: "Bonus", sublabel: "Incentives & rewards", icon: Gift, iconColor: "#BE123C", iconBg: "#FFE4E6", href: "/instructor/bonus" },
    { id: "mileage", label: "Mileage", sublabel: "Tax tracker", icon: Car, iconColor: "#1E40AF", iconBg: "#DBEAFE", href: "/instructor/mileage" },
    { id: "tax", label: "Tax Summary", sublabel: "HMRC ready", icon: FileText, iconColor: "#92400E", iconBg: "#FEF3C7", href: "/instructor/accounts?tab=tax" },
  ];

  const GradientLine = () => null;

  const tileStyle: React.CSSProperties = {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    boxShadow: "0 12px 28px rgba(20, 30, 60, 0.14), 0 4px 8px rgba(20, 30, 60, 0.06)",
    overflow: "hidden",
  };

  return (
    <InstructorPortalLayout>
      <div className="space-y-[10px] pb-24" style={{ fontFamily: "-apple-system, 'SF Pro Text', system-ui, sans-serif" }}>

        {/* ── Hero Earnings Card ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[20px] overflow-hidden shadow-[0_8px_24px_rgba(13,27,46,0.35)]"
        >
          <div className="bg-gradient-to-br from-[#0d1b2e] to-[#1c2b4a] p-[18px_18px_0]">
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.08em] mb-2">
              Net Earnings · This Month
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[36px] font-bold text-white leading-none tabular-nums">
                £{thisMonth}
              </span>
              {monthlyChange !== 0 && (
                <span
                  className={cn(
                    "text-[11px] font-bold px-[10px] py-1 rounded-[20px] flex items-center gap-0.5",
                    monthlyChange > 0
                      ? "bg-[#eaf3de] text-[#4a8c3f]"
                      : "bg-[#fff0f0] text-[#e24b4a]"
                  )}
                >
                  <ArrowUpRight
                    className={cn("h-3 w-3", monthlyChange < 0 && "rotate-90")}
                  />
                  {Math.abs(monthlyChange)}%
                </span>
              )}
            </div>

            <div className="mt-[14px] pt-[14px] border-t border-white/10 flex pb-[14px]">
              <div className="flex-1">
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-[0.08em]">This Week</p>
                <p className="text-[18px] font-bold text-white tabular-nums">£{thisWeek}</p>
              </div>
              <div className="flex-1 border-l border-white/10 pl-4">
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-[0.08em]">Last Month</p>
                <p className="text-[18px] font-bold text-white tabular-nums">£{lastMonth}</p>
              </div>
              <div className="flex-1 border-l border-white/10 pl-4">
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-[0.08em]">Per Hour</p>
                <p className="text-[18px] font-bold text-white tabular-nums">£{earnings?.hourlyRate || 40}</p>
              </div>
            </div>
          </div>
          <GradientLine />
        </motion.section>

        {/* ── Summary Tiles 2×2 ── */}
        <div className="grid grid-cols-2 gap-[10px]">
          {/* Owes Money */}
          <div className={cn(owesExpanded && "col-span-2")}>
            <motion.button
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { haptics.selection(); setOwesExpanded(!owesExpanded); }}
              style={tileStyle} className="w-full text-left"
            >
              <div style={{ padding: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                  <AlertCircle size={22} strokeWidth={2} color="#DC2626" />
                </div>
                <p style={{ fontSize: 22, fontWeight: 700, color: "#DC2626", fontFamily: "Inter, sans-serif" }} className="tabular-nums">
                  {debtors.length > 0 ? `£${totalOwed.toFixed(0)}` : "£0"}
                </p>
                <div className="flex items-center justify-between" style={{ marginTop: 2 }}>
                  <p style={{ fontSize: 12, fontWeight: 400, color: "#71717A", fontFamily: "Inter, sans-serif" }}>Owes Money</p>
                  <ChevronRight size={16} strokeWidth={2} color="#A1A1AA" className={cn("transition-transform", owesExpanded && "rotate-90")} />
                </div>
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
                  <div style={{ ...tileStyle, marginTop: 8 }} className="divide-y divide-[#E4E4E7]">
                    {debtors.map((pupil) => {
                      const amount = Math.abs(pupil.account_balance || 0);
                      return (
                        <div key={pupil.id} className="p-3 flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full overflow-hidden flex-shrink-0">
                            {pupil.profile_image_url ? (
                              <img src={pupil.profile_image_url} alt={pupil.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full bg-[#fff0f0] flex items-center justify-center text-xs font-semibold text-[#e24b4a]">
                                {getInitials(pupil.name)}
                              </div>
                            )}
                          </div>
                          <Link to={`/instructor/pupils?pupil=${pupil.id}`} className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate text-[#1c1c1e]">{pupil.name}</p>
                            <p className="text-[#e24b4a] text-xs font-semibold">Owes £{amount.toFixed(2)}</p>
                          </Link>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 border-[#e24b4a]/20 hover:bg-[#fff0f0]"
                              onClick={(e) => { e.stopPropagation(); handleChase(pupil, "sms"); }}
                              disabled={!!chasing || !pupil.phone}
                            >
                              {chasing === `${pupil.id}-sms` ? <Loader2 className="h-3 w-3 animate-spin" /> : <MessageSquare className="h-3 w-3 text-[#e24b4a]" />}
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 border-[#e24b4a]/20 hover:bg-[#fff0f0]"
                              onClick={(e) => { e.stopPropagation(); handleChase(pupil, "email"); }}
                              disabled={!!chasing || !pupil.email}
                            >
                              {chasing === `${pupil.id}-email` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Mail className="h-3 w-3 text-[#e24b4a]" />}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                    <GradientLine />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Recent Payments */}
          <div className={cn(paymentsExpanded && "col-span-2")}>
            <motion.button
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { haptics.selection(); setPaymentsExpanded(!paymentsExpanded); }}
              style={tileStyle} className="w-full text-left"
            >
              <div style={{ padding: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#DBEAFE", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                  <CreditCard size={22} strokeWidth={2} color="#1E40AF" />
                </div>
                <p style={{ fontSize: 22, fontWeight: 700, color: "#18181B", fontFamily: "Inter, sans-serif" }} className="tabular-nums">{recentPaymentCount}</p>
                <div className="flex items-center justify-between" style={{ marginTop: 2 }}>
                  <p style={{ fontSize: 12, fontWeight: 400, color: "#71717A", fontFamily: "Inter, sans-serif" }}>Recent Payments</p>
                  <ChevronRight size={16} strokeWidth={2} color="#A1A1AA" className={cn("transition-transform", paymentsExpanded && "rotate-90")} />
                </div>
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

          {/* Course Rewards */}
          <div className={cn(bonusExpanded && "col-span-2")}>
            <motion.button
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.20 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { haptics.selection(); setBonusExpanded(!bonusExpanded); }}
              style={tileStyle} className="w-full text-left"
            >
              <div style={{ padding: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                  <Trophy size={22} strokeWidth={2} color="#92400E" />
                </div>
                <p style={{ fontSize: 22, fontWeight: 700, color: "#18181B", fontFamily: "Inter, sans-serif" }} className="tabular-nums">£{bonusEarned}</p>
                <div className="flex items-center justify-between" style={{ marginTop: 2 }}>
                  <p style={{ fontSize: 12, fontWeight: 400, color: "#71717A", fontFamily: "Inter, sans-serif" }}>Course Rewards</p>
                  <ChevronRight size={16} strokeWidth={2} color="#A1A1AA" className={cn("transition-transform", bonusExpanded && "rotate-90")} />
                </div>
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
          <div className={cn(balancesExpanded && "col-span-2")}>
            <motion.button
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { haptics.selection(); setBalancesExpanded(!balancesExpanded); }}
              style={tileStyle} className="w-full text-left"
            >
              <div style={{ padding: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#E8ECF1", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                  <Users size={22} strokeWidth={2} color="#2A394F" />
                </div>
                <p style={{ fontSize: 22, fontWeight: 700, color: "#18181B", fontFamily: "Inter, sans-serif" }} className="tabular-nums">{pupils.length}</p>
                <div className="flex items-center justify-between" style={{ marginTop: 2 }}>
                  <p style={{ fontSize: 12, fontWeight: 400, color: "#71717A", fontFamily: "Inter, sans-serif" }}>Pupil Balances</p>
                  <ChevronRight size={16} strokeWidth={2} color="#A1A1AA" className={cn("transition-transform", balancesExpanded && "rotate-90")} />
                </div>
              </div>
            </motion.button>

            <AnimatePresence>
              {balancesExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div style={{ ...tileStyle, marginTop: 8, padding: 16 }}>
                    <PupilBalancesList pupils={pupils} limit={5} />
                    <GradientLine />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Quick Actions ── */}
        <section>
          <p className="text-[11px] font-bold text-[#8e8e93] uppercase tracking-[0.06em] px-1 mb-[10px]">
            Quick Actions
          </p>
          <div className="grid grid-cols-2 gap-[10px]">
            {actions.map((action, i) => {
              const inner = (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.04 }}
                  whileTap={{ scale: 0.97 }}
                  style={action.accent ? undefined : tileStyle}
                  className={cn(
                    action.accent
                      ? "rounded-[14px] overflow-hidden bg-gradient-to-br from-[#1F2B3D] to-[#2A394F] shadow-[0_6px_20px_rgba(26,111,212,0.35)]"
                      : ""
                  )}
                >
                  <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: 12 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        backgroundColor: action.accent ? "rgba(255,255,255,0.2)" : action.iconBg,
                      }}
                    >
                      <action.icon size={22} strokeWidth={2} color={action.iconColor} />
                    </div>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 500, color: action.accent ? "#FFFFFF" : "#18181B", lineHeight: 1.2, fontFamily: "Inter, sans-serif" }}>
                        {action.label}
                      </p>
                      <p style={{ fontSize: 12, fontWeight: 400, color: action.accent ? "rgba(255,255,255,0.65)" : "#71717A", marginTop: 2, fontFamily: "Inter, sans-serif" }}>
                        {action.sublabel}
                      </p>
                    </div>
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
