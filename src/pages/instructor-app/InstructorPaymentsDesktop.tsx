import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Download, Plus, CreditCard, PoundSterling, Landmark,
  MoreVertical, ChevronLeft, ChevronRight, X, Search, Undo2,
} from "lucide-react";
import { RefundModal } from "@/components/instructor/RefundModal";
import { DashboardShell } from "@/components/instructor/dashboardV2/DashboardShell";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useCombinedNotificationCount } from "@/hooks/useCombinedNotificationCount";
import { motion, AnimatePresence } from "framer-motion";
import { useInstructorPaymentsData, type PaymentTx, type PaymentStatus, type PaymentMethod } from "@/hooks/useInstructorPaymentsData";
import { PaymentsExportDialog } from "@/components/instructor/payments/PaymentsExportDialog";
import { SendAllRemindersDialog } from "@/components/instructor/payments/SendAllRemindersDialog";
import { supabase } from "@/integrations/supabase/client";
import { usePaymentInvalidation } from "@/hooks/usePaymentInvalidation";

// ---------- palette ----------
const palette: Record<string, { bg: string; text: string }> = {
  coral:  { bg: "#F0997B", text: "#4A1B0C" },
  blue:   { bg: "#85B7EB", text: "#042C53" },
  green:  { bg: "#C0DD97", text: "#173404" },
  pink:   { bg: "#ED93B1", text: "#4B1528" },
  purple: { bg: "#AFA9EC", text: "#26215C" },
  gray:   { bg: "#B4B2A9", text: "#2C2C2A" },
  amber:  { bg: "#FAC775", text: "#412402" },
};

const COLOR_KEYS = ["coral","blue","green","pink","purple","gray","amber"] as const;
function pupilColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return COLOR_KEYS[h % COLOR_KEYS.length];
}
function pupilInitials(name: string) {
  return name.split(/\s+/).map(s => s[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";
}

// ---------- helpers ----------
const gbp = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);

function dayLabel(d: Date) {
  const today = new Date(); today.setHours(0,0,0,0);
  const ymd = (x: Date) => `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`;
  const yest = new Date(today); yest.setDate(today.getDate() - 1);
  const target = new Date(d); target.setHours(0,0,0,0);
  const fmt = `${target.getDate()} ${target.toLocaleString("en-GB", { month: "short" }).toUpperCase()}`;
  if (ymd(target) === ymd(today)) return `TODAY · ${fmt}`;
  if (ymd(target) === ymd(yest)) return `YESTERDAY · ${fmt}`;
  return fmt;
}

const STATUS_STYLES: Record<PaymentStatus, { bg: string; color: string }> = {
  paid:     { bg: "#ECFDF5", color: "#047857" },
  pending:  { bg: "#FEF3C7", color: "#B45309" },
  refunded: { bg: "#F1F5F9", color: "#64748B" },
  failed:   { bg: "#FCEBEB", color: "#791F1F" },
};

function StatusPill({ s }: { s: PaymentStatus }) {
  const sty = STATUS_STYLES[s];
  return (
    <span style={{
      background: sty.bg, color: sty.color, fontSize: 9, fontWeight: 500,
      padding: "1px 6px", borderRadius: 6, textTransform: "uppercase", letterSpacing: "0.4px",
    }}>{s}</span>
  );
}

function Avatar({ id, name, size = 22 }: { id: string; name: string; size?: number }) {
  const c = palette[pupilColor(id)] || palette.gray;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: c.bg, color: c.text, display: "flex",
      alignItems: "center", justifyContent: "center",
      fontSize: Math.round(size * 0.42), fontWeight: 600, flexShrink: 0,
    }}>{pupilInitials(name)}</div>
  );
}

// ---------- page ----------
type Filter = "all" | "paid" | "pending" | "refunded" | "failed";

export default function InstructorPaymentsDesktop() {
  const navigate = useNavigate();
  const { instructor, signOut } = useInstructorAuth();
  const { total: notificationCount } = useCombinedNotificationCount(instructor?.id);

  const [filter, setFilter] = useState<Filter>("all");
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");
  const [takeOpen, setTakeOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [pupilSheet, setPupilSheet] = useState<{ id: string; name: string } | null>(null);
  const [remindersOpen, setRemindersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<"all" | PaymentMethod>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const PAGE = 25;

  const { loading, error, stats, cashFlow, outstanding, transactions, refresh } = useInstructorPaymentsData(instructor?.id);
  const [allPupils, setAllPupils] = useState<{ id: string; name: string; phone: string | null; email: string | null; account_balance: number | null }[]>([]);

  useEffect(() => {
    if (!instructor?.id) return;
    supabase
      .from("pupils")
      .select("id, name, phone, email, account_balance")
      .eq("instructor_id", instructor.id)
      .is("deleted_at", null)
      .order("name", { ascending: true })
      .then(({ data }) => setAllPupils(data || []));
  }, [instructor?.id]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const fromMs = dateFrom ? new Date(dateFrom + "T00:00:00").getTime() : null;
    const toMs = dateTo ? new Date(dateTo + "T23:59:59.999").getTime() : null;
    return transactions.filter(t => {
      if (filter !== "all" && t.status !== filter) return false;
      if (methodFilter !== "all" && t.method !== methodFilter) return false;
      const ts = new Date(t.dateTime).getTime();
      if (fromMs !== null && ts < fromMs) return false;
      if (toMs !== null && ts > toMs) return false;
      if (q) {
        const hay = `${t.pupilName} ${t.forText} ${t.note ?? ""} ${t.method} ${t.status}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [filter, methodFilter, dateFrom, dateTo, search, transactions]);

  const filtersActive = search.trim() !== "" || methodFilter !== "all" || dateFrom !== "" || dateTo !== "" || filter !== "all";
  const clearAllFilters = () => {
    setSearch(""); setMethodFilter("all"); setDateFrom(""); setDateTo(""); setFilter("all"); setPage(1);
  };

  useEffect(() => { setPage(1); }, [search, methodFilter, dateFrom, dateTo]);

  const counts = useMemo(() => ({
    all: transactions.length,
    paid: transactions.filter(t => t.status === "paid").length,
    pending: transactions.filter(t => t.status === "pending").length,
    refunded: transactions.filter(t => t.status === "refunded").length,
    failed: transactions.filter(t => t.status === "failed").length,
  }), [transactions]);

  const grouped = useMemo(() => {
    const map = new Map<string, PaymentTx[]>();
    filtered.forEach(t => {
      const d = new Date(t.dateTime);
      const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(t);
    });
    return Array.from(map.entries()).map(([k, list]) => ({
      key: k, date: new Date(list[0].dateTime), items: list,
    }));
  }, [filtered]);

  const pupilOptions = useMemo(() => {
    if (allPupils.length > 0) return allPupils.map(p => ({ id: p.id, name: p.name, phone: p.phone, email: p.email }));
    const seen = new Map<string, string>();
    transactions.forEach(t => { if (!seen.has(t.pupilId)) seen.set(t.pupilId, t.pupilName); });
    outstanding.forEach(o => { if (!seen.has(o.id)) seen.set(o.id, o.name); });
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name, phone: null, email: null }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [transactions, outstanding, allPupils]);

  useEffect(() => { if (error) toast.error(error); }, [error]);

  // Realtime: incoming payments → instant on-screen confirmation
  useEffect(() => {
    if (!instructor?.id) return;
    const channel = supabase
      .channel(`pay-history-desk-${instructor.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "payment_history",
          filter: `instructor_id=eq.${instructor.id}`,
        },
        (payload) => {
          const row: any = payload.new;
          const amount = Number(row?.amount || 0);
          if (!amount || amount <= 0) return;
          const pupil = allPupils.find((p) => p.id === row.pupil_id);
          const who = pupil?.name?.split(" ")[0] || "a pupil";
          const method = row.payment_method || "Payment";
          toast.success(`£${amount.toFixed(2)} received from ${who}`, {
            description: `${method} confirmed`,
          });
          refresh();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [instructor?.id, allPupils, refresh]);

  const initials = (instructor?.name || "").split(" ").map(s=>s[0]).filter(Boolean).slice(0,2).join("").toUpperCase() || "ID";
  const handleSignOut = async () => { await signOut(); navigate("/instructor-app/login"); };

  // chart geometry
  const chartW = 460, chartH = 140, padL = 30, padB = 20, padT = 8, padR = 8;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;
  const maxAmt = Math.max(100, ...cashFlow.map(c => c.amount));
  const max = Math.ceil(maxAmt / 100) * 100;
  const barW = 24, gap = cashFlow.length > 1 ? (innerW - barW * cashFlow.length) / (cashFlow.length - 1) : 0;
  const yFor = (v: number) => padT + innerH - (v / max) * innerH;
  const forecastStartIdx = cashFlow.findIndex(c => c.type === "forecast");
  const sepX = forecastStartIdx >= 0 ? padL + (barW + gap) * forecastStartIdx - gap / 2 : padL;

  const cols = "90px minmax(0, 1.4fr) 80px 110px 80px 90px 30px";

  return (
    <DashboardShell
      userInitials={initials}
      userName={instructor?.name || "Instructor"}
      notificationCount={notificationCount}
      onSignOut={handleSignOut}
      onAskED={() => window.dispatchEvent(new CustomEvent("dsm:open-ai"))}
      onBell={() => navigate("/instructor/notifications")}
    >
      <div className="flex flex-col" style={{ gap: 14 }}>
        {/* Header */}
        <div className="flex items-start justify-between" style={{ gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 500, color: "var(--d2-text-1)", letterSpacing: "-0.3px" }}>Payments</h1>
            <p style={{ fontSize: 12, color: "var(--d2-text-3)", marginTop: 2 }}>
              Track money in, manage outstanding balances and view payouts.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setExportOpen(true)} style={outlineBtn}>
              <Download size={12} /> Export
            </button>
            <button onClick={() => setTakeOpen(true)} style={primaryBtn}>
              <Plus size={12} /> Take payment
            </button>
            <button onClick={() => setRefundOpen(true)} style={refundBtn} title="Refund a payment">
              <Undo2 size={12} /> Refund
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-4" style={{ gap: 8 }}>
          <StatCard variant="emerald" label={`RECEIVED · ${new Date().toLocaleString("en-GB", { month: "short" }).toUpperCase()}`} value={gbp(stats.receivedMonth)} sub={`${stats.receivedCount} payments`} />
          <StatCard variant="rose"    label="OUTSTANDING"     value={gbp(stats.outstanding)}    sub={`${stats.outstandingPupils} pupils`} />
          <StatCard variant="neutral" label="NEXT PAYOUT"     value={gbp(stats.nextPayout)}     sub={`${stats.nextPayoutDate} · Square`} />
          <StatCard variant="neutral" label={`FEES · ${new Date().toLocaleString("en-GB", { month: "short" }).toUpperCase()}`}      value={gbp(stats.feesMonth)}      sub={`${stats.effectiveFeeRate}% effective`} />
        </div>

        {/* Cash flow + Outstanding */}
        <div className="grid" style={{ gridTemplateColumns: "1.4fr 1fr", gap: 10 }}>
          <Card>
            <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--d2-text-1)" }}>Cash flow</div>
              <div className="flex items-center" style={{ background: "#F1F5F9", borderRadius: 8, padding: 3, gap: 2 }}>
                {(["week","month","year"] as const).map(p => {
                  const a = p === period;
                  return (
                    <button key={p} onClick={() => setPeriod(p)} style={{
                      padding: "3px 8px", borderRadius: 6, fontSize: 10,
                      background: a ? "#fff" : "transparent",
                      color: a ? "var(--d2-text-1)" : "var(--d2-text-2)",
                      fontWeight: a ? 500 : 400, textTransform: "capitalize",
                      boxShadow: a ? "0 1px 2px rgba(15,23,42,0.06)" : "none",
                    }}>{p}</button>
                  );
                })}
              </div>
            </div>

            <svg width="100%" viewBox={`0 0 ${chartW} ${chartH}`} style={{ display: "block" }}>
              {/* Gridlines */}
              {[0, 300, 600].map(v => (
                <g key={v}>
                  <line
                    x1={padL} x2={chartW - padR}
                    y1={yFor(v)} y2={yFor(v)}
                    stroke="#E2E8F0" strokeWidth={0.5}
                    strokeDasharray={v === 0 ? "0" : "3 3"}
                  />
                  <text x={padL - 4} y={yFor(v) + 3} fontSize={9} fill="#94A3B8" textAnchor="end">£{v}</text>
                </g>
              ))}

              {/* Separator */}
              <line x1={sepX} x2={sepX} y1={padT} y2={padT + innerH}
                stroke="#94A3B8" strokeWidth={0.5} strokeDasharray="3 3" />

              {/* Bars */}
              {cashFlow.map((c, i) => {
                const x = padL + i * (barW + gap);
                const y = yFor(c.amount);
                const h = padT + innerH - y;
                const fill = c.type === "current" ? "#378ADD"
                  : c.type === "forecast" ? "#E2E8F0" : "#85B7EB";
                return (
                  <g key={c.week}>
                    <rect x={x} y={y} width={barW} height={h} rx={2} ry={2} fill={fill} />
                    <text x={x + barW / 2} y={padT + innerH + 12}
                      fontSize={8} textAnchor="middle"
                      fill={c.type === "current" ? "var(--d2-text-1)" : "#94A3B8"}
                      fontWeight={c.type === "current" ? 500 : 400}>
                      {c.week}
                    </text>
                  </g>
                );
              })}
            </svg>

            <div className="flex items-center" style={{ gap: 12, marginTop: 6, fontSize: 10, color: "var(--d2-text-2)" }}>
              <div className="flex items-center" style={{ gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: "#378ADD" }} /> Received
              </div>
              <div className="flex items-center" style={{ gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: "#E2E8F0" }} /> Forecast
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--d2-text-1)" }}>Outstanding</div>
              <button
                onClick={() => setRemindersOpen(true)}
                disabled={outstanding.length === 0}
                style={{ fontSize: 10, color: "#4F46E5", fontWeight: 500, opacity: outstanding.length === 0 ? 0.4 : 1 }}
              >
                Send all reminders →
              </button>
            </div>
            {outstanding.length === 0 && (
              <div style={{ padding: "16px 0", fontSize: 11, color: "var(--d2-text-3)" }}>
                {loading ? "Loading…" : "No outstanding balances."}
              </div>
            )}
            {outstanding.map((o, i) => {
              const overdue = o.daysOverdue !== undefined;
              return (
                <div key={o.id}
                  className="flex items-center"
                  style={{
                    gap: 8, padding: "7px 0",
                    borderBottom: i === outstanding.length - 1 ? "none" : "0.5px solid var(--d2-border)",
                    cursor: "pointer",
                  }}
                  onClick={() => setPupilSheet({ id: o.id, name: o.name })}
                >
                  <Avatar id={o.id} name={o.name} size={24} />
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: 11, fontWeight: 500, color: "var(--d2-text-1)" }}>{o.name}</div>
                    <div style={{ fontSize: 9, color: "var(--d2-text-3)" }}>
                      {overdue
                        ? (o.daysOverdue! > 0 ? `Overdue · ${o.daysOverdue} days` : "Overdue")
                        : `Due in ${o.daysUntilDue} days`}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 11, fontFamily: "var(--d2-mono)", fontVariantNumeric: "tabular-nums",
                    color: overdue ? "#BE123C" : "var(--d2-text-1)", fontWeight: overdue ? 500 : 400,
                  }}>
                    {gbp(o.amount)}
                  </div>
                </div>
              );
            })}
          </Card>
        </div>

        {/* Transactions header */}
        <div className="flex items-center justify-between">
          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--d2-text-1)" }}>Transactions</div>
          <div className="flex items-center" style={{ gap: 5 }}>
            {(["all","paid","pending","refunded","failed"] as Filter[]).map(f => {
              const a = filter === f;
              return (
                <button key={f} onClick={() => { setFilter(f); setPage(1); }} style={{
                  padding: "5px 10px", borderRadius: 6, fontSize: 11,
                  fontWeight: a ? 500 : 400, textTransform: "capitalize",
                  background: a ? "#EEF2FF" : "transparent",
                  color: a ? "#4338CA" : "var(--d2-text-2)",
                  border: a ? "0.5px solid transparent" : "0.5px solid var(--d2-border)",
                }}>
                  {f} <span style={{ color: a ? "#6366F1" : "var(--d2-text-3)", fontVariantNumeric: "tabular-nums" }}>· {counts[f]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search + date/method filters */}
        <div className="flex items-center" style={{ gap: 8, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1 1 240px", minWidth: 200 }}>
            <Search size={12} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "var(--d2-text-3)" }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search pupil, note, method…"
              style={{
                width: "100%", padding: "6px 26px 6px 26px",
                fontSize: 11, borderRadius: 6,
                border: "0.5px solid var(--d2-border)", background: "#fff",
                color: "var(--d2-text-1)", outline: "none",
              }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{
                position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
                color: "var(--d2-text-3)", padding: 2,
              }}><X size={11} /></button>
            )}
          </div>
          <select
            value={methodFilter}
            onChange={e => setMethodFilter(e.target.value as any)}
            style={{
              padding: "6px 8px", fontSize: 11, borderRadius: 6,
              border: "0.5px solid var(--d2-border)", background: "#fff",
              color: "var(--d2-text-1)", outline: "none", cursor: "pointer",
            }}
          >
            <option value="all">All methods</option>
            <option value="card">Card</option>
            <option value="cash">Cash</option>
            <option value="bank">Bank</option>
          </select>
          <div className="flex items-center" style={{ gap: 4, fontSize: 11, color: "var(--d2-text-3)" }}>
            <span>From</span>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              style={{ padding: "5px 6px", fontSize: 11, borderRadius: 6, border: "0.5px solid var(--d2-border)", background: "#fff", color: "var(--d2-text-1)" }} />
            <span>To</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              style={{ padding: "5px 6px", fontSize: 11, borderRadius: 6, border: "0.5px solid var(--d2-border)", background: "#fff", color: "var(--d2-text-1)" }} />
          </div>
          {filtersActive && (
            <button onClick={clearAllFilters} style={{ fontSize: 11, color: "#4F46E5", fontWeight: 500, padding: "4px 6px" }}>
              Clear filters
            </button>
          )}
        </div>

        {/* Transactions table */}
        <div style={{
          background: "#fff", border: "0.5px solid var(--d2-border)", borderRadius: 8, overflow: "hidden",
        }}>
          <div style={{
            display: "grid", gridTemplateColumns: cols,
            padding: "8px 12px", background: "#F8FAFC",
            borderBottom: "0.5px solid var(--d2-border)",
            fontSize: 10, color: "var(--d2-text-3)", textTransform: "uppercase",
            letterSpacing: "0.5px", alignItems: "center", gap: 8,
          }}>
            <div>Date</div><div>Pupil</div><div>Method</div><div>For</div>
            <div style={{ textAlign: "right" }}>Amount</div><div>Status</div><div></div>
          </div>

          {grouped.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", fontSize: 12, color: "var(--d2-text-3)" }}>
              No transactions match these filters.
              <button onClick={clearAllFilters} style={{ marginLeft: 8, color: "#4F46E5", fontWeight: 500 }}>Clear filters</button>
            </div>
          ) : grouped.map(g => (
            <div key={g.key}>
              <div style={{
                background: "#F8FAFC", padding: "6px 12px",
                fontSize: 9, color: "var(--d2-text-3)", fontWeight: 500,
                letterSpacing: "0.5px", borderBottom: "0.5px solid var(--d2-border)",
              }}>{dayLabel(g.date)}</div>

              {g.items.map((t, i) => {
                const time = new Date(t.dateTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
                const isLast = i === g.items.length - 1;
                const negative = t.amount < 0;
                return (
                  <div key={t.id}
                    onClick={() => navigate(`/instructor/pupils/${t.pupilId}`)}
                    style={{
                      display: "grid", gridTemplateColumns: cols,
                      padding: "9px 12px", alignItems: "center", gap: 8,
                      fontSize: 12, borderBottom: isLast ? "none" : "0.5px solid var(--d2-border)",
                      cursor: "pointer", transition: "background 120ms ease-out",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#F8FAFC")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ fontFamily: "var(--d2-mono)", fontSize: 11, color: "var(--d2-text-2)" }}>{time}</div>
                    <div className="flex items-center" style={{ gap: 8, minWidth: 0 }}>
                      <Avatar id={t.pupilId} name={t.pupilName} />
                      <div style={{ fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {t.pupilName}
                      </div>
                    </div>
                    <div className="flex items-center" style={{ gap: 5, fontSize: 10, color: "var(--d2-text-2)" }}>
                      {t.method === "card" && <CreditCard size={11} />}
                      {t.method === "cash" && <PoundSterling size={11} />}
                      {t.method === "bank" && <Landmark size={11} />}
                      <span style={{ textTransform: "capitalize" }}>{t.method}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--d2-text-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {t.forText}
                    </div>
                    <div title={t.status === "paid" ? `${gbp(t.amount)} gross − ${gbp(t.amount * 0.0175)} Square fee = ${gbp(t.amount * 0.9825)} net` : ""}
                      style={{
                        textAlign: "right", fontFamily: "var(--d2-mono)", fontVariantNumeric: "tabular-nums",
                        fontSize: 12, fontWeight: 500,
                        color: negative ? "#BE123C" : "var(--d2-text-1)",
                      }}>
                      {negative ? `−${gbp(Math.abs(t.amount))}` : gbp(t.amount)}
                    </div>
                    <div><StatusPill s={t.status} /></div>
                    <button onClick={e => { e.stopPropagation(); toast("Row menu"); }}
                      style={{ color: "var(--d2-text-3)", padding: 4 }}>
                      <MoreVertical size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between" style={{ fontSize: 11, color: "var(--d2-text-3)", padding: "4px 0" }}>
          <div>Showing {Math.min(filtered.length, PAGE)} of {filtered.length} transactions</div>
          <div className="flex items-center" style={{ gap: 4 }}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={pageBtn(page === 1)}><ChevronLeft size={12} /></button>
            <button style={{ ...pageBtn(false), background: "#EEF2FF", color: "#4338CA", fontWeight: 500 }}>1</button>
            <button disabled style={pageBtn(true)}><ChevronRight size={12} /></button>
          </div>
        </div>
      </div>

      {/* Take payment sheet */}
      <AnimatePresence>
        {takeOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setTakeOpen(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.25)", zIndex: 60 }}
            />
            <motion.div
              initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: "fixed", top: 0, right: 0, bottom: 0, width: 380,
                background: "#fff", borderLeft: "0.5px solid var(--d2-border)",
                padding: 16, zIndex: 61, overflowY: "auto",
              }}
            >
              <TakePaymentSheet
                onClose={() => setTakeOpen(false)}
                pupils={pupilOptions}
                instructorId={instructor?.id}
                onSuccess={refresh}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <RefundModal
        open={refundOpen}
        onOpenChange={setRefundOpen}
        instructorId={instructor?.id || ""}
        pupils={allPupils.map(p => ({ id: p.id, name: p.name, account_balance: p.account_balance }))}
        squareConnected={!!(instructor as any)?.square_merchant_id}
        onRefunded={refresh}
      />

      <PaymentsExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        transactions={transactions}
        filteredTransactions={filtered}
        activeFilters={{
          search: search.trim(),
          status: filter,
          method: methodFilter,
          dateFrom,
          dateTo,
        }}
        instructorName={instructor?.name}
      />

      <SendAllRemindersDialog
        open={remindersOpen}
        onOpenChange={setRemindersOpen}
        outstanding={outstanding}
        allPupils={allPupils}
        instructorId={instructor?.id}
        instructorName={instructor?.name}
      />

      <AnimatePresence>
        {pupilSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setPupilSheet(null)}
              style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.25)", zIndex: 60 }}
            />
            <motion.div
              initial={{ x: 440 }} animate={{ x: 0 }} exit={{ x: 440 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: "fixed", top: 0, right: 0, bottom: 0, width: 420,
                background: "#fff", borderLeft: "0.5px solid var(--d2-border)",
                padding: 16, zIndex: 61, overflowY: "auto",
              }}
            >
              <PupilPaymentsSheet
                pupilId={pupilSheet.id}
                pupilName={pupilSheet.name}
                instructorId={instructor?.id}
                onClose={() => setPupilSheet(null)}
                onTakePayment={() => { setPupilSheet(null); setTakeOpen(true); }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DashboardShell>
  );
}

// ---------- subcomponents ----------
const outlineBtn: React.CSSProperties = {
  fontSize: 11, padding: "6px 10px", borderRadius: 8,
  border: "0.5px solid var(--d2-border)", background: "#fff",
  color: "var(--d2-text-2)", display: "inline-flex", alignItems: "center", gap: 6,
};
const primaryBtn: React.CSSProperties = {
  fontSize: 11, padding: "6px 10px", borderRadius: 8,
  background: "#4F46E5", color: "#fff", fontWeight: 500,
  display: "inline-flex", alignItems: "center", gap: 6,
};
const refundBtn: React.CSSProperties = {
  fontSize: 11, padding: "6px 10px", borderRadius: 8,
  background: "#FEE2E2", color: "#B91C1C", fontWeight: 600,
  border: "0.5px solid #FCA5A5",
  display: "inline-flex", alignItems: "center", gap: 6,
  boxShadow: "0 1px 2px rgba(185,28,28,0.08)",
  cursor: "pointer",
};
const pageBtn = (disabled: boolean): React.CSSProperties => ({
  width: 24, height: 24, borderRadius: 5, fontSize: 11,
  border: "0.5px solid var(--d2-border)", background: "#fff",
  color: "var(--d2-text-2)", opacity: disabled ? 0.4 : 1,
  display: "inline-flex", alignItems: "center", justifyContent: "center",
});

function Card({ children }: { children: React.ReactNode }) {
  return <div style={{ background: "#fff", border: "0.5px solid var(--d2-border)", borderRadius: 8, padding: 12 }}>{children}</div>;
}

function StatCard({
  variant, label, value, sub,
}: { variant: "emerald" | "rose" | "neutral"; label: string; value: string; sub: string }) {
  const styles = {
    emerald: { bg: "#ECFDF5", color: "#047857" },
    rose:    { bg: "#FFF1F2", color: "#BE123C" },
    neutral: { bg: "#F8FAFC", color: "var(--d2-text-1)" },
  }[variant];
  return (
    <div style={{ background: styles.bg, color: styles.color, borderRadius: 8, padding: 10 }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.5px", opacity: 0.8 }}>{label}</div>
      <div style={{
        fontSize: 20, fontWeight: 500, fontFamily: "var(--d2-mono)", fontVariantNumeric: "tabular-nums",
        marginTop: 2, lineHeight: 1.1,
      }}>{value}</div>
      <div style={{ fontSize: 10, opacity: 0.75, marginTop: 2 }}>{sub}</div>
    </div>
  );
}

type SheetPupil = { id: string; name: string; phone?: string | null; email?: string | null };

function TakePaymentSheet({
  onClose, pupils, instructorId, onSuccess,
}: {
  onClose: () => void;
  pupils: SheetPupil[];
  instructorId?: string;
  onSuccess?: () => void;
}) {
  const { invalidatePaymentQueries } = usePaymentInvalidation();
  const [pupilId, setPupilId] = useState<string>(pupils[0]?.id ?? "");
  const [forKind, setForKind] = useState("single");
  const [amount, setAmount] = useState("38.00");
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string; checkoutUrl?: string } | null>(null);

  // Keep pupil selection valid as list loads
  useEffect(() => {
    if (!pupilId && pupils[0]) setPupilId(pupils[0].id);
  }, [pupils, pupilId]);

  const numAmount = parseFloat(amount) || 0;
  const isRefund = forKind === "refund";
  const signedAmount = isRefund ? -Math.abs(numAmount) : Math.abs(numAmount);
  const selectedPupil = pupils.find(p => p.id === pupilId);

  const methodLabel = (m: PaymentMethod) =>
    m === "card" ? "Square" : m === "cash" ? "Cash" : "Bank Transfer";

  const submit = async () => {
    if (!instructorId) { toast.error("Not signed in"); return; }
    if (!pupilId) { toast.error("Select a pupil"); return; }
    if (!numAmount || numAmount < 0.5) { toast.error("Amount must be at least £0.50"); return; }

    setSending(true);
    setResult(null);

    try {
      const origin = window.location.origin;
      const { data, error } = await supabase.functions.invoke("record-payment", {
        body: {
          pupilId,
          amount: Math.abs(numAmount),
          method,
          isRefund,
          note: note || undefined,
          customerEmail: selectedPupil?.email || undefined,
          customerName: selectedPupil?.name,
          customerPhone: selectedPupil?.phone || undefined,
          returnUrl: `${origin}/instructor/payments?status=success`,
          cancelUrl: `${origin}/instructor/payments?status=cancelled`,
        },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "Failed to record payment");

      invalidatePaymentQueries({ pupilId, instructorId });
      onSuccess?.();

      if (method === "card") {
        setResult({
          ok: true,
          message: data.message || "Payment link created. Share with pupil to complete.",
          checkoutUrl: data.checkoutUrl,
        });
      } else {
        toast.success(data.message || `${isRefund ? "Refunded" : "Recorded"} ${gbp(Math.abs(numAmount))} (${methodLabel(method)})`);
        onClose();
      }
    } catch (e: any) {
      console.error("Take payment failed:", e);
      setResult({ ok: false, message: e?.message || "Something went wrong. Please try again." });
      toast.error(e?.message || "Failed to take payment");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col" style={{ gap: 14 }}>
      <div className="flex items-center justify-between">
        <div style={{ fontSize: 14, fontWeight: 500 }}>Take payment</div>
        <button onClick={onClose} style={{ color: "var(--d2-text-3)" }}><X size={14} /></button>
      </div>

      <Field label="Pupil">
        <select value={pupilId} onChange={e => setPupilId(e.target.value)} style={inputStyle} disabled={sending}>
          {pupils.length === 0 && <option value="">No pupils</option>}
          {pupils.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </Field>

      <Field label="What's it for">
        <div className="flex flex-col" style={{ gap: 4 }}>
          {[
            { v: "single", l: "Single lesson", a: "38.00" },
            { v: "block",  l: "Block of 10",   a: "360.00" },
            { v: "mock",   l: "Mock test",     a: "60.00" },
            { v: "refund", l: "Refund",        a: "" },
            { v: "custom", l: "Custom",        a: "" },
          ].map(o => (
            <label key={o.v} className="flex items-center" style={{ gap: 8, fontSize: 12, cursor: "pointer" }}>
              <input
                type="radio" name="kind" value={o.v} checked={forKind === o.v}
                onChange={() => { setForKind(o.v); if (o.a) setAmount(o.a); }}
                style={{ accentColor: "#4F46E5" }}
                disabled={sending}
              />
              {o.l}
            </label>
          ))}
        </div>
      </Field>

      <Field label="Amount">
        <input
          value={amount} onChange={e => setAmount(e.target.value)}
          inputMode="decimal"
          disabled={sending}
          style={{ ...inputStyle, fontSize: 24, fontFamily: "var(--d2-mono)", fontVariantNumeric: "tabular-nums" }}
        />
        <div className="flex items-center" style={{ gap: 5, marginTop: 6 }}>
          {["38.00", "60.00", "360.00"].map(v => (
            <button key={v} onClick={() => setAmount(v)} disabled={sending} style={{
              fontSize: 11, padding: "4px 8px", borderRadius: 6,
              border: "0.5px solid var(--d2-border)", background: "#fff",
              color: "var(--d2-text-2)",
            }}>£{v}</button>
          ))}
        </div>
      </Field>

      <Field label="Method">
        <div className="grid grid-cols-3" style={{ gap: 6 }}>
          {([
            { v: "card", l: "Square", icon: <CreditCard size={14} />, sub: "Pupil pays via link" },
            { v: "cash", l: "Cash", icon: <PoundSterling size={14} /> },
            { v: "bank", l: "Bank", icon: <Landmark size={14} /> },
          ] as const).map(m => {
            const a = method === m.v;
            return (
              <button key={m.v} onClick={() => setMethod(m.v)} disabled={sending} style={{
                padding: 8, borderRadius: 8,
                border: a ? "1px solid #4F46E5" : "0.5px solid var(--d2-border)",
                background: a ? "#EEF2FF" : "#fff",
                color: "var(--d2-text-1)", fontSize: 11, fontWeight: 500,
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              }}>
                {m.icon}<span>{m.l}</span>
                {"sub" in m && <span style={{ fontSize: 8, color: "var(--d2-text-3)", fontWeight: 400, lineHeight: 1.2, textAlign: "center" }}>{m.sub}</span>}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Note">
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="Optional" style={inputStyle} disabled={sending} />
      </Field>

      {result?.ok ? (
        <div style={{ background: "#ECFDF5", color: "#047857", padding: 10, borderRadius: 8, fontSize: 12 }}>
          ✓ {result.message}
          {result.checkoutUrl && (
            <div className="flex items-center" style={{ gap: 6, marginTop: 6, flexWrap: "wrap" }}>
              <button
                onClick={() => { navigator.clipboard.writeText(result.checkoutUrl!); toast.success("Link copied"); }}
                style={{ ...outlineBtn, padding: "5px 8px" }}
              >Copy link</button>
              <a
                href={result.checkoutUrl} target="_blank" rel="noopener noreferrer"
                style={{ ...primaryBtn, padding: "5px 8px", textDecoration: "none" }}
              >Open</a>
              <button onClick={onClose} style={{ ...outlineBtn, padding: "5px 8px" }}>Done</button>
            </div>
          )}
        </div>
      ) : result && !result.ok ? (
        <div style={{ background: "#FCEBEB", color: "#791F1F", padding: 10, borderRadius: 8, fontSize: 12 }}>
          ✗ {result.message}
          <div className="flex items-center" style={{ gap: 6, marginTop: 6 }}>
            <button onClick={() => setResult(null)} style={{ ...primaryBtn, padding: "5px 8px" }}>Try again</button>
          </div>
        </div>
      ) : (
        <button onClick={submit} disabled={sending || !pupilId || !numAmount} style={{
          marginTop: 4, width: "100%", padding: "10px 12px", borderRadius: 8,
          background: "#4F46E5", color: "#fff", fontWeight: 500, fontSize: 13,
          opacity: sending || !pupilId || !numAmount ? 0.7 : 1,
        }}>
          {sending
            ? (method === "card" ? "Creating payment link…" : "Recording payment…")
            : (method === "card" ? `Send link for ${gbp(numAmount)}` : `${isRefund ? "Refund" : "Take"} ${gbp(numAmount)}`)}
        </button>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", fontSize: 12, padding: "6px 8px",
  border: "0.5px solid var(--d2-border)", borderRadius: 6,
  background: "#F8FAFC", outline: "none", color: "var(--d2-text-1)",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: "var(--d2-text-3)", fontWeight: 500, letterSpacing: "0.4px", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
      {children}
    </div>
  );
}

// ─── Pupil payments slide-over ───────────────────────────────
type LedgerRow = {
  id: string;
  recorded_at: string;
  amount: number;
  payment_method: string | null;
  notes: string | null;
};

function PupilPaymentsSheet({
  pupilId, pupilName, instructorId, onClose, onTakePayment,
}: {
  pupilId: string;
  pupilName: string;
  instructorId?: string;
  onClose: () => void;
  onTakePayment: () => void;
}) {
  const [tab, setTab] = useState<"payments" | "details">("payments");
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<number>(0);
  const [pupilMeta, setPupilMeta] = useState<{ phone: string | null; email: string | null; balance_due_date: string | null } | null>(null);
  const [rows, setRows] = useState<LedgerRow[]>([]);

  useEffect(() => {
    if (!instructorId || !pupilId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [pupilRes, txRes] = await Promise.all([
        supabase
          .from("pupils")
          .select("account_balance, phone, email, balance_due_date")
          .eq("id", pupilId)
          .maybeSingle(),
        supabase
          .from("payment_history")
          .select("id, recorded_at, amount, payment_method, notes")
          .eq("instructor_id", instructorId)
          .eq("pupil_id", pupilId)
          .is("deleted_at", null)
          .order("recorded_at", { ascending: false })
          .limit(50),
      ]);
      if (cancelled) return;
      setBalance(Number(pupilRes.data?.account_balance || 0));
      setPupilMeta({
        phone: pupilRes.data?.phone ?? null,
        email: pupilRes.data?.email ?? null,
        balance_due_date: pupilRes.data?.balance_due_date ?? null,
      });
      setRows((txRes.data || []) as LedgerRow[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [pupilId, instructorId]);

  const owed = balance < 0 ? Math.abs(balance) : 0;
  const credit = balance > 0 ? balance : 0;

  const totalIn = rows.filter(r => r.amount > 0).reduce((s, r) => s + Number(r.amount), 0);
  const totalOut = rows.filter(r => r.amount < 0).reduce((s, r) => s + Math.abs(Number(r.amount)), 0);

  return (
    <div className="flex flex-col" style={{ gap: 14 }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center" style={{ gap: 8 }}>
          <Avatar id={pupilId} name={pupilName} size={28} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--d2-text-1)" }}>{pupilName}</div>
            <div style={{ fontSize: 10, color: "var(--d2-text-3)" }}>
              {pupilMeta?.phone || pupilMeta?.email || "No contact on file"}
            </div>
          </div>
        </div>
        <button onClick={onClose} style={{ color: "var(--d2-text-3)" }}><X size={14} /></button>
      </div>

      {/* Tabs */}
      <div className="flex items-center" style={{ background: "#F1F5F9", borderRadius: 8, padding: 3, gap: 2 }}>
        {(["payments", "details"] as const).map(t => {
          const a = t === tab;
          return (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: "5px 8px", borderRadius: 6, fontSize: 11,
              background: a ? "#fff" : "transparent",
              color: a ? "var(--d2-text-1)" : "var(--d2-text-2)",
              fontWeight: a ? 500 : 400, textTransform: "capitalize",
              boxShadow: a ? "0 1px 2px rgba(15,23,42,0.06)" : "none",
            }}>{t}</button>
          );
        })}
      </div>

      {tab === "payments" && (
        <>
          {/* Balance card */}
          <div style={{
            background: owed > 0 ? "#FFF1F2" : credit > 0 ? "#ECFDF5" : "#F8FAFC",
            color: owed > 0 ? "#BE123C" : credit > 0 ? "#047857" : "var(--d2-text-1)",
            borderRadius: 8, padding: 12,
          }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.5px", opacity: 0.8 }}>
              {owed > 0 ? "OWES" : credit > 0 ? "IN CREDIT" : "BALANCE"}
            </div>
            <div style={{
              fontSize: 24, fontWeight: 500, fontFamily: "var(--d2-mono)", fontVariantNumeric: "tabular-nums",
              marginTop: 2, lineHeight: 1.1,
            }}>
              {gbp(Math.abs(balance))}
            </div>
            <div style={{ fontSize: 10, opacity: 0.75, marginTop: 2 }}>
              {pupilMeta?.balance_due_date && owed > 0
                ? `Due ${new Date(pupilMeta.balance_due_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
                : `${rows.length} transactions on file`}
            </div>
          </div>

          {/* Quick totals */}
          <div className="grid grid-cols-2" style={{ gap: 8 }}>
            <div style={{ background: "#F8FAFC", borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 9, color: "var(--d2-text-3)", fontWeight: 600, letterSpacing: "0.4px" }}>RECEIVED</div>
              <div style={{ fontSize: 14, fontWeight: 500, fontFamily: "var(--d2-mono)", color: "#047857", marginTop: 2 }}>
                {gbp(totalIn)}
              </div>
            </div>
            <div style={{ background: "#F8FAFC", borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 9, color: "var(--d2-text-3)", fontWeight: 600, letterSpacing: "0.4px" }}>CHARGED</div>
              <div style={{ fontSize: 14, fontWeight: 500, fontFamily: "var(--d2-mono)", color: "var(--d2-text-1)", marginTop: 2 }}>
                {gbp(totalOut)}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center" style={{ gap: 6 }}>
            <button onClick={onTakePayment} style={{ ...primaryBtn, flex: 1, justifyContent: "center" }}>
              <Plus size={12} /> Take payment
            </button>
            <button
              onClick={() => toast.success("Reminder sent")}
              style={{ ...outlineBtn, flex: 1, justifyContent: "center" }}
            >
              Send reminder
            </button>
          </div>

          {/* Ledger */}
          <div>
            <div style={{ fontSize: 10, color: "var(--d2-text-3)", fontWeight: 500, letterSpacing: "0.4px", textTransform: "uppercase", marginBottom: 6 }}>
              Recent transactions
            </div>
            {loading ? (
              <div style={{ padding: "16px 0", fontSize: 11, color: "var(--d2-text-3)" }}>Loading…</div>
            ) : rows.length === 0 ? (
              <div style={{ padding: "16px 0", fontSize: 11, color: "var(--d2-text-3)" }}>No transactions yet.</div>
            ) : (
              <div className="flex flex-col">
                {rows.map((r, i) => {
                  const isCharge = r.amount < 0;
                  const d = new Date(r.recorded_at);
                  return (
                    <div key={r.id} className="flex items-center" style={{
                      gap: 8, padding: "8px 0",
                      borderBottom: i === rows.length - 1 ? "none" : "0.5px solid var(--d2-border)",
                    }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: 6,
                        background: isCharge ? "#FFF1F2" : "#ECFDF5",
                        color: isCharge ? "#BE123C" : "#047857",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 600,
                      }}>{isCharge ? "−" : "+"}</div>
                      <div className="flex-1 min-w-0">
                        <div style={{ fontSize: 11, fontWeight: 500, color: "var(--d2-text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {r.notes || r.payment_method || "Payment"}
                        </div>
                        <div style={{ fontSize: 9, color: "var(--d2-text-3)" }}>
                          {d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · {r.payment_method || "—"}
                        </div>
                      </div>
                      <div style={{
                        fontSize: 11, fontFamily: "var(--d2-mono)", fontVariantNumeric: "tabular-nums",
                        color: isCharge ? "#BE123C" : "#047857", fontWeight: 500,
                      }}>
                        {isCharge ? "-" : "+"}{gbp(Math.abs(Number(r.amount)))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {tab === "details" && (
        <div className="flex flex-col" style={{ gap: 8, fontSize: 12, color: "var(--d2-text-2)" }}>
          <div><span style={{ color: "var(--d2-text-3)" }}>Phone:</span> {pupilMeta?.phone || "—"}</div>
          <div><span style={{ color: "var(--d2-text-3)" }}>Email:</span> {pupilMeta?.email || "—"}</div>
          <div><span style={{ color: "var(--d2-text-3)" }}>Balance due:</span> {pupilMeta?.balance_due_date ? new Date(pupilMeta.balance_due_date).toLocaleDateString("en-GB") : "—"}</div>
        </div>
      )}
    </div>
  );
}
