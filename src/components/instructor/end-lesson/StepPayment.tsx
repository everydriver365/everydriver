import { useState } from "react";
import { PoundSterling, Banknote, CreditCard, Smartphone, QrCode, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePaymentInvalidation } from "@/hooks/usePaymentInvalidation";
import { usePaymentLimit } from "@/hooks/usePaymentLimit";
import { PaymentLimitBanner } from "@/components/instructor/PaymentLimitBanner";

interface StepPaymentProps {
  pupilId: string;
  pupilName: string;
  instructorId: string;
  currentBalance: number;
  lessonCost: number;
  paymentQrUrl?: string | null;
  onPaymentRecorded: () => void;
  onSkip: () => void;
}

const methods = [
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "card", label: "Card", icon: CreditCard },
  { value: "bank_transfer", label: "Transfer", icon: Smartphone },
];

export function StepPayment({
  pupilId,
  pupilName,
  instructorId,
  currentBalance,
  lessonCost,
  paymentQrUrl,
  onPaymentRecorded,
  onSkip,
}: StepPaymentProps) {
  const balanceAfterLesson = currentBalance - lessonCost;
  const suggestedAmount = Math.abs(Math.min(balanceAfterLesson, 0));
  const [amount, setAmount] = useState(suggestedAmount > 0 ? suggestedAmount.toString() : "");
  const [method, setMethod] = useState("cash");
  const [saving, setSaving] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const { invalidatePaymentQueries } = usePaymentInvalidation();
  const paymentLimit = usePaymentLimit();

  const handleRecord = async () => {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setSaving(true);
    try {
      const { error: hErr } = await supabase.from("payment_history").insert({
        pupil_id: pupilId,
        instructor_id: instructorId,
        amount: parsed,
        payment_method: method,
        notes: "Recorded at end of lesson",
      });
      if (hErr) throw hErr;

      const { data: newBal, error: balErr } = await supabase.rpc("increment_pupil_balance", {
        p_pupil_id: pupilId,
        p_amount: parsed,
      });
      if (balErr) throw balErr;

      toast.success(`£${parsed.toFixed(2)} recorded`);
      invalidatePaymentQueries({ pupilId, instructorId });
      onPaymentRecorded();
    } catch (e) {
      console.error(e);
      toast.error("Failed to record payment");
    } finally {
      setSaving(false);
    }
  };

  if (showQR && paymentQrUrl) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="bg-background p-3 rounded-none shadow-md">
          <img src={paymentQrUrl} alt="Payment QR" className="w-48 h-48 object-contain" />
        </div>
        <p className="text-xs text-muted-foreground">Scan to pay</p>
        <Button variant="outline" size="sm" onClick={() => setShowQR(false)}>
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {paymentLimit.isLimited && (
        <PaymentLimitBanner
          remaining={paymentLimit.remaining}
          limit={paymentLimit.limit}
          isAtLimit={paymentLimit.isAtLimit}
          onSkip={onSkip}
        />
      )}

      {paymentLimit.isAtLimit ? null : (<>
      {balanceAfterLesson < 0 && (
        <div className="bg-warning/10 border border-warning/30 rounded-none p-3 text-sm">
          <span className="text-warning">
            Outstanding after lesson: <strong>£{Math.abs(Math.round(balanceAfterLesson))}</strong>
          </span>
        </div>
      )}

      <div className="space-y-2">
        <Label>Amount</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pl-7 text-lg"
            placeholder="0.00"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[30, 40, 50, 100].map((v) => (
            <Button key={v} variant="outline" size="sm" className="text-xs" onClick={() => setAmount(v.toString())}>
              £{v}
            </Button>
          ))}
          {suggestedAmount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs text-warning border-warning/30"
              onClick={() => setAmount(suggestedAmount.toString())}
            >
              £{suggestedAmount.toFixed(0)} (clear)
            </Button>
          )}
        </div>
      </div>

      <RadioGroup value={method} onValueChange={setMethod} className="grid grid-cols-3 gap-2">
        {methods.map((m) => (
          <div key={m.value}>
            <RadioGroupItem value={m.value} id={`end-${m.value}`} className="peer sr-only" />
            <Label
              htmlFor={`end-${m.value}`}
              className="flex flex-col items-center justify-center rounded-none border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-colors"
            >
              <m.icon className="h-5 w-5 mb-1" />
              <span className="text-xs">{m.label}</span>
            </Label>
          </div>
        ))}
      </RadioGroup>

      <div className="flex gap-2">
        <Button onClick={handleRecord} disabled={saving || !amount} className="flex-1">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PoundSterling className="h-4 w-4 mr-2" />}
          Record
        </Button>
        {paymentQrUrl && (
          <>
            <Button variant="outline" onClick={() => setShowQR(true)}>
              <QrCode className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const url = paymentQrUrl;
                const text = `Hi ${pupilName}, here's your payment link: ${url}`;
                if (navigator.share) {
                  navigator.share({ title: "Payment Link", text, url }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(url);
                  toast.success("Payment link copied!");
                }
              }}
            >
              <Send className="h-4 w-4" />
            </Button>
          </>
        )}
        <Button variant="ghost" onClick={onSkip}>
          Skip
        </Button>
      </div>
      </>)}
    </div>
  );
}
