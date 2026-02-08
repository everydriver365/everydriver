import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CreditCard, ChevronRight, PoundSterling } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface RecentPayment {
  id: string;
  amount: number;
  payment_method: string | null;
  created_at: string;
  instructor: { name: string } | null;
  pupil: { name: string } | null;
}

interface RecentPaymentsWidgetProps {
  onViewAll?: () => void;
}

export function RecentPaymentsWidget({ onViewAll }: RecentPaymentsWidgetProps) {
  const [payments, setPayments] = useState<RecentPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayTotal, setTodayTotal] = useState(0);

  useEffect(() => {
    fetchRecentPayments();
  }, []);

  const fetchRecentPayments = async () => {
    try {
      const { data, error } = await supabase
        .from("payment_history")
        .select(`
          id, amount, payment_method, created_at,
          instructor:instructors(name),
          pupil:pupils(name)
        `)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setPayments(data || []);

      // Calculate today's total
      const today = new Date().toISOString().split("T")[0];
      const todayPayments = (data || []).filter(
        (p) => p.created_at.startsWith(today)
      );
      setTodayTotal(todayPayments.reduce((sum, p) => sum + (p.amount || 0), 0));
    } catch (error) {
      console.error("Error fetching recent payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(amount);

  const getMethodLabel = (method: string | null) => {
    const map: Record<string, string> = {
      cash: "Cash",
      card: "Card",
      bank_transfer: "Transfer",
      online: "Online",
      apple_pay: "Apple Pay",
      google_pay: "Google Pay",
    };
    return map[method || ""] || method || "Unknown";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <CreditCard className="h-4 w-4" />
          Recent Payments
        </CardTitle>
        {onViewAll && (
          <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={onViewAll}>
            View All <ChevronRight className="h-3 w-3" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {todayTotal > 0 && (
          <div className="flex items-center gap-2 mb-3 p-2 bg-primary/5 border border-primary/10 rounded-md">
            <PoundSterling className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">Today:</span>
            <span className="text-sm font-semibold text-foreground">{formatCurrency(todayTotal)}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : payments.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No payments recorded yet</p>
        ) : (
          <div className="space-y-2">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {payment.pupil?.name || "Unknown"}{" "}
                    <span className="text-muted-foreground font-normal">→</span>{" "}
                    {payment.instructor?.name || "Unknown"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {format(new Date(payment.created_at), "dd MMM, HH:mm")} ·{" "}
                    {getMethodLabel(payment.payment_method)}
                  </p>
                </div>
                <span className="text-sm font-semibold text-foreground shrink-0 ml-2">
                  {formatCurrency(payment.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
