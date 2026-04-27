import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { History, PoundSterling, CreditCard, Banknote, Smartphone, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { PayoutStatusBadge } from "./PayoutStatusBadge";

interface PaymentRecord {
  id: string;
  amount: number;
  payment_method: string;
  notes: string | null;
  recorded_at: string;
  payout_status: string | null;
  lesson_id?: string | null;
  scheduled_lessons?: { lesson_date: string; start_time: string | null } | null;
}

interface PupilPaymentHistoryProps {
  pupilId: string;
  pupilName: string;
  limit?: number;
  refreshTrigger?: number;
}

const getPaymentMethodIcon = (method: string) => {
  switch (method?.toLowerCase()) {
    case "cash":
      return Banknote;
    case "card":
    case "apple_pay":
    case "google_pay":
      return CreditCard;
    case "bank_transfer":
    case "transfer":
      return Smartphone;
    default:
      return PoundSterling;
  }
};

const formatPaymentMethod = (method: string) => {
  switch (method?.toLowerCase()) {
    case "cash":
      return "Cash";
    case "card":
      return "Card";
    case "bank_transfer":
      return "Transfer";
    case "apple_pay":
      return "Apple Pay";
    case "google_pay":
      return "Google Pay";
    default:
      return method || "Payment";
  }
};

export function PupilPaymentHistory({
  pupilId,
  pupilName,
  limit = 5,
  refreshTrigger,
}: PupilPaymentHistoryProps) {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, [pupilId, refreshTrigger]);

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel(`payment-history-${pupilId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payment_history",
          filter: `pupil_id=eq.${pupilId}`,
        },
        () => {
          fetchPayments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pupilId]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("payment_history")
        .select(
          "id, amount, payment_method, notes, recorded_at, payout_status, lesson_id, scheduled_lessons:lesson_id(lesson_date, start_time)"
        )
        .eq("pupil_id", pupilId)
        .order("recorded_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error("Error fetching payment history:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-emerald-50/50 to-emerald-100/30 dark:from-emerald-950/20 dark:to-emerald-900/10 rounded-2xl p-3">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-emerald-50/50 to-emerald-100/30 dark:from-emerald-950/20 dark:to-emerald-900/10 rounded-2xl p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span className="font-medium text-sm">Payment History</span>
        </div>
        {payments.length > 0 && (
          <Badge variant="secondary" className="font-mono text-xs">
            £{totalAmount.toFixed(2)}
          </Badge>
        )}
      </div>

      {payments.length === 0 ? (
        <div className="text-center py-4">
          <PoundSterling className="h-6 w-6 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">No payments recorded yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {payments.map((payment) => {
            const MethodIcon = getPaymentMethodIcon(payment.payment_method);
            return (
              <div
                key={payment.id}
                className="flex items-center justify-between bg-background/60 rounded-2xl p-2.5"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                    <MethodIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-emerald-700 dark:text-emerald-300">
                      £{Number(payment.amount).toFixed(2)}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {format(new Date(payment.recorded_at), "d MMM, HH:mm")} • {formatPaymentMethod(payment.payment_method)}
                    </div>
                  </div>
                </div>
                {payment.notes && (
                  <span className="text-[10px] text-muted-foreground max-w-[80px] truncate">
                    {payment.notes}
                  </span>
                )}
                <PayoutStatusBadge status={payment.payout_status} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
