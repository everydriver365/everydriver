import { useState, useEffect } from "react";
import { format, startOfMonth } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, Clock, PoundSterling, Loader2, ArrowDownRight, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Payout {
  id: string;
  amount: number;
  notes: string | null;
  transferred_at: string;
  payment_ids: string[];
}

interface InstructorPayoutHistoryProps {
  instructorId: string;
}

export function InstructorPayoutHistory({ instructorId }: InstructorPayoutHistoryProps) {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [monthlyTotal, setMonthlyTotal] = useState(0);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel(`instructor-payouts-${instructorId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "instructor_payouts" }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "payment_history" }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [instructorId]);

  const fetchData = async () => {
    const [payoutsRes, pendingRes] = await Promise.all([
      supabase
        .from("instructor_payouts")
        .select("id, amount, notes, transferred_at, payment_ids")
        .eq("instructor_id", instructorId)
        .order("transferred_at", { ascending: false })
        .limit(10),
      supabase
        .from("payment_history")
        .select("amount")
        .eq("instructor_id", instructorId)
        .eq("payout_status", "pending")
        .is("deleted_at", null),
    ]);

    setPayouts(payoutsRes.data || []);
    setPendingTotal((pendingRes.data || []).reduce((s, p) => s + Number(p.amount), 0));

    const monthStart = startOfMonth(new Date()).toISOString();
    const monthPayouts = (payoutsRes.data || []).filter(p => p.transferred_at >= monthStart);
    setMonthlyTotal(monthPayouts.reduce((s, p) => s + Number(p.amount), 0));
    setLoading(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ArrowDownRight className="h-4 w-4 text-emerald-500" />
          Payouts from Admin
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">This Month</p>
            <p className="text-lg font-bold text-emerald-600">£{monthlyTotal.toFixed(2)}</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Awaiting Transfer</p>
            <p className="text-lg font-bold text-amber-600">£{pendingTotal.toFixed(2)}</p>
          </div>
        </div>

        {/* Payout list */}
        {payouts.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <PoundSterling className="h-6 w-6 mx-auto mb-2 opacity-50" />
            <p className="text-xs">No payouts received yet</p>
          </div>
        ) : (
          <ScrollArea className="h-[200px]">
            <div className="space-y-2 pr-2">
              {payouts.map(payout => (
                <div key={payout.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-emerald-700 dark:text-emerald-300">
                        £{Number(payout.amount).toFixed(2)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {format(new Date(payout.transferred_at), "d MMM yyyy")} • {payout.payment_ids.length} payment(s)
                      </div>
                    </div>
                  </div>
                  {payout.notes?.includes("Auto-paid via Square") ? (
                    <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-600 text-[10px]">
                      <Zap className="h-2.5 w-2.5 mr-0.5" />
                      Direct
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 text-[10px]">
                      Paid
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
