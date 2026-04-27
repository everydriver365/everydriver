import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Car, PoundSterling, ArrowDownCircle, ArrowUpCircle, RefreshCw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, isThisMonth, isThisYear } from "date-fns";

interface PupilPaymentFeedProps {
  pupilId: string;
  brandColour?: string | null;
  currentBalance?: number | null;
}

interface PaymentEntry {
  id: string;
  amount: number;
  recorded_at: string;
  payment_method: string | null;
  notes: string | null;
  lesson_id?: string | null;
  scheduled_lessons?: { lesson_date: string; start_time: string | null } | null;
}

function getPaymentIcon(method: string | null, amount: number) {
  if (amount > 0) return ArrowDownCircle; // payment received / top-up
  return Car; // lesson charge
}

function getPaymentColor(amount: number) {
  return amount > 0 ? "text-emerald-500" : "text-red-500";
}

function groupByMonth(entries: PaymentEntry[]) {
  const groups: Record<string, PaymentEntry[]> = {};
  entries.forEach((e) => {
    const date = parseISO(e.recorded_at);
    const key = format(date, "MMMM yyyy");
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  });
  return groups;
}

export function PupilPaymentFeed({ pupilId, brandColour, currentBalance }: PupilPaymentFeedProps) {
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, [pupilId]);

  const fetchPayments = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("payment_history")
      .select(
        "id, amount, recorded_at, payment_method, notes, lesson_id, scheduled_lessons:lesson_id(lesson_date, start_time)"
      )
      .eq("pupil_id", pupilId)
      .order("recorded_at", { ascending: false })
      .limit(100);
    setPayments(data || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const grouped = groupByMonth(payments);

  // Calculate running balance
  let runningBalance = currentBalance || 0;

  return (
    <div className="space-y-1">
      {/* Balance header */}
      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground mb-1">Current Balance</p>
        <p className={`text-3xl font-bold ${(currentBalance || 0) < 0 ? "text-destructive" : "text-foreground"}`}>
          {(currentBalance || 0) < 0 ? "-" : ""}£{Math.abs(currentBalance || 0).toFixed(2)}
        </p>
      </div>

      {payments.length === 0 ? (
        <div className="text-center py-8">
          <PoundSterling className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No payment history yet</p>
        </div>
      ) : (
        Object.entries(grouped).map(([month, entries]) => (
          <div key={month}>
            {/* Sticky month header */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm px-4 py-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{month}</p>
            </div>

            <div className="divide-y divide-border/50">
              {entries.map((entry, i) => {
                const Icon = getPaymentIcon(entry.payment_method, entry.amount);
                const colorClass = getPaymentColor(entry.amount);
                const date = parseISO(entry.recorded_at);

                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    {/* Icon */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: entry.amount > 0
                          ? "hsl(142 71% 45% / 0.12)"
                          : "hsl(0 0% 50% / 0.08)",
                      }}
                    >
                      <Icon className={`h-5 w-5 ${colorClass}`} />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {entry.notes || (entry.amount > 0 ? "Payment Received" : "Lesson Charge")}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {format(date, "d MMM, HH:mm")}
                        {entry.payment_method && ` · ${entry.payment_method}`}
                      </p>
                    </div>

                    {/* Amount */}
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-bold ${colorClass}`}>
                        {entry.amount > 0 ? "+" : ""}£{Math.abs(entry.amount).toFixed(2)}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
