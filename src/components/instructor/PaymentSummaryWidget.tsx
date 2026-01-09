import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PoundSterling, TrendingUp, AlertCircle, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface PaymentSummaryWidgetProps {
  instructorId: string;
  compact?: boolean;
}

interface PaymentStats {
  totalThisMonth: number;
  totalOutstanding: number;
  pupilsWithBalance: number;
  paymentsCount: number;
}

export function PaymentSummaryWidget({ instructorId, compact = false }: PaymentSummaryWidgetProps) {
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaymentStats();
  }, [instructorId]);

  const fetchPaymentStats = async () => {
    try {
      // Get start of current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // Fetch payments this month
      const { data: payments, error: paymentsError } = await supabase
        .from("payment_history")
        .select("amount")
        .eq("instructor_id", instructorId)
        .gte("recorded_at", startOfMonth);

      if (paymentsError) throw paymentsError;

      // Fetch pupils with outstanding balances (negative balance = they owe money)
      const { data: pupils, error: pupilsError } = await supabase
        .from("pupils")
        .select("account_balance")
        .eq("instructor_id", instructorId);

      if (pupilsError) throw pupilsError;

      const totalThisMonth = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const paymentsCount = payments?.length || 0;
      
      // Outstanding = sum of negative balances (pupils who owe money)
      const totalOutstanding = pupils?.reduce((sum, p) => {
        const balance = Number(p.account_balance) || 0;
        return balance < 0 ? sum + Math.abs(balance) : sum;
      }, 0) || 0;

      const pupilsWithBalance = pupils?.filter(p => (Number(p.account_balance) || 0) < 0).length || 0;

      setStats({
        totalThisMonth,
        totalOutstanding,
        pupilsWithBalance,
        paymentsCount
      });
    } catch (error) {
      console.error("Error fetching payment stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <PoundSterling className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Payment Summary</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-success/10 rounded-lg p-3">
              <div className="text-lg font-bold text-success">
                {formatCurrency(stats?.totalThisMonth || 0)}
              </div>
              <div className="text-xs text-muted-foreground">This Month</div>
            </div>
            <div className={`rounded-lg p-3 ${(stats?.totalOutstanding || 0) > 0 ? 'bg-destructive/10' : 'bg-muted'}`}>
              <div className={`text-lg font-bold ${(stats?.totalOutstanding || 0) > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {formatCurrency(stats?.totalOutstanding || 0)}
              </div>
              <div className="text-xs text-muted-foreground">Outstanding</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PoundSterling className="h-5 w-5 text-accent" />
          Payment Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-success/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-success" />
              <span className="text-sm text-muted-foreground">This Month</span>
            </div>
            <div className="text-2xl font-bold text-success">
              {formatCurrency(stats?.totalThisMonth || 0)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats?.paymentsCount || 0} payment{stats?.paymentsCount !== 1 ? 's' : ''} received
            </div>
          </div>
          
          <div className={`rounded-xl p-4 ${(stats?.totalOutstanding || 0) > 0 ? 'bg-destructive/10' : 'bg-muted/50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className={`h-4 w-4 ${(stats?.totalOutstanding || 0) > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
              <span className="text-sm text-muted-foreground">Outstanding</span>
            </div>
            <div className={`text-2xl font-bold ${(stats?.totalOutstanding || 0) > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
              {formatCurrency(stats?.totalOutstanding || 0)}
            </div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Users className="h-3 w-3" />
              {stats?.pupilsWithBalance || 0} pupil{stats?.pupilsWithBalance !== 1 ? 's' : ''} owe money
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
