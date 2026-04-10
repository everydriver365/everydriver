import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  CreditCard, 
  Banknote, 
  Smartphone, 
  ChevronRight,
  TrendingUp
} from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface Payment {
  id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  notes: string | null;
  pupil: {
    name: string;
  } | null;
}

interface RecentPaymentsCardProps {
  instructorId: string;
  limit?: number;
}

export function RecentPaymentsCard({ instructorId, limit = 5 }: RecentPaymentsCardProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, [instructorId]);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from("payment_history")
        .select(`
          id,
          amount,
          payment_method,
          recorded_at,
          notes,
          pupils(name)
        `)
        .eq("instructor_id", instructorId)
        .order("recorded_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      // Transform data to match our interface
      const transformedPayments: Payment[] = (data || []).map((p: any) => ({
        id: p.id,
        amount: p.amount,
        payment_method: p.payment_method,
        payment_date: p.recorded_at,
        notes: p.notes,
        pupil: p.pupils ? { name: p.pupils.name } : null,
      }));
      
      setPayments(transformedPayments);
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentIcon = (method: string) => {
    switch (method?.toLowerCase()) {
      case "card":
        return <CreditCard className="h-4 w-4" />;
      case "bank_transfer":
      case "bacs":
        return <Smartphone className="h-4 w-4" />;
      default:
        return <Banknote className="h-4 w-4" />;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method?.toLowerCase()) {
      case "card":
        return "Card";
      case "bank_transfer":
      case "bacs":
        return "Bank";
      case "cash":
        return "Cash";
      default:
        return method || "Other";
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse flex items-center gap-3 p-3">
            <div className="h-10 w-10 bg-muted rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
            <div className="h-5 w-16 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-8">
        <TrendingUp className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No payments recorded yet</p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Payments will appear here when received
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {payments.map((payment, index) => (
        <motion.div
          key={payment.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className={cn(
            "flex items-center gap-3 p-3 rounded-none",
            "bg-card/50 hover:bg-card/80 transition-colors",
            "border border-border/50"
          )}
        >
          {/* Icon */}
          <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            {getPaymentIcon(payment.payment_method)}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">
              {payment.pupil?.name || "Unknown"}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground">
                {getPaymentMethodLabel(payment.payment_method)}
              </span>
              <span className="text-muted-foreground/50">•</span>
              <span className="text-xs text-muted-foreground">
                {format(new Date(payment.payment_date), "d MMM")}
              </span>
            </div>
          </div>

          {/* Amount */}
          <p className="font-semibold text-emerald-600 dark:text-emerald-400">
            +£{payment.amount.toFixed(2)}
          </p>
        </motion.div>
      ))}

      <Link
        to="/instructor/pay?tab=history"
        className="flex items-center justify-center gap-1 text-sm text-primary font-medium py-2 hover:underline"
      >
        View all payments
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
