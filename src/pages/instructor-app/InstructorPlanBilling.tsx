import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Check, X, Download, AlertTriangle, CreditCard } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useCombinedNotificationCount } from "@/hooks/useCombinedNotificationCount";
import { DashboardShell } from "@/components/instructor/dashboardV2/DashboardShell";
import { supabase } from "@/integrations/supabase/client";

interface Feature { included: boolean; bold?: boolean; text: string }
interface Plan {
  id: string;            // slug
  planId: string;        // db id
  name: string;
  tagline: string;
  monthly: number;
  yearly: number;
  maxPupils: number | null;
  features: Feature[];
  displayOrder: number;
}

interface CurrentSubscription {
  planId: string | null;
  planSlug: string | null;
  planName: string;
  monthly: number;
  yearly: number;
  status: string | null;
  billingCycle: "monthly" | "yearly";
  currentPeriodEnd: string | null;
  hasGoCardlessMandate: boolean;
  hasSquareCard: boolean;
}

function meterColor(pct: number) {
  if (pct >= 90) return "#F43F5E";
  if (pct >= 70) return "#F59E0B";
  return "#4F46E5";
}

function UsageMeter({ label, used, total, unit }: { label: string; used: number; total: number; unit: string }) {
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(pct), 50); return () => clearTimeout(t); }, [pct]);
  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: "var(--d2-text-2)" }}>{label}</span>
        <span className="d2-mono" style={{ fontSize: 11, color: "var(--d2-text-1)" }}>
          {used}{unit} / {total}{unit}
        </span>
      </div>
      <div style={{ height: 4, borderRadius: 999, background: "#F1F5F9", overflow: "hidden" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${w}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ height: "100%", background: meterColor(pct), borderRadius: 999 }}
        />
      </div>
    </div>
  );
}

function AnimatedPrice({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    const start = display, end = value;
    if (start === end) return;
    const dur = 250, t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return <span className="d2-mono" style={{ fontSize: 22, fontWeight: 500, color: "var(--d2-text-1)" }}>£{display}</span>;
}

function PlanCard({
  plan, currentSlug, recommendedSlug, billing, onSelect,
}: {
  plan: Plan;
  currentSlug: string | null;
  recommendedSlug: string | null;
  billing: "monthly" | "yearly";
  onSelect: (p: Plan) => void;
}) {
  const isCurrent = plan.id === currentSlug;
  const isRecommended = !isCurrent && plan.id === recommendedSlug;
  const price = billing === "monthly" ? plan.monthly : plan.yearly;

  let ctaLabel = "Choose plan";
  let ctaVariant: "primary" | "outline" | "muted" = "outline";
  if (isCurrent) { ctaLabel = "You're on this plan"; ctaVariant = "muted"; }
  else { ctaLabel = `Switch to ${plan.name}`; ctaVariant = isRecommended ? "primary" : "outline"; }

  return (
    <motion.div
      whileHover={!isCurrent ? { y: -1 } : undefined}
      style={{
        position: "relative",
        background: "var(--d2-surface)",
        border: isCurrent ? "2px solid var(--d2-indigo)" : "0.5px solid var(--d2-border)",
        borderRadius: 8,
        padding: 14,
        transition: "border-color 150ms ease-out",
      }}
      onMouseEnter={(e) => { if (!isCurrent) e.currentTarget.style.borderColor = "#94A3B8"; }}
      onMouseLeave={(e) => { if (!isCurrent) e.currentTarget.style.borderColor = "var(--d2-border)"; }}
    >
      {(isCurrent || isRecommended) && (
        <span
          style={{
            position: "absolute", top: -9, left: 14,
            fontSize: 9, fontWeight: 500, padding: "2px 7px", borderRadius: 6,
            background: isCurrent ? "#ECFDF5" : "#EEEDFE",
            color: isCurrent ? "#047857" : "#3C3489",
          }}
        >
          {isCurrent ? "CURRENT PLAN" : "RECOMMENDED"}
        </span>
      )}

      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--d2-text-1)" }}>{plan.name}</div>
      <div style={{ fontSize: 11, color: "var(--d2-text-2)", marginTop: 2 }}>{plan.tagline}</div>

      <div className="flex items-baseline gap-1" style={{ marginTop: 10, marginBottom: 12 }}>
        <AnimatedPrice value={price} />
        <span style={{ fontSize: 11, color: "var(--d2-text-2)" }}>/month</span>
      </div>

      <button
        onClick={() => !isCurrent && onSelect(plan)}
        disabled={isCurrent}
        className="w-full transition-colors"
        style={{
          padding: "6px", borderRadius: 6, fontSize: 11, fontWeight: 500,
          ...(ctaVariant === "primary"
            ? { background: "var(--d2-indigo)", color: "#fff", border: "none" }
            : ctaVariant === "muted"
            ? { background: "var(--d2-surface-soft)", color: "var(--d2-text-2)", border: "0.5px solid var(--d2-border)", cursor: "default" }
            : { background: "var(--d2-surface)", color: "var(--d2-text-1)", border: "0.5px solid var(--d2-border)" }),
        }}
      >
        {ctaLabel}
      </button>

      <div className="flex flex-col" style={{ gap: 6, marginTop: 12 }}>
        {plan.features.map((f, i) => (
          <div key={i} className="flex items-start gap-1.5">
            {f.included ? (
              <Check size={11} strokeWidth={2.25} style={{ color: "#047857", flexShrink: 0, marginTop: 2 }} />
            ) : (
              <X size={11} strokeWidth={2.25} style={{ color: "var(--d2-text-3)", flexShrink: 0, marginTop: 2 }} />
            )}
            <span
              style={{
                fontSize: 11,
                fontWeight: f.bold ? 500 : 400,
                color: f.included ? "var(--d2-text-1)" : "var(--d2-text-3)",
                lineHeight: 1.4,
              }}
            >
              {f.text}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function formatRenewal(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  } catch { return "—"; }
}

export default function InstructorPlanBilling() {
  const navigate = useNavigate();
  const { instructor, signOut } = useInstructorAuth();
  const { total: notificationCount } = useCombinedNotificationCount(instructor?.id);
  const instructorId = instructor?.id;

  // --- Live data queries ---
  const { data: plans = [] } = useQuery<Plan[]>({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("id, slug, name, description, price_monthly, price_yearly, max_pupils, features, display_order")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data || []).map((p: any) => ({
        planId: p.id,
        id: p.slug,
        name: p.name,
        tagline: p.description || "",
        monthly: Number(p.price_monthly) || 0,
        yearly: Number(p.price_yearly ?? p.price_monthly) || 0,
        maxPupils: p.max_pupils ?? null,
        displayOrder: p.display_order ?? 0,
        features: Array.isArray(p.features)
          ? p.features.map((f: any) =>
              typeof f === "string"
                ? { included: true, text: f }
                : { included: f.included !== false, bold: !!f.bold, text: f.text ?? String(f) }
            )
          : [],
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: subscription } = useQuery<CurrentSubscription>({
    queryKey: ["instructor-subscription-detail", instructorId],
    enabled: !!instructorId,
    queryFn: async () => {
      const { data } = await supabase
        .from("instructor_subscriptions")
        .select("status, billing_cycle, current_period_end, gocardless_mandate_id, square_card_id, plan_id, subscription_plans(id, slug, name, price_monthly, price_yearly)")
        .eq("instructor_id", instructorId!)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const plan = (data as any)?.subscription_plans;
      return {
        planId: plan?.id ?? null,
        planSlug: plan?.slug ?? null,
        planName: plan?.name ?? "Free",
        monthly: Number(plan?.price_monthly ?? 0),
        yearly: Number(plan?.price_yearly ?? plan?.price_monthly ?? 0),
        status: (data as any)?.status ?? null,
        billingCycle: ((data as any)?.billing_cycle === "yearly" ? "yearly" : "monthly"),
        currentPeriodEnd: (data as any)?.current_period_end ?? null,
        hasGoCardlessMandate: !!(data as any)?.gocardless_mandate_id,
        hasSquareCard: !!(data as any)?.square_card_id,
      };
    },
    staleTime: 60 * 1000,
  });

  const { data: pupilCount = 0 } = useQuery<number>({
    queryKey: ["pupil-count-active", instructorId],
    enabled: !!instructorId,
    queryFn: async () => {
      const { count } = await supabase
        .from("pupils")
        .select("id", { count: "exact", head: true })
        .eq("instructor_id", instructorId!)
        .eq("status", "active")
        .is("deleted_at", null);
      return count ?? 0;
    },
    staleTime: 60 * 1000,
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["subscription-payments", instructorId],
    enabled: !!instructorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_payments")
        .select("id, amount, currency, status, payment_date, period_start, period_end, created_at")
        .eq("instructor_id", instructorId!)
        .order("payment_date", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(12);
      if (error) throw error;
      return data || [];
    },
    staleTime: 60 * 1000,
  });

  // --- Local UI state ---
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [billingInitialised, setBillingInitialised] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [upgradeFor, setUpgradeFor] = useState<Plan | null>(null);

  // Initialise billing toggle from saved subscription cycle (once)
  useEffect(() => {
    if (!billingInitialised && subscription?.billingCycle) {
      setBilling(subscription.billingCycle);
      setBillingInitialised(true);
    }
  }, [subscription?.billingCycle, billingInitialised]);

  const currentSlug = subscription?.planSlug ?? null;
  const currentPlan = useMemo(
    () => plans.find(p => p.id === currentSlug) ?? null,
    [plans, currentSlug]
  );

  const recommendedSlug = useMemo(() => {
    if (!plans.length) return null;
    if (!currentSlug) return plans[0]?.id ?? null;
    const idx = plans.findIndex(p => p.id === currentSlug);
    if (idx < 0 || idx >= plans.length - 1) return null;
    return plans[idx + 1].id;
  }, [plans, currentSlug]);

  const maxPupils = currentPlan?.maxPupils ?? subscription?.planId ? (currentPlan?.maxPupils ?? 0) : 0;
  const overLimit = maxPupils > 0 && pupilCount >= maxPupils;

  const handleSignOut = async () => { await signOut(); navigate("/instructor-app/login"); };
  const initials = (instructor?.name || "")
    .split(" ").map(p => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "ID";

  const planDisplayName = subscription?.planName ?? "Free";
  const planMonthlyPrice = subscription?.monthly ?? 0;
  const renewal = formatRenewal(subscription?.currentPeriodEnd ?? null);

  // Payment method label
  const paymentMethodLabel = subscription?.hasGoCardlessMandate
    ? "Direct Debit"
    : subscription?.hasSquareCard
    ? "Card on file"
    : "No payment method";
  const paymentMethodSub = subscription?.hasGoCardlessMandate
    ? "GoCardless mandate active"
    : subscription?.hasSquareCard
    ? "Square card on file"
    : "Add a payment method to upgrade";

  return (
    <DashboardShell
      userInitials={initials}
      userName={instructor?.name || "Instructor"}
      notificationCount={notificationCount}
      onSignOut={handleSignOut}
      onAskED={() => window.dispatchEvent(new CustomEvent("dsm:open-ai"))}
      onBell={() => navigate("/instructor/notifications")}
    >
      <div className="flex flex-col" style={{ gap: 12 }}>
        {/* Header */}
        <div>
          <div className="flex items-center gap-1.5" style={{ fontSize: 11, color: "var(--d2-text-3)" }}>
            <span>Settings</span><span>/</span><span>Plan & billing</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 500, color: "var(--d2-text-1)", marginTop: 4, letterSpacing: "-0.3px" }}>
            Plan & billing
          </h1>
          <p style={{ fontSize: 13, color: "var(--d2-text-2)", marginTop: 4 }}>
            Manage your subscription, payment method and invoice history.
          </p>
        </div>

        {/* Current plan card */}
        <div className="d2-card" style={{ padding: 14, marginTop: 4 }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 14, fontWeight: 500, color: "var(--d2-text-1)" }}>DSM {planDisplayName}</span>
                <span style={{
                  fontSize: 9, fontWeight: 500, padding: "2px 7px", borderRadius: 6,
                  background: "#ECFDF5", color: "#047857",
                }}>CURRENT PLAN</span>
              </div>
              <div className="d2-mono" style={{ fontSize: 11, color: "var(--d2-text-2)", marginTop: 4 }}>
                £{planMonthlyPrice}/month{subscription?.currentPeriodEnd ? ` · Renews on ${renewal}` : ""}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toast("Manage flow coming soon")}
                style={{
                  padding: "5px 10px", borderRadius: 6, fontSize: 11,
                  border: "0.5px solid var(--d2-border)", background: "var(--d2-surface)",
                  color: "var(--d2-text-1)",
                }}
              >
                Manage
              </button>
              {recommendedSlug && (
                <button
                  onClick={() => setUpgradeFor(plans.find(p => p.id === recommendedSlug) ?? null)}
                  style={{
                    padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 500,
                    background: "var(--d2-indigo)", color: "#fff",
                  }}
                >
                  Upgrade
                </button>
              )}
            </div>
          </div>

          <div style={{ borderTop: "0.5px solid var(--d2-border)", margin: "12px 0" }} />

          <div className="grid" style={{ gridTemplateColumns: "1fr", gap: 12 }}>
            <UsageMeter
              label="Pupils"
              used={pupilCount}
              total={maxPupils > 0 ? maxPupils : Math.max(pupilCount, 1)}
              unit=""
            />
            {/* AI credits and Storage meters intentionally omitted — no live ledger yet. */}
          </div>
        </div>

        {/* Compare header */}
        <div className="flex items-center justify-between" style={{ marginTop: 8 }}>
          <h3 style={{ fontSize: 14, fontWeight: 500, color: "var(--d2-text-1)" }}>Compare plans</h3>
          <div className="flex items-center" style={{ background: "var(--d2-surface-soft)", borderRadius: 8, padding: 3, gap: 2 }}>
            {(["monthly", "yearly"] as const).map(b => {
              const active = billing === b;
              return (
                <button
                  key={b}
                  onClick={() => setBilling(b)}
                  className="flex items-center gap-1.5"
                  style={{
                    padding: "4px 10px", borderRadius: 6,
                    background: active ? "#fff" : "transparent",
                    color: active ? "var(--d2-text-1)" : "var(--d2-text-2)",
                    fontSize: 11, fontWeight: active ? 500 : 400,
                    boxShadow: active ? "0 1px 2px rgba(15,23,42,0.06)" : "none",
                    transition: "all 150ms ease-out",
                  }}
                >
                  {b === "monthly" ? "Monthly" : "Yearly"}
                  {b === "yearly" && (
                    <span style={{ fontSize: 9, fontWeight: 500, padding: "1px 5px", borderRadius: 4, background: "#ECFDF5", color: "#047857" }}>
                      −20%
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Over limit alert */}
        <AnimatePresence>
          {overLimit && (
            <motion.div
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2"
              style={{ background: "#FEF3C7", color: "#B45309", padding: "8px 12px", borderRadius: 8, fontSize: 12 }}
            >
              <AlertTriangle size={13} />
              You've hit your pupil limit — upgrade to keep adding new pupils.
            </motion.div>
          )}
        </AnimatePresence>

        {/* Plan tiers */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${Math.max(plans.length, 1)}, minmax(0, 1fr))`,
            gap: 10, marginTop: 8,
          }}
        >
          {plans.map(p => (
            <PlanCard
              key={p.planId}
              plan={p}
              currentSlug={currentSlug}
              recommendedSlug={recommendedSlug}
              billing={billing}
              onSelect={(plan) => setUpgradeFor(plan)}
            />
          ))}
        </div>

        {/* Payment method + Invoices */}
        <div className="grid" style={{ gridTemplateColumns: "1fr 1.5fr", gap: 12, marginTop: 12 }}>
          <div className="d2-card" style={{ padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--d2-text-1)" }}>Payment method</div>
            <div
              className="flex items-center gap-2.5"
              style={{ marginTop: 10, padding: 10, borderRadius: 6, background: "var(--d2-surface-soft)" }}
            >
              <div
                className="flex items-center justify-center"
                style={{
                  width: 32, height: 22, borderRadius: 3,
                  background: subscription?.hasGoCardlessMandate ? "#0D9488" : subscription?.hasSquareCard ? "#1F2937" : "#94A3B8",
                  color: "#fff", fontSize: 8, fontWeight: 700, letterSpacing: 0.5,
                }}
              >
                {subscription?.hasGoCardlessMandate ? "DD" : subscription?.hasSquareCard ? "CARD" : "—"}
              </div>
              <div className="flex-1">
                <div style={{ fontSize: 12, color: "var(--d2-text-1)" }}>{paymentMethodLabel}</div>
                <div style={{ fontSize: 10, color: "var(--d2-text-2)" }}>{paymentMethodSub}</div>
              </div>
            </div>
            <button
              onClick={() => toast("Update payment method coming soon")}
              style={{ fontSize: 11, color: "var(--d2-indigo)", marginTop: 10, fontWeight: 500 }}
            >
              Update payment method →
            </button>
            <div style={{ borderTop: "0.5px solid var(--d2-border)", margin: "12px 0" }} />
            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--d2-text-3)", textTransform: "uppercase", letterSpacing: 0.6 }}>
              Billing email
            </div>
            <div className="d2-mono" style={{ fontSize: 12, color: "var(--d2-text-1)", marginTop: 4 }}>
              {instructor?.email || "—"}
            </div>
          </div>

          <div className="d2-card" style={{ padding: 14 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--d2-text-1)" }}>Invoices</div>
              {invoices.length > 0 && (
                <button
                  onClick={() => toast("Invoice export coming soon")}
                  style={{ fontSize: 11, color: "var(--d2-indigo)", fontWeight: 500 }}
                >
                  Download all →
                </button>
              )}
            </div>

            {invoices.length === 0 ? (
              <div style={{ fontSize: 12, color: "var(--d2-text-2)", padding: "16px 0", textAlign: "center" }}>
                No invoices yet.
              </div>
            ) : (
              <>
                <div
                  className="grid items-center"
                  style={{
                    gridTemplateColumns: "90px 1fr 70px 60px 24px",
                    gap: 8,
                    fontSize: 10, fontWeight: 600, letterSpacing: 0.6,
                    color: "var(--d2-text-3)", textTransform: "uppercase",
                    padding: "6px 0", borderBottom: "0.5px solid var(--d2-border)",
                  }}
                >
                  <div>Date</div><div>Description</div><div className="text-right">Amount</div><div>Status</div><div />
                </div>

                {invoices.map((inv: any, i: number) => {
                  const dateStr = inv.payment_date
                    ? new Date(inv.payment_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                    : new Date(inv.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
                  const statusUpper = String(inv.status || "").toUpperCase();
                  const isPaid = inv.status === "paid" || inv.status === "completed";
                  return (
                    <div
                      key={inv.id}
                      className="grid items-center"
                      style={{
                        gridTemplateColumns: "90px 1fr 70px 60px 24px",
                        gap: 8, padding: "8px 0",
                        borderBottom: i === invoices.length - 1 ? "none" : "0.5px solid var(--d2-border)",
                        fontSize: 11,
                      }}
                    >
                      <div className="d2-mono" style={{ color: "var(--d2-text-2)" }}>{dateStr}</div>
                      <div style={{ color: "var(--d2-text-1)" }}>DSM {planDisplayName} · Subscription</div>
                      <div className="d2-mono text-right" style={{ color: "var(--d2-text-1)" }}>£{Number(inv.amount).toFixed(2)}</div>
                      <div>
                        <span style={{
                          fontSize: 9, fontWeight: 500, padding: "1px 6px", borderRadius: 6,
                          background: isPaid ? "#ECFDF5" : "#FEF3C7",
                          color: isPaid ? "#047857" : "#B45309",
                        }}>
                          {statusUpper}
                        </span>
                      </div>
                      <button
                        onClick={() => toast("Invoice download coming soon")}
                        className="flex items-center justify-center"
                        style={{ width: 24, height: 24, borderRadius: 6, color: "var(--d2-text-3)" }}
                        aria-label="Download invoice"
                      >
                        <Download size={12} />
                      </button>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* Cancel strip */}
        {subscription?.status === "active" && currentPlan && (
          <div
            className="flex items-center justify-between"
            style={{ background: "#F8FAFC", borderRadius: 8, padding: "10px 14px", marginTop: 14 }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: "var(--d2-text-1)" }}>Cancel subscription</div>
              <div style={{ fontSize: 11, color: "var(--d2-text-2)", marginTop: 2 }}>
                You'll keep {planDisplayName} features until the end of your billing period.
              </div>
            </div>
            <button
              onClick={() => setCancelOpen(true)}
              style={{
                padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 500,
                border: "0.5px solid var(--d2-border)", background: "var(--d2-surface)",
                color: "#BE123C",
              }}
            >
              Cancel plan
            </button>
          </div>
        )}
      </div>

      {/* Cancel confirm */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel your DSM {planDisplayName} subscription?</DialogTitle>
            <DialogDescription>
              You'll keep {planDisplayName} features until {renewal}, then your account will switch to Free. Your data is retained.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => { setCancelOpen(false); toast.success("You're staying on " + planDisplayName + " 👍"); }}
              style={{
                padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500,
                background: "var(--d2-indigo)", color: "#fff",
              }}
            >
              Keep my plan
            </button>
            <button
              onClick={() => { setCancelOpen(false); toast("Cancellation flow not wired yet — contact support to cancel."); }}
              style={{
                padding: "8px 10px", fontSize: 12, fontWeight: 500,
                background: "transparent", color: "#BE123C",
              }}
            >
              Cancel anyway
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upgrade sheet */}
      <Sheet open={!!upgradeFor} onOpenChange={(o) => !o && setUpgradeFor(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Confirm change</SheetTitle>
            <SheetDescription>
              You're switching to DSM {upgradeFor?.name}.
            </SheetDescription>
          </SheetHeader>
          {upgradeFor && (
            <div className="flex flex-col gap-4 mt-6">
              <div className="d2-card" style={{ padding: 14 }}>
                <div className="flex items-baseline justify-between">
                  <div style={{ fontSize: 13, fontWeight: 500 }}>DSM {upgradeFor.name}</div>
                  <div className="d2-mono" style={{ fontSize: 18, fontWeight: 500 }}>
                    £{billing === "monthly" ? upgradeFor.monthly : upgradeFor.yearly}
                    <span style={{ fontSize: 11, fontWeight: 400, color: "var(--d2-text-2)" }}>/month</span>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "var(--d2-text-2)", marginTop: 4 }}>
                  Billed {billing}. Cancel anytime.
                </div>
              </div>
              <button
                onClick={() => { setUpgradeFor(null); toast("Plan switching not wired yet — contact support to change plan."); }}
                className="flex items-center justify-center gap-2"
                style={{
                  padding: "10px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                  background: "var(--d2-indigo)", color: "#fff",
                }}
              >
                <CreditCard size={14} /> Confirm change
              </button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </DashboardShell>
  );
}
