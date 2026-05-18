import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CreditCard, Loader2, Shield } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { SquareWalletButtons } from "@/components/payments/SquareWalletButtons";
import { PupilPaymentDrawer } from "./PupilPaymentDrawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAdminFee } from "@/hooks/useAdminFee";
import { useInstructorTierConfig } from "@/hooks/useInstructorTierConfig";
import { AdminFeeBreakdown } from "@/components/payments/AdminFeeBreakdown";

interface PupilPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pupilId: string;
  pupilName: string;
  pupilEmail: string | null;
  pupilPhone: string | null;
  instructorId: string;
  instructorSlug: string;
  accountBalance: number;
  brandColour: string | null;
  commissionPayer?: string | null;
}

type PaymentGateway = "npi" | "clearpay" | "klarna" | "elavon";

export function PupilPaymentModal({
  open,
  onOpenChange,
  pupilId,
  pupilName,
  pupilEmail,
  pupilPhone,
  instructorId,
  instructorSlug,
  accountBalance,
  brandColour,
  commissionPayer,
}: PupilPaymentModalProps) {
  const [amount, setAmount] = useState<string>(Math.abs(accountBalance).toFixed(2));
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(null);
  const [processing, setProcessing] = useState(false);
  const [feeEnabled, setFeeEnabled] = useState(true);
  const [nextLessonCost, setNextLessonCost] = useState<number | null>(null);
  const isMobile = useIsMobile();

  const amountOwed = Math.abs(accountBalance);
  const paymentAmount = parseFloat(amount) || 0;

  const tierConfig = useInstructorTierConfig(instructorId);
  const splitPercent = commissionPayer === "instructor" ? 0 : commissionPayer === "split" ? 50 : 100;
  const { adminFee, totalCharge, hasFee } = useAdminFee(paymentAmount, splitPercent, tierConfig);
  const effectiveAdminFee = hasFee && feeEnabled ? adminFee : 0;
  const effectiveTotal = paymentAmount + effectiveAdminFee;

  useEffect(() => {
    if (!open || !pupilId) return;
    const today = format(new Date(), "yyyy-MM-dd");
    supabase
      .from("scheduled_lessons")
      .select("duration_minutes, amount_due, price_per_hour, status, lesson_date, start_time")
      .eq("pupil_id", pupilId)
      .gte("lesson_date", today)
      .neq("status", "cancelled")
      .neq("status", "completed")
      .order("lesson_date", { ascending: true })
      .order("start_time", { ascending: true })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) { setNextLessonCost(null); return; }
        const dur = Number(data.duration_minutes) || 0;
        const due = data.amount_due != null ? Number(data.amount_due) : null;
        const pph = data.price_per_hour != null ? Number(data.price_per_hour) : null;
        const cost = due != null && due > 0
          ? due
          : (pph != null && pph > 0 && dur > 0 ? (pph * dur) / 60 : 0);
        setNextLessonCost(cost > 0 ? cost : null);
      });
  }, [open, pupilId]);

  // On mobile, render the drawer instead
  if (isMobile) {
    return (
      <PupilPaymentDrawer
        open={open}
        onOpenChange={onOpenChange}
        pupilId={pupilId}
        pupilName={pupilName}
        pupilEmail={pupilEmail}
        pupilPhone={pupilPhone}
        instructorId={instructorId}
        instructorSlug={instructorSlug}
        accountBalance={accountBalance}
        brandColour={brandColour}
        commissionPayer={commissionPayer}
      />
    );
  }


  const handlePayment = async (gateway: PaymentGateway) => {
    if (paymentAmount <= 0) {
      toast({ title: "Invalid amount", description: "Please enter a valid payment amount", variant: "destructive" });
      return;
    }

    setSelectedGateway(gateway);
    setProcessing(true);

    try {
      const baseUrl = window.location.origin;
      const returnUrl = `${baseUrl}/i/${instructorSlug}?payment=success&amount=${paymentAmount}`;
      const cancelUrl = `${baseUrl}/i/${instructorSlug}?payment=cancelled`;

      const { data, error } = await supabase.functions.invoke("pupil-payment-checkout", {
        body: {
          pupilId,
          instructorId,
          amount: paymentAmount,
          adminFee: effectiveAdminFee,
          gateway,
          customerName: pupilName,
          customerEmail: pupilEmail || undefined,
          customerPhone: pupilPhone || undefined,
          returnUrl,
          cancelUrl,
        },
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || "Failed to initialize payment");
      }

      // Handle redirect based on gateway response
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else if (data.formAction && data.formFields) {
        // For gateways that require form POST (like Elavon/NPI)
        const form = document.createElement("form");
        form.method = "POST";
        form.action = data.formAction;
        form.style.display = "none";

        Object.entries(data.formFields).forEach(([key, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = value as string;
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
      } else {
        throw new Error("No payment URL received");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Payment failed",
        description: error instanceof Error ? error.message : "Could not process payment",
        variant: "destructive",
      });
      setProcessing(false);
      setSelectedGateway(null);
    }
  };

  const gateways: { id: PaymentGateway; name: string; description: string; icon: string }[] = [
    { id: "npi", name: "Pay by Card", description: "Visa, Mastercard, Amex", icon: "💳" },
    { id: "clearpay", name: "Clearpay", description: `4 payments of £${(paymentAmount / 4).toFixed(2)}`, icon: "🔄" },
    { id: "klarna", name: "Klarna", description: `3 payments of £${(paymentAmount / 3).toFixed(2)}`, icon: "💜" },
    { id: "elavon", name: "Secure Card", description: "Alternative card payment", icon: "🔒" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Make a Payment
          </DialogTitle>
          <DialogDescription>
            Pay towards your lesson balance securely
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Payment Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="1"
                max={amountOwed > 0 ? amountOwed : 1000}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7 text-lg font-semibold"
                disabled={processing}
              />
            </div>
            {amountOwed > 0 && (
              <p className="text-sm text-muted-foreground">
                Balance owed: <span className="font-medium text-destructive">£{amountOwed.toFixed(2)}</span>
              </p>
            )}
          </div>

          {/* Quick Amount Buttons */}
          {(amountOwed > 0 || nextLessonCost) && (
            <div className="flex gap-2 flex-wrap">
              {amountOwed > 0 && (
                <Button
                  variant={Math.abs(paymentAmount - amountOwed) < 0.005 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAmount(amountOwed.toFixed(2))}
                  disabled={processing}
                >
                  Balance owed · £{amountOwed.toFixed(2)}
                </Button>
              )}
              {nextLessonCost && (
                <Button
                  variant={Math.abs(paymentAmount - nextLessonCost) < 0.005 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAmount(nextLessonCost.toFixed(2))}
                  disabled={processing}
                >
                  Next lesson · £{nextLessonCost.toFixed(2)}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAmount("")}
                disabled={processing}
              >
                Custom
              </Button>
            </div>
          )}

          {/* Service Fee toggle — hidden from pupils; fee always applies */}
          {hasFee && feeEnabled && (
            <div className="text-xs text-muted-foreground px-1">
              Service fee of £{adminFee.toFixed(2)} included
            </div>
          )}

          {/* Admin Fee Breakdown */}
          <AdminFeeBreakdown
            baseAmount={paymentAmount}
            adminFee={effectiveAdminFee}
            totalCharge={effectiveTotal}
            hasFee={hasFee && feeEnabled}
          />

          {/* Apple Pay / Google Pay Express Checkout */}
          <SquareWalletButtons
            amount={effectiveTotal}
            pupilId={pupilId}
            instructorId={instructorId}
            customerName={pupilName}
            customerEmail={pupilEmail}
            onProcessing={setProcessing}
            disabled={processing || paymentAmount <= 0}
          />

          {/* Payment Gateway Options */}
          <div className="space-y-2">
            <Label>Or choose a payment method</Label>
            <div className="grid gap-2">
              {gateways.map((gateway) => (
                <Card
                  key={gateway.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedGateway === gateway.id && processing
                      ? "ring-2 ring-primary"
                      : ""
                  } ${processing ? "opacity-50 pointer-events-none" : ""}`}
                  onClick={() => !processing && handlePayment(gateway.id)}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="text-2xl">{gateway.icon}</div>
                    <div className="flex-1">
                      <div className="font-medium">{gateway.name}</div>
                      <div className="text-xs text-muted-foreground">{gateway.description}</div>
                    </div>
                    {selectedGateway === gateway.id && processing ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    ) : (
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Security Notice */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
            <span>Payments are processed securely. Your card details are never stored.</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
