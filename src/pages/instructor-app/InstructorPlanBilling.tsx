import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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

type PlanId = "starter" | "pro" | "studio";
interface Feature { included: boolean; bold?: boolean; text: string }
interface Plan {
  id: PlanId; name: string; tagline: string; monthly: number; yearly: number; features: Feature[];
}

const PLANS: Plan[] = [
  { id: "starter", name: "Starter", tagline: "Get going as a new instructor", monthly: 0, yearly: 0,
    features: [
      { included: true,  text: "Up to 10 active pupils" },
      { included: true,  text: "Basic schedule and pupil notes" },
      { included: true,  text: "Manual payment tracking" },
      { included: false, text: "Square auto-payments" },
      { included: false, text: "Mini website" },
      { included: false, text: "AI Assistant ED" },
    ]},
  { id: "pro", name: "Pro", tagline: "For working full-time instructors", monthly: 24, yearly: 19,
    features: [
      { included: true, bold: true, text: "Up to 100 pupils" },
      { included: true,  text: "Square auto-payments and payouts" },
      { included: true,  text: "Mini website on subdomain" },
      { included: true,  text: "Retention alerts and reminders" },
      { included: true,  text: "500 AI credits/month" },
      { included: false, text: "Unlimited AI Assistant ED" },
    ]},
  { id: "studio", name: "Studio", tagline: "For schools with multiple instructors", monthly: 49, yearly: 39,
    features: [
      { included: true, bold: true, text: "Unlimited pupils" },
      { included: true,  text: "Everything in Pro" },
      { included: true, bold: true, text: "Custom domain" },
      { included: true,  text: "Up to 5 instructor accounts" },
      { included: true, bold: true, text: "Unlimited AI Assistant ED" },
      { included: true,  text: "API access and webhooks" },
    ]},
];

const USAGE = [
  { label: "Pupils", used: 39, total: 100, unit: "" },
  { label: "AI credits", used: 340, total: 500, unit: "" },
  { label: "Storage", used: 1.2, total: 5, unit: " GB" },
];

const INVOICES = [
  { date: "4 May 2026",  desc: "DSM Pro · Monthly", amount: 24, status: "PAID" },
  { date: "4 Apr 2026",  desc: "DSM Pro · Monthly", amount: 24, status: "PAID" },
  { date: "4 Mar 2026",  desc: "DSM Pro · Monthly", amount: 24, status: "PAID" },
  { date: "4 Feb 2026",  desc: "DSM Pro · Monthly", amount: 24, status: "PAID" },
  { date: "4 Jan 2026",  desc: "DSM Pro · Monthly", amount: 24, status: "PAID" },
  { date: "4 Dec 2025",  desc: "DSM Pro · Monthly", amount: 24, status: "PAID" },
];

function meterColor(pct: number) {
  if (pct >= 90) return "#F43F5E";
  if (pct >= 70) return "#F59E0B";
  return "#4F46E5";
}

function UsageMeter({ label, used, total, unit }: { label: string; used: number; total: number; unit: string }) {
  const pct = Math.min(100, (used / total) * 100);
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
  plan, current, recommended, billing, onSelect,
}: {
  plan: Plan; current: PlanId; recommended: PlanId | null; billing: "monthly" | "yearly";
  onSelect: (p: Plan) => void;
}) {
  const isCurrent = plan.id === current;
  const isRecommended = !isCurrent && plan.id === recommended;
  const price = billing === "monthly" ? plan.monthly : plan.yearly;

  // CTA logic
  const order: PlanId[] = ["starter", "pro", "studio"];
  let ctaLabel = "Choose plan";
  let ctaVariant: "primary" | "outline" | "muted" = "outline";
  if (isCurrent) { ctaLabel = "You're on this plan"; ctaVariant = "muted"; }
  else if (order.indexOf(plan.id) < order.indexOf(current)) { ctaLabel = "Downgrade"; ctaVariant = "outline"; }
  else { ctaLabel = `Upgrade to ${plan.name}`; ctaVariant = "primary"; }

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

export default function InstructorPlanBilling() {
  const navigate = useNavigate();
  const { instructor, signOut } = useInstructorAuth();
  const { total: notificationCount } = useCombinedNotificationCount(instructor?.id);

  const [current] = useState<PlanId>("pro");
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [upgradeFor, setUpgradeFor] = useState<Plan | null>(null);

  const recommended: PlanId | null = useMemo(() => {
    if (current === "starter") return "pro";
    if (current === "pro") return "studio";
    return null;
  }, [current]);

  const overLimit = USAGE.some(u => u.used / u.total >= 1);

  const handleSignOut = async () => { await signOut(); navigate("/instructor-app/login"); };
  const initials = (instructor?.name || "")
    .split(" ").map(p => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "ID";

  const planObj = PLANS.find(p => p.id === current)!;
  const renewal = "4 June 2026";

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
                <span style={{ fontSize: 14, fontWeight: 500, color: "var(--d2-text-1)" }}>DSM {planObj.name}</span>
                <span style={{
                  fontSize: 9, fontWeight: 500, padding: "2px 7px", borderRadius: 6,
                  background: "#ECFDF5", color: "#047857",
                }}>CURRENT PLAN</span>
              </div>
              <div className="d2-mono" style={{ fontSize: 11, color: "var(--d2-text-2)", marginTop: 4 }}>
                £{planObj.monthly}/month · Renews on {renewal}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                style={{
                  padding: "5px 10px", borderRadius: 6, fontSize: 11,
                  border: "0.5px solid var(--d2-border)", background: "var(--d2-surface)",
                  color: "var(--d2-text-1)",
                }}
              >
                Manage
              </button>
              <button
                onClick={() => setUpgradeFor(PLANS.find(p => p.id === "studio") ?? null)}
                style={{
                  padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 500,
                  background: "var(--d2-indigo)", color: "#fff",
                }}
              >
                Upgrade
              </button>
            </div>
          </div>

          <div style={{ borderTop: "0.5px solid var(--d2-border)", margin: "12px 0" }} />

          <div className="grid" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
            {USAGE.map(u => <UsageMeter key={u.label} {...u} />)}
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
        <div className="grid" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10, marginTop: 8 }}>
          {PLANS.map(p => (
            <PlanCard
              key={p.id} plan={p} current={current} recommended={recommended} billing={billing}
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
                  width: 32, height: 22, borderRadius: 3, background: "#1F2937",
                  color: "#fff", fontSize: 8, fontWeight: 700, letterSpacing: 0.5,
                }}
              >
                VISA
              </div>
              <div className="flex-1">
                <div className="d2-mono" style={{ fontSize: 12, color: "var(--d2-text-1)" }}>•••• 4242</div>
                <div style={{ fontSize: 10, color: "var(--d2-text-2)" }}>Expires 08/27</div>
              </div>
            </div>
            <button style={{ fontSize: 11, color: "var(--d2-indigo)", marginTop: 10, fontWeight: 500 }}>
              Update payment method →
            </button>
            <div style={{ borderTop: "0.5px solid var(--d2-border)", margin: "12px 0" }} />
            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--d2-text-3)", textTransform: "uppercase", letterSpacing: 0.6 }}>
              Billing email
            </div>
            <div className="d2-mono" style={{ fontSize: 12, color: "var(--d2-text-1)", marginTop: 4 }}>
              {instructor?.email || "billing@drive365.co.uk"}
            </div>
          </div>

          <div className="d2-card" style={{ padding: 14 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--d2-text-1)" }}>Invoices</div>
              <button
                onClick={() => toast("Preparing download…")}
                style={{ fontSize: 11, color: "var(--d2-indigo)", fontWeight: 500 }}
              >
                Download all →
              </button>
            </div>

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

            {INVOICES.map((inv, i) => (
              <div
                key={i}
                className="grid items-center"
                style={{
                  gridTemplateColumns: "90px 1fr 70px 60px 24px",
                  gap: 8, padding: "8px 0",
                  borderBottom: i === INVOICES.length - 1 ? "none" : "0.5px solid var(--d2-border)",
                  fontSize: 11,
                }}
              >
                <div className="d2-mono" style={{ color: "var(--d2-text-2)" }}>{inv.date}</div>
                <div style={{ color: "var(--d2-text-1)" }}>{inv.desc}</div>
                <div className="d2-mono text-right" style={{ color: "var(--d2-text-1)" }}>£{inv.amount.toFixed(2)}</div>
                <div>
                  <span style={{ fontSize: 9, fontWeight: 500, padding: "1px 6px", borderRadius: 6, background: "#ECFDF5", color: "#047857" }}>
                    {inv.status}
                  </span>
                </div>
                <button
                  onClick={() => toast("Invoice downloaded")}
                  className="flex items-center justify-center"
                  style={{ width: 24, height: 24, borderRadius: 6, color: "var(--d2-text-3)" }}
                  aria-label="Download invoice"
                >
                  <Download size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Cancel strip */}
        <div
          className="flex items-center justify-between"
          style={{ background: "#F8FAFC", borderRadius: 8, padding: "10px 14px", marginTop: 14 }}
        >
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: "var(--d2-text-1)" }}>Cancel subscription</div>
            <div style={{ fontSize: 11, color: "var(--d2-text-2)", marginTop: 2 }}>
              You'll keep {planObj.name} features until the end of your billing period.
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
      </div>

      {/* Cancel confirm */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel your DSM {planObj.name} subscription?</DialogTitle>
            <DialogDescription>
              You'll keep {planObj.name} features until {renewal}, then your account will switch to Starter. Your data is retained.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => { setCancelOpen(false); toast.success("You're staying on Pro 👍"); }}
              style={{
                padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500,
                background: "var(--d2-indigo)", color: "#fff",
              }}
            >
              Keep my plan
            </button>
            <button
              onClick={() => { setCancelOpen(false); toast("Your subscription will cancel on " + renewal); }}
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
            <SheetTitle>Confirm upgrade</SheetTitle>
            <SheetDescription>
              You're upgrading to DSM {upgradeFor?.name}.
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
                onClick={() => { setUpgradeFor(null); toast.success(`Upgraded to ${upgradeFor.name}`); }}
                className="flex items-center justify-center gap-2"
                style={{
                  padding: "10px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                  background: "var(--d2-indigo)", color: "#fff",
                }}
              >
                <CreditCard size={14} /> Pay with •••• 4242
              </button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </DashboardShell>
  );
}
