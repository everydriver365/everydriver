import { useState, useEffect } from "react";
import { Clock, Gift, CreditCard, Loader2, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface UpsellPurchase {
  id: string;
  amount_paid: number;
  status: string | null;
  upsell_name: string;
}

interface PupilCreditBreakdownProps {
  pupilId: string;
  prepaidHours: number;
  depositPaid: number;
  paymentType: string | null;
}

export function PupilCreditBreakdown({
  pupilId,
  prepaidHours,
  depositPaid,
  paymentType,
}: PupilCreditBreakdownProps) {
  const [upsells, setUpsells] = useState<UpsellPurchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUpsells();
  }, [pupilId]);

  const fetchUpsells = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("pupil_upsells")
        .select(`
          id,
          amount_paid,
          status,
          booking_upsells (
            name
          )
        `)
        .eq("pupil_id", pupilId);

      if (error) throw error;
      
      const formatted = (data || []).map((u: any) => ({
        id: u.id,
        amount_paid: u.amount_paid,
        status: u.status,
        upsell_name: u.booking_upsells?.name || "Add-on",
      }));
      
      setUpsells(formatted);
    } catch (error) {
      console.error("Error fetching upsells:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalUpsellValue = upsells.reduce((sum, u) => sum + Number(u.amount_paid), 0);
  const hasCredits = prepaidHours > 0 || depositPaid > 0 || upsells.length > 0;

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 rounded-2xl p-3">
        <div className="flex items-center justify-center py-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!hasCredits) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 rounded-2xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Credits & Purchases</span>
        </div>
      </div>

      <div className="space-y-1.5">
        {/* Prepaid Hours */}
        {prepaidHours > 0 && (
          <div className="flex items-center justify-between bg-background/60 rounded-2xl px-2.5 py-2">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                <Clock className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-sm">Course Hours</span>
            </div>
            <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">
              {prepaidHours}h prepaid
            </Badge>
          </div>
        )}

        {/* Deposit */}
        {paymentType === "deposit" && depositPaid > 0 && (
          <div className="flex items-center justify-between bg-background/60 rounded-2xl px-2.5 py-2">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
                <CreditCard className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm">Deposit Paid</span>
            </div>
            <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">
              £{depositPaid}
            </Badge>
          </div>
        )}

        {/* Upsells */}
        {upsells.map((upsell) => (
          <div key={upsell.id} className="flex items-center justify-between bg-background/60 rounded-2xl px-2.5 py-2">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/50">
                <Package className="h-3 w-3 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-sm truncate max-w-[120px]">{upsell.upsell_name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge 
                variant="secondary" 
                className={`text-xs ${
                  upsell.status === "fulfilled" 
                    ? "bg-emerald-100 text-emerald-700 border-0" 
                    : upsell.status === "refunded"
                    ? "bg-muted text-muted-foreground"
                    : "bg-amber-100 text-amber-700 border-0"
                }`}
              >
                {upsell.status === "fulfilled" ? "Done" : 
                 upsell.status === "refunded" ? "Refunded" : "Pending"}
              </Badge>
              <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                £{Number(upsell.amount_paid).toFixed(0)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      {(totalUpsellValue > 0 || depositPaid > 0) && (
        <div className="flex items-center justify-end pt-1 border-t border-border/50">
          <span className="text-xs text-muted-foreground mr-2">Total paid:</span>
          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
            £{(depositPaid + totalUpsellValue).toFixed(0)}
          </span>
        </div>
      )}
    </div>
  );
}
