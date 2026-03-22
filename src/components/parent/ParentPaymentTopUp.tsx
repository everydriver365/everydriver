import { useState } from "react";
import { CreditCard, Loader2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useAdminFee } from "@/hooks/useAdminFee";
import { AdminFeeBreakdown } from "@/components/payments/AdminFeeBreakdown";

interface ParentPaymentTopUpProps {
  childId: string;
  childName: string;
  instructorId: string;
  currentBalance: number;
}

const AMOUNTS = [25, 50, 100, 150];

export function ParentPaymentTopUp({ childId, childName, instructorId, currentBalance }: ParentPaymentTopUpProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch commission split setting for this instructor
  const { data: splitPercent } = useQuery({
    queryKey: ["instructor-commission-split", instructorId],
    queryFn: async () => {
      const { data } = await supabase
        .from("instructors")
        .select("commission_split_percent")
        .eq("id", instructorId)
        .single();
      return (data as any)?.commission_split_percent ?? 100;
    },
    staleTime: 5 * 60 * 1000,
  });

  const baseAmount = selectedAmount || 0;
  const { adminFee, totalCharge, hasFee, instructorAbsorbs, fullFee } = useAdminFee(baseAmount, splitPercent);

  const handlePayment = async () => {
    if (!selectedAmount) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("pupil-payment-checkout", {
        body: {
          pupilId: childId,
          instructorId,
          amount: selectedAmount,
          adminFee: hasFee ? adminFee : 0,
          paymentMethod: "square",
          returnUrl: `${window.location.origin}/parent?payment=success&amount=${selectedAmount}`,
          cancelUrl: `${window.location.origin}/parent?payment=cancelled`,
        },
      });

      if (error) throw error;
      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else if (data?.error) {
        toast.error(data.error);
      } else {
        toast.error("Payment setup failed");
      }
    } catch (err) {
      console.error("Payment error:", err);
      toast.error("Unable to process payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Wallet className="h-4 w-4 text-primary" />
          Top Up {childName}'s Account
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Current Balance</span>
          <span className={`font-bold ${currentBalance >= 0 ? "text-emerald-600" : "text-destructive"}`}>
            {currentBalance >= 0 ? "+" : "-"}£{Math.abs(currentBalance).toFixed(2)}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {AMOUNTS.map((amount) => (
            <button
              key={amount}
              onClick={() => setSelectedAmount(amount)}
              className={`p-2.5 rounded-xl border text-sm font-semibold transition-all ${
                selectedAmount === amount
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-secondary/30 text-foreground hover:border-primary/50"
              }`}
            >
              £{amount}
            </button>
          ))}
        </div>

        {/* Admin fee breakdown */}
        <AdminFeeBreakdown
          baseAmount={baseAmount}
          adminFee={adminFee}
          totalCharge={totalCharge}
          hasFee={hasFee}
        />

        <Button
          className="w-full"
          disabled={!selectedAmount || loading}
          onClick={handlePayment}
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</>
          ) : (
            <><CreditCard className="h-4 w-4 mr-2" />Pay £{selectedAmount ? totalCharge.toFixed(2) : "0"}</>
          )}
        </Button>
        <p className="text-[10px] text-muted-foreground text-center">
          Payment goes directly to {childName}'s lesson account
        </p>
      </CardContent>
    </Card>
  );
}
