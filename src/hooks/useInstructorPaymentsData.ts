import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PaymentMethod = "card" | "cash" | "bank";
export type PaymentStatus = "paid" | "pending" | "refunded" | "failed";

export interface PaymentTx {
  id: string;
  dateTime: string;
  pupilId: string;
  pupilName: string;
  method: PaymentMethod;
  forText: string;
  note: string | null;
  amount: number;
  status: PaymentStatus;
}

export interface OutstandingPupil {
  id: string;
  name: string;
  amount: number;
  daysOverdue?: number;
  daysUntilDue?: number;
}

export interface CashFlowBucket {
  week: string;
  amount: number;
  type: "actual" | "current" | "forecast";
}

export interface PaymentsStats {
  receivedMonth: number;
  receivedCount: number;
  outstanding: number;
  outstandingPupils: number;
  nextPayout: number;
  nextPayoutDate: string;
  feesMonth: number;
  effectiveFeeRate: number;
  feesYearToDate: number;
  feesYearLabel: string;
  platformFeesMonth: number;
  platformBookingFeesMonth: number;
  platformTransactionFeesMonth: number;
  platformUpliftFeesMonth: number;
  platformFeesYearToDate: number;
}

export interface PaymentsData {
  loading: boolean;
  error: string | null;
  stats: PaymentsStats;
  cashFlow: CashFlowBucket[];
  outstanding: OutstandingPupil[];
  transactions: PaymentTx[];
  refresh: () => void;
}

const FEE_RATE = 0.0175;

function normalizeMethod(m: string | null): PaymentMethod {
  const v = (m || "").toLowerCase();
  if (v.includes("cash")) return "cash";
  if (v.includes("bank") || v.includes("gocardless") || v.includes("transfer")) return "bank";
  return "card";
}

function normalizeStatus(amount: number, notes: string | null, payoutStatus?: string | null): PaymentStatus {
  const n = (notes || "").toLowerCase();
  const ps = (payoutStatus || "").toLowerCase();
  if (ps === "refunded" || ps === "partially_refunded") return "refunded";
  if (amount < 0 || n.includes("refund")) return "refunded";
  if (n.includes("failed") || n.includes("declined")) return "failed";
  if (ps === "pending" || n.includes("pending") || n.includes("awaiting payment")) return "pending";
  return "paid";
}

function shortFor(notes: string | null, method: PaymentMethod, amount: number): string {
  if (notes && notes.trim().length > 0) {
    return notes.length > 40 ? notes.slice(0, 40) + "…" : notes;
  }
  if (amount < 0) return "Refund";
  if (amount >= 200) return "Lesson block";
  return method === "cash" ? "Cash payment" : "Lesson payment";
}

function isoWeekLabel(d: Date) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((+date - +yearStart) / 86400000) + 1) / 7);
  return `W${week}`;
}

function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Mon=0
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - day);
  return x;
}

function buildCashFlow(rows: { recorded_at: string; amount: number }[]): CashFlowBucket[] {
  const now = new Date();
  const thisWeekStart = startOfWeek(now);
  // 8 actual past weeks (excluding current), 1 current, 3 forecast = 12
  const buckets: CashFlowBucket[] = [];
  const totalsByWeek = new Map<string, number>();
  rows.forEach(r => {
    const d = new Date(r.recorded_at);
    const ws = startOfWeek(d).getTime();
    totalsByWeek.set(String(ws), (totalsByWeek.get(String(ws)) || 0) + Number(r.amount || 0));
  });

  for (let i = 8; i >= 1; i--) {
    const ws = new Date(thisWeekStart);
    ws.setDate(ws.getDate() - i * 7);
    buckets.push({
      week: isoWeekLabel(ws),
      amount: Math.max(0, totalsByWeek.get(String(ws.getTime())) || 0),
      type: "actual",
    });
  }
  buckets.push({
    week: isoWeekLabel(thisWeekStart),
    amount: Math.max(0, totalsByWeek.get(String(thisWeekStart.getTime())) || 0),
    type: "current",
  });
  // forecast = avg of last 4 actual
  const recent = buckets.slice(-5, -1).map(b => b.amount);
  const avg = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : 0;
  for (let i = 1; i <= 3; i++) {
    const ws = new Date(thisWeekStart);
    ws.setDate(ws.getDate() + i * 7);
    buckets.push({
      week: isoWeekLabel(ws),
      amount: Math.round(avg),
      type: "forecast",
    });
  }
  return buckets;
}

export function useInstructorPaymentsData(instructorId: string | undefined): PaymentsData {
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);
  const [state, setState] = useState<Omit<PaymentsData, "refresh">>({
    loading: true,
    error: null,
    stats: {
      receivedMonth: 0, receivedCount: 0,
      outstanding: 0, outstandingPupils: 0,
      nextPayout: 0, nextPayoutDate: "—",
      feesMonth: 0, effectiveFeeRate: FEE_RATE * 100,
      feesYearToDate: 0, feesYearLabel: "",
      platformFeesMonth: 0, platformBookingFeesMonth: 0,
      platformTransactionFeesMonth: 0, platformUpliftFeesMonth: 0,
      platformFeesYearToDate: 0,
    },
    cashFlow: [],
    outstanding: [],
    transactions: [],
  });

  useEffect(() => {
    if (!instructorId) return;
    let cancelled = false;

    (async () => {
      try {
        // 14 weeks back of payments
        const since = new Date();
        since.setDate(since.getDate() - 14 * 7);

        const monthStartIso = (() => { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d.toISOString(); })();
        const [paymentsRes, pupilsRes, platformFeesMonthRes] = await Promise.all([
          supabase
            .from("payment_history")
            .select("id, amount, payment_method, notes, recorded_at, pupil_id, payout_status, transferred_at, pupils(name)")
            .eq("instructor_id", instructorId)
            .is("deleted_at", null)
            .gte("recorded_at", since.toISOString())
            .order("recorded_at", { ascending: false })
            .limit(500),
          supabase
            .from("pupils")
            .select("id, name, account_balance, balance_due_date")
            .eq("instructor_id", instructorId)
            .is("deleted_at", null)
            .lt("account_balance", 0)
            .order("account_balance", { ascending: true })
            .limit(50),
          supabase
            .from("platform_fees")
            .select("amount, kind, payment_method, created_at")
            .eq("instructor_id", instructorId)
            .gte("created_at", monthStartIso),
        ]);

        if (paymentsRes.error) throw paymentsRes.error;
        if (pupilsRes.error) throw pupilsRes.error;

        const rawPayments = paymentsRes.data || [];
        const transactions: PaymentTx[] = rawPayments.map((p: any) => {
          const amount = Number(p.amount || 0);
          const method = normalizeMethod(p.payment_method);
          return {
            id: p.id,
            dateTime: p.recorded_at,
            pupilId: p.pupil_id,
            pupilName: p.pupils?.name || "Unknown",
            method,
            forText: shortFor(p.notes, method, amount),
            note: p.notes ?? null,
            amount,
            status: normalizeStatus(amount, p.notes, p.payout_status),
          };
        });

        // Stats: this month
        const monthStart = new Date();
        monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
        // Net received this month = paid + refunded (refunds are negative)
        const monthTx = transactions.filter(t =>
          new Date(t.dateTime) >= monthStart &&
          (t.status === "paid" || t.status === "refunded")
        );
        const receivedMonth = monthTx.reduce((s, t) => s + t.amount, 0);
        const cardMonth = monthTx.filter(t => t.method === "card").reduce((s, t) => s + t.amount, 0);
        const platformFeesRows = (platformFeesMonthRes.data || []) as any[];
        const platformFeesMonthTotal = platformFeesRows
          .reduce((s: number, r: any) => s + Number(r.amount || 0), 0);
        const platformBookingFeesMonth = platformFeesRows
          .filter((r) => (r.kind || "") === "booking_fee")
          .reduce((s, r) => s + Number(r.amount || 0), 0);
        const platformTransactionFeesMonth = platformFeesRows
          .filter((r) => (r.kind || "") === "transaction_fee")
          .reduce((s, r) => s + Number(r.amount || 0), 0);
        const platformUpliftFeesMonth = platformFeesRows
          .filter((r) => /uplift/i.test(r.kind || ""))
          .reduce((s, r) => s + Number(r.amount || 0), 0);
        const feesMonth = +((Math.max(0, cardMonth) * FEE_RATE) + platformFeesMonthTotal).toFixed(2);
        const effectiveFeeRate = receivedMonth > 0 ? +((feesMonth / receivedMonth) * 100).toFixed(2) : 0;

        // Pending payout = card payments captured but NOT yet transferred (excl. refunded)
        const pendingPayout = rawPayments
          .filter((p: any) => {
            const m = normalizeMethod(p.payment_method);
            const ps = (p.payout_status || "").toLowerCase();
            return m === "card" && ps === "pending" && Number(p.amount || 0) > 0;
          })
          .reduce((s: number, p: any) => s + Number(p.amount || 0), 0);

        // Most recent transferred payment to estimate next payout date
        const lastTransferred = rawPayments.find((p: any) => p.transferred_at);
        const nextPayoutDate = pendingPayout > 0
          ? (lastTransferred?.transferred_at
              ? new Date(new Date(lastTransferred.transferred_at).getTime() + 24 * 60 * 60 * 1000)
                  .toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
              : "Tomorrow")
          : "—";

        const outstanding: OutstandingPupil[] = (pupilsRes.data || []).map((p: any) => {
          const amt = Math.abs(Number(p.account_balance || 0));
          const dueDate = p.balance_due_date ? new Date(p.balance_due_date) : null;
          const today = new Date(); today.setHours(0, 0, 0, 0);
          let info: Partial<OutstandingPupil> = {};
          if (dueDate) {
            const days = Math.round((+dueDate - +today) / 86400000);
            if (days < 0) info.daysOverdue = -days;
            else info.daysUntilDue = days;
          } else {
            info.daysOverdue = 0;
          }
          return { id: p.id, name: p.name, amount: amt, ...info };
        });

        const outstandingTotal = outstanding.reduce((s, o) => s + o.amount, 0);

        const cashFlow = buildCashFlow(
          rawPayments
            .filter((p: any) => {
              const status = normalizeStatus(Number(p.amount), p.notes, p.payout_status);
              return Number(p.amount) > 0 && status === "paid";
            })
            .map((p: any) => ({ recorded_at: p.recorded_at, amount: Number(p.amount) }))
        );

        // YTD service fees (UK tax year: 6 Apr → 5 Apr). Card payments × 1.75%.
        const now = new Date();
        const taxYearStartYear = (now.getMonth() < 3 || (now.getMonth() === 3 && now.getDate() < 6))
          ? now.getFullYear() - 1 : now.getFullYear();
        const taxYearStart = new Date(taxYearStartYear, 3, 6, 0, 0, 0, 0);
        const feesYearLabel = `${taxYearStartYear}/${String((taxYearStartYear + 1) % 100).padStart(2, "0")}`;

        const [ytdRes, ytdPlatformFeesRes] = await Promise.all([
          supabase
            .from("payment_history")
            .select("amount, payment_method, notes, payout_status, recorded_at")
            .eq("instructor_id", instructorId)
            .is("deleted_at", null)
            .gte("recorded_at", taxYearStart.toISOString())
            .gt("amount", 0),
          supabase
            .from("platform_fees")
            .select("amount")
            .eq("instructor_id", instructorId)
            .gte("created_at", taxYearStart.toISOString()),
        ]);

        let feesYearToDate = 0;
        if (!ytdRes.error && ytdRes.data) {
          const cardYtd = ytdRes.data
            .filter((p: any) => normalizeMethod(p.payment_method) === "card"
              && normalizeStatus(Number(p.amount), p.notes, p.payout_status) === "paid")
            .reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
        const platformYtd = (ytdPlatformFeesRes.data || [])
          .reduce((s: number, r: any) => s + Number(r.amount || 0), 0);
        let feesYearToDate = 0;
        if (!ytdRes.error && ytdRes.data) {
          const cardYtd = ytdRes.data
            .filter((p: any) => normalizeMethod(p.payment_method) === "card"
              && normalizeStatus(Number(p.amount), p.notes, p.payout_status) === "paid")
            .reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
          feesYearToDate = +((cardYtd * FEE_RATE) + platformYtd).toFixed(2);
        }

        if (cancelled) return;
        setState({
          loading: false,
          error: null,
          stats: {
            receivedMonth,
            receivedCount: monthTx.length,
            outstanding: outstandingTotal,
            outstandingPupils: outstanding.length,
            nextPayout: +pendingPayout.toFixed(2),
            nextPayoutDate,
            feesMonth,
            effectiveFeeRate,
            feesYearToDate,
            feesYearLabel,
            platformFeesMonth: +platformFeesMonthTotal.toFixed(2),
            platformBookingFeesMonth: +platformBookingFeesMonth.toFixed(2),
            platformTransactionFeesMonth: +platformTransactionFeesMonth.toFixed(2),
            platformUpliftFeesMonth: +platformUpliftFeesMonth.toFixed(2),
            platformFeesYearToDate: +platformYtd.toFixed(2),
          },
          cashFlow,
          outstanding,
          transactions,
        });
      } catch (e: any) {
        if (cancelled) return;
        setState(s => ({ ...s, loading: false, error: e?.message || "Failed to load payments" }));
      }
    })();

    return () => { cancelled = true; };
  }, [instructorId, tick]);

  return { ...state, refresh };
}
