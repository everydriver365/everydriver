import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PoundSterling, TrendingUp, AlertCircle, Users, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface PaymentSummaryWidgetProps {
  instructorId: string;
  instructorName?: string;
  compact?: boolean;
}

interface PaymentStats {
  totalThisMonth: number;
  totalOutstanding: number;
  pupilsWithBalance: number;
  paymentsCount: number;
}

export function PaymentSummaryWidget({ instructorId, instructorName, compact = false }: PaymentSummaryWidgetProps) {
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingReminders, setSendingReminders] = useState(false);

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

  const handleSendReminders = async () => {
    if (!instructorName) {
      toast.error("Instructor name not available");
      return;
    }

    setSendingReminders(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-payment-reminder", {
        body: {
          instructorId,
          instructorName
        }
      });

      if (error) throw error;

      if (data.sent > 0) {
        toast.success(`Sent ${data.sent} payment reminder${data.sent > 1 ? 's' : ''}`);
      }
      if (data.skipped > 0) {
        toast.info(`${data.skipped} pupil${data.skipped > 1 ? 's' : ''} skipped (no phone)`);
      }
      if (data.failed > 0) {
        toast.error(`${data.failed} reminder${data.failed > 1 ? 's' : ''} failed to send`);
      }
      if (data.sent === 0 && data.skipped === 0 && data.failed === 0) {
        toast.info("No pupils with outstanding balances");
      }
    } catch (error) {
      console.error("Error sending reminders:", error);
      toast.error("Failed to send payment reminders");
    } finally {
      setSendingReminders(false);
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
      <div className="space-y-4">
        <Skeleton className="h-5 w-32" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <PoundSterling className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Payment Summary</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-success/10 rounded-2xl p-3">
            <div className="text-lg font-bold text-success">
              {formatCurrency(stats?.totalThisMonth || 0)}
            </div>
            <div className="text-xs text-muted-foreground">This Month</div>
          </div>
          <div className={`rounded-2xl p-3 ${(stats?.totalOutstanding || 0) > 0 ? 'bg-destructive/10' : 'bg-muted'}`}>
            <div className={`text-lg font-bold ${(stats?.totalOutstanding || 0) > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
              {formatCurrency(stats?.totalOutstanding || 0)}
            </div>
            <div className="text-xs text-muted-foreground">Outstanding</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Monthly earnings & outstanding balances</span>
        {(stats?.pupilsWithBalance || 0) > 0 && instructorName && (
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleSendReminders}
            disabled={sendingReminders}
            className="gap-1.5"
          >
            {sendingReminders ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            Send Reminders
          </Button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-success/10 rounded-2xl p-4">
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
        
        <div className={`rounded-2xl p-4 ${(stats?.totalOutstanding || 0) > 0 ? 'bg-destructive/10' : 'bg-muted/50'}`}>
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
    </div>
  );
}
