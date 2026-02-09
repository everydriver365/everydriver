import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";

interface ParentPaymentHistoryProps {
  childId: string;
}

interface Payment {
  id: string;
  amount: number;
  recorded_at: string;
  payment_method: string | null;
  notes: string | null;
}

export function ParentPaymentHistory({ childId }: ParentPaymentHistoryProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, [childId]);

  const fetchPayments = async () => {
    const { data } = await supabase
      .from("payment_history")
      .select("id, amount, recorded_at, payment_method, notes")
      .eq("pupil_id", childId)
      .order("recorded_at", { ascending: false })
      .limit(10);
    setPayments(data || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4 text-sm">
            No payments recorded yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-primary" />
          Recent Payments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {payments.map(p => (
          <div 
            key={p.id} 
            className="flex items-center justify-between p-3 rounded-lg border"
          >
            <div>
              <div className="text-sm font-medium">
                {format(parseISO(p.recorded_at), "d MMM yyyy")}
              </div>
              {p.payment_method && (
                <Badge variant="outline" className="text-[10px] mt-1">
                  {p.payment_method}
                </Badge>
              )}
            </div>
            <div className="text-right">
              <div className={`font-bold ${p.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {p.amount >= 0 ? '+' : ''}£{Math.abs(p.amount).toFixed(2)}
              </div>
              {p.notes && (
                <div className="text-[10px] text-muted-foreground max-w-[120px] truncate">
                  {p.notes}
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
