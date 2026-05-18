import { useState, useEffect } from "react";
import { CreditCard, ChevronRight, ChevronDown, Shield, Loader2, ArrowLeft, History, X } from "lucide-react";
import { Drawer as DrawerPrimitive } from "vaul";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { SquareWalletButtons } from "@/components/payments/SquareWalletButtons";
import { SquarePaymentForm } from "@/components/payments/SquarePaymentForm";
import { useAdminFee } from "@/hooks/useAdminFee";
import { useInstructorTierConfig } from "@/hooks/useInstructorTierConfig";
import { AdminFeeBreakdown } from "@/components/payments/AdminFeeBreakdown";
import { format } from "date-fns";

interface PupilPaymentDrawerProps {
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

type PaymentGateway = "npi" | "clearpay" | "klarna";
type Stage = "amount" | "method";

interface RecentPayment {
  id: string;
  amount: number;
  payment_method: string | null;
  recorded_at: string;
}

interface NextLessonCost {
  cost: number;
  date: string;
  durationMinutes: number;
}

export function PupilPaymentDrawer({
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
}: PupilPaymentDrawerProps) {
  const [stage, setStage] = useState<Stage>("amount");
  const [amount, setAmount] = useState<string>(Math.abs(accountBalance).toFixed(2));
  const [processing, setProcessing] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(null);
  const [bnplExpanded, setBnplExpanded] = useState(false);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [nextLesson, setNextLesson] = useState<NextLessonCost | null>(null);
  const [feeEnabled, setFeeEnabled] = useState(true);

  const amountOwed = Math.abs(accountBalance);
  const paymentAmount = parseFloat(amount) || 0;
  const tierConfig = useInstructorTierConfig(instructorId);
  const splitPercent = commissionPayer === "instructor" ? 0 : commissionPayer === "split" ? 50 : 100;
  const { adminFee, totalCharge, hasFee } = useAdminFee(paymentAmount, splitPercent, tierConfig);
  const effectiveAdminFee = hasFee && feeEnabled ? adminFee : 0;
  const effectiveTotal = paymentAmount + effectiveAdminFee;

  // Fetch recent payments when drawer opens
  useEffect(() => {
    if (open && pupilId) {
      supabase
        .from("payment_history")
        .select("id, amount, payment_method, recorded_at")
        .eq("pupil_id", pupilId)
        .gt("amount", 0)
        .order("recorded_at", { ascending: false })
        .limit(3)
        .then(({ data }) => setRecentPayments(data || []));
    }
  }, [open, pupilId]);

  // Fetch next upcoming lesson cost
  useEffect(() => {
    if (!open || !pupilId) return;
    const today = format(new Date(), "yyyy-MM-dd");
    supabase
      .from("scheduled_lessons")
      .select("id, lesson_date, start_time, duration_minutes, amount_due, price_per_hour, status")
      .eq("pupil_id", pupilId)
      .gte("lesson_date", today)
      .neq("status", "cancelled")
      .neq("status", "completed")
      .order("lesson_date", { ascending: true })
      .order("start_time", { ascending: true })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) { setNextLesson(null); return; }
        const dur = Number(data.duration_minutes) || 0;
        const due = data.amount_due != null ? Number(data.amount_due) : null;
        const pph = data.price_per_hour != null ? Number(data.price_per_hour) : null;
        const cost = due != null && due > 0
          ? due
          : (pph != null && pph > 0 && dur > 0 ? (pph * dur) / 60 : 0);
        if (cost > 0) {
          setNextLesson({ cost, date: data.lesson_date, durationMinutes: dur });
        } else {
          setNextLesson(null);
        }
      });
  }, [open, pupilId]);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setStage("amount");
      setSelectedGateway(null);
      setProcessing(false);
      setBnplExpanded(false);
    }
    onOpenChange(isOpen);
  };

  const handleContinue = () => {
    if (paymentAmount <= 0) {
      toast({ title: "Invalid amount", description: "Please enter a valid payment amount", variant: "destructive" });
      return;
    }
    setStage("method");
  };

  const handlePayment = async (gateway: PaymentGateway) => {
    if (paymentAmount <= 0) return;

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
      if (!data?.success) throw new Error(data?.error || "Failed to initialize payment");

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else if (data.formAction && data.formFields) {
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

  const formatMethod = (m: string | null) => {
    if (!m) return "";
    const map: Record<string, string> = { cash: "Cash", card: "Card", bank_transfer: "Transfer", apple_pay: "Apple Pay", google_pay: "Google Pay" };
    return map[m.toLowerCase()] || m;
  };

  return (
    <DrawerPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" />
        <DrawerPrimitive.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-[14px] bg-card",
            "shadow-[0_-4px_40px_rgba(0,0,0,0.12)] max-h-[85vh]"
          )}
        >
          {/* Grab handle */}
          <div className="flex justify-center pt-2.5 pb-1">
            <div className="w-9 h-[5px] rounded-full bg-muted-foreground/30" />
          </div>

          {stage === "amount" ? (
            <div className="px-5 pb-8 space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between pt-1">
                <div className="w-8" />
                <h2 className="text-[17px] font-semibold text-foreground">Make a Payment</h2>
                <button
                  onClick={() => handleOpenChange(false)}
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {amountOwed > 0 && (
                <p className="text-sm text-muted-foreground text-center -mt-3">
                  Balance owed: <span className="font-semibold text-destructive">£{amountOwed.toFixed(2)}</span>
                </p>
              )}

              {/* Amount display */}
              <div className="space-y-2">
                <Label htmlFor="drawer-amount" className="text-sm text-muted-foreground">Payment amount</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-muted-foreground font-medium">£</span>
                  <Input
                    id="drawer-amount"
                    type="number"
                    step="0.01"
                    min="1"
                    max={amountOwed > 0 ? amountOwed : 1000}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-9 text-2xl font-bold h-14 rounded-xl text-center"
                    disabled={processing}
                  />
                </div>
              </div>

              {/* Quick-select chips */}
              {(amountOwed > 0 || nextLesson) && (
                <div className="flex gap-2 flex-wrap">
                  {amountOwed > 0 && (
                    <button
                      onClick={() => setAmount(amountOwed.toFixed(2))}
                      className={cn(
                        "px-3.5 py-2 rounded-full text-xs font-medium transition-colors",
                        Math.abs(paymentAmount - amountOwed) < 0.005
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      )}
                    >
                      Balance owed · £{amountOwed.toFixed(2)}
                    </button>
                  )}
                  {nextLesson && (
                    <button
                      onClick={() => setAmount(nextLesson.cost.toFixed(2))}
                      className={cn(
                        "px-3.5 py-2 rounded-full text-xs font-medium transition-colors",
                        Math.abs(paymentAmount - nextLesson.cost) < 0.005
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      )}
                    >
                      Next lesson · £{nextLesson.cost.toFixed(2)}
                    </button>
                  )}
                  <button
                    onClick={() => setAmount("")}
                    className="px-3.5 py-2 rounded-full text-xs font-medium bg-secondary/60 text-secondary-foreground hover:bg-secondary"
                  >
                    Custom
                  </button>
                </div>
              )}

              {/* Service Fee toggle — hidden from pupils; fee always applies */}
              {hasFee && feeEnabled && (
                <div className="text-xs text-muted-foreground px-1">
                  Service fee of £{adminFee.toFixed(2)} included
                </div>
              )}

              {/* Fee breakdown */}
              <AdminFeeBreakdown
                baseAmount={paymentAmount}
                adminFee={effectiveAdminFee}
                totalCharge={effectiveTotal}
                hasFee={hasFee && feeEnabled}
              />

              {/* Recent Payments */}
              {recentPayments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <History className="h-3 w-3" />
                    Recent Payments
                  </p>
                  <div className="space-y-1.5">
                    {recentPayments.map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-xs bg-muted/50 rounded-lg px-3 py-2">
                        <span className="text-muted-foreground">
                          {format(new Date(p.recorded_at), "d MMM")}
                          {p.payment_method ? ` · ${formatMethod(p.payment_method)}` : ""}
                        </span>
                        <span className="font-semibold text-emerald-600">+£{Number(p.amount).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Continue button */}
              <Button
                onClick={handleContinue}
                className="w-full h-12 rounded-xl text-base font-semibold"
                disabled={paymentAmount <= 0}
              >
                Continue — £{effectiveTotal.toFixed(2)}
                <ChevronRight className="h-5 w-5 ml-1" />
              </Button>
            </div>
          ) : (
            <div className="px-5 pb-8 space-y-4 overflow-auto">
              {/* Header with back */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={() => setStage("amount")}
                  className="p-1 -ml-1 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={processing}
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex-1">
                  <h2 className="text-[17px] font-semibold text-foreground">Pay £{effectiveTotal.toFixed(2)}</h2>
                  <p className="text-xs text-muted-foreground">Choose payment method</p>
                </div>
              </div>

              {/* Express Checkout — Apple Pay / Google Pay */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Express checkout</p>
                <SquareWalletButtons
                  amount={effectiveTotal}
                  pupilId={pupilId}
                  instructorId={instructorId}
                  customerName={pupilName}
                  customerEmail={pupilEmail}
                  onProcessing={setProcessing}
                  disabled={processing || paymentAmount <= 0}
                />
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Pay by Card — primary */}
              <Button
                onClick={() => handlePayment("npi")}
                className="w-full h-12 rounded-xl text-base font-semibold"
                disabled={processing}
              >
                {selectedGateway === "npi" && processing ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <CreditCard className="h-5 w-5 mr-2" />
                )}
                Pay by Card
              </Button>

              {/* BNPL expandable */}
              <div className="rounded-xl border bg-card">
                <button
                  onClick={() => setBnplExpanded(!bnplExpanded)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground"
                  disabled={processing}
                >
                  <span>Pay in instalments</span>
                  <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", bnplExpanded && "rotate-180")} />
                </button>
                {bnplExpanded && (
                  <div className="px-4 pb-3 space-y-2">
                    <button
                      onClick={() => handlePayment("clearpay")}
                      disabled={processing}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg transition-colors",
                        "bg-secondary/50 hover:bg-secondary",
                        processing && "opacity-50 pointer-events-none"
                      )}
                    >
                      <span className="text-xl">🔄</span>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium text-foreground">Clearpay</div>
                        <div className="text-xs text-muted-foreground">4 payments of £{(paymentAmount / 4).toFixed(2)}</div>
                      </div>
                      {selectedGateway === "clearpay" && processing && (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      )}
                    </button>
                    <button
                      onClick={() => handlePayment("klarna")}
                      disabled={processing}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg transition-colors",
                        "bg-secondary/50 hover:bg-secondary",
                        processing && "opacity-50 pointer-events-none"
                      )}
                    >
                      <span className="text-xl">💜</span>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium text-foreground">Klarna</div>
                        <div className="text-xs text-muted-foreground">3 payments of £{(paymentAmount / 3).toFixed(2)}</div>
                      </div>
                      {selectedGateway === "klarna" && processing && (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Security notice */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                <Shield className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-500 shrink-0" />
                <span>Payments are processed securely. Your card details are never stored.</span>
              </div>
            </div>
          )}
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}
