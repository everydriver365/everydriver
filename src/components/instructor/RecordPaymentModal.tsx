import { useState } from "react";
import { usePaymentInvalidation } from "@/hooks/usePaymentInvalidation";
import { usePaymentLimit } from "@/hooks/usePaymentLimit";
import { PoundSterling, Loader2, CreditCard, Banknote, Smartphone } from "lucide-react";
import { PaymentLimitBanner } from "@/components/instructor/PaymentLimitBanner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RecordPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pupilId: string;
  pupilName: string;
  instructorId: string;
  currentBalance?: number;
  onPaymentRecorded?: () => void;
}

const paymentMethods = [
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "card", label: "Card", icon: CreditCard },
  { value: "bank_transfer", label: "Transfer", icon: Smartphone },
];

export function RecordPaymentModal({
  open,
  onOpenChange,
  pupilId,
  pupilName,
  instructorId,
  currentBalance = 0,
  onPaymentRecorded,
}: RecordPaymentModalProps) {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const { invalidatePaymentQueries } = usePaymentInvalidation();
  const paymentLimit = usePaymentLimit();

  const handleSubmit = async () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setSaving(true);
    try {
      // Record the payment in payment_history
      const { error: historyError } = await supabase
        .from("payment_history")
        .insert({
          pupil_id: pupilId,
          instructor_id: instructorId,
          amount: parsedAmount,
          payment_method: paymentMethod,
          notes: notes.trim() || null,
        });

      if (historyError) throw historyError;

      // Update the pupil's account balance
      const newBalance = currentBalance + parsedAmount;
      const { error: updateError } = await supabase
        .from("pupils")
        .update({ account_balance: newBalance })
        .eq("id", pupilId);

      if (updateError) throw updateError;

      toast.success(`£${parsedAmount.toFixed(2)} payment recorded for ${pupilName}`);
      invalidatePaymentQueries({ pupilId, instructorId });
      onOpenChange(false);
      setAmount("");
      setPaymentMethod("cash");
      setNotes("");
      onPaymentRecorded?.();
    } catch (error) {
      console.error("Error recording payment:", error);
      toast.error("Failed to record payment");
    } finally {
      setSaving(false);
    }
  };

  const suggestedAmounts = [30, 40, 50, 100];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] max-w-[90vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PoundSterling className="h-5 w-5 text-primary" />
            Record Payment
          </DialogTitle>
          <DialogDescription>
            Record a payment received from {pupilName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {paymentLimit.isLimited && (
            <PaymentLimitBanner
              remaining={paymentLimit.remaining}
              limit={paymentLimit.limit}
              isAtLimit={paymentLimit.isAtLimit}
            />
          )}

          {paymentLimit.isAtLimit ? null : (<>
          {/* Current Balance Info */}
          {currentBalance < 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-3 text-sm">
              <span className="text-amber-700 dark:text-amber-400">
                Outstanding: <strong>£{Math.abs(currentBalance).toFixed(2)}</strong>
              </span>
            </div>
          )}

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                £
              </span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7 text-lg"
              />
            </div>
            {/* Quick Amount Buttons */}
            <div className="flex gap-2 flex-wrap">
              {suggestedAmounts.map((suggested) => (
                <Button
                  key={suggested}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setAmount(suggested.toString())}
                >
                  £{suggested}
                </Button>
              ))}
              {currentBalance < 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs text-amber-600 border-amber-300"
                  onClick={() => setAmount(Math.abs(currentBalance).toString())}
                >
                  £{Math.abs(currentBalance).toFixed(2)} (clear)
                </Button>
              )}
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <RadioGroup
              value={paymentMethod}
              onValueChange={setPaymentMethod}
              className="grid grid-cols-3 gap-2"
            >
              {paymentMethods.map((method) => (
                <div key={method.value}>
                  <RadioGroupItem
                    value={method.value}
                    id={method.value}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={method.value}
                    className="flex flex-col items-center justify-center rounded-2xl border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-colors"
                  >
                    <method.icon className="h-5 w-5 mb-1" />
                    <span className="text-xs">{method.label}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="e.g., Paid for 2 hours"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[60px]"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={saving || !amount}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <PoundSterling className="h-4 w-4 mr-2" />
              )}
              Record
            </Button>
          </div>
          </>)}
        </div>
      </DialogContent>
    </Dialog>
  );
}
