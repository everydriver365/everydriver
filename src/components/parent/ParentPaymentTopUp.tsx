import { useState } from "react";
import { CreditCard, Loader2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

  const handlePayment = async () => {
    if (!selectedAmount) return;
    setLoading(true);
    try {
      // Use the existing pupil payment checkout edge function
      const { data, error } = await supabase.functions.invoke("pupil-payment-checkout", {
        body: {
          pupilId: childId,
          instructorId,
          amount: selectedAmount,
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

        <Button
          className="w-full"
          disabled={!selectedAmount || loading}
          onClick={handlePayment}
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</>
          ) : (
            <><CreditCard className="h-4 w-4 mr-2" />Pay £{selectedAmount || "0"}</>
          )}
        </Button>
        <p className="text-[10px] text-muted-foreground text-center">
          Payment goes directly to {childName}'s lesson account
        </p>
      </CardContent>
    </Card>
  );
}
