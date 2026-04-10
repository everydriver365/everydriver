import { useState, useEffect } from "react";
import { Loader2, AlertTriangle, Users } from "lucide-react";
import { CancellationBackfillSheet } from "./CancellationBackfillSheet";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { usePaymentInvalidation } from "@/hooks/usePaymentInvalidation";
import { triggerAutomations } from "@/utils/triggerAutomations";
interface CancelLessonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessonId: string;
  pupilId: string;
  pupilName: string;
  amountDue: number;
  pupilBalance: number;
  durationMinutes: number;
  lessonDate: string;
  lessonTime: string;
  endTime?: string;
  instructorId: string;
  onCancelled: () => void;
}

export function CancelLessonDialog({
  open,
  onOpenChange,
  lessonId,
  pupilId,
  pupilName,
  amountDue,
  pupilBalance,
  durationMinutes,
  lessonDate,
  lessonTime,
  endTime,
  instructorId,
  onCancelled,
}: CancelLessonDialogProps) {
  const [chargeOption, setChargeOption] = useState<"no_charge" | "charge">("no_charge");
  const [cancelling, setCancelling] = useState(false);
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null);
  const [showBackfill, setShowBackfill] = useState(false);
  const [chargePercent, setChargePercent] = useState(100);
  const { invalidatePaymentQueries } = usePaymentInvalidation();

  // Check waitlist count when dialog opens
  useEffect(() => {
    const checkWaitlistAndPolicy = async () => {
      const [waitlistRes, policyRes] = await Promise.all([
        supabase
          .from("lesson_waitlist")
          .select("*", { count: "exact", head: true })
          .eq("instructor_id", instructorId)
          .eq("is_active", true),
        supabase
          .from("instructors")
          .select("cancellation_charge_percent")
          .eq("id", instructorId)
          .single(),
      ]);
      setWaitlistCount(waitlistRes.count || 0);
      if (policyRes.data?.cancellation_charge_percent != null) {
        setChargePercent(policyRes.data.cancellation_charge_percent);
      }
    };
    if (open) checkWaitlistAndPolicy();
  }, [open, instructorId]);

  const chargeAmount = Math.round((amountDue * chargePercent / 100) * 100) / 100;

  const handleCancel = async () => {
    setCancelling(true);
    try {
      // 1. Update the lesson status to cancelled
      const { error: lessonError } = await supabase
        .from("scheduled_lessons")
        .update({ status: "cancelled" })
        .eq("id", lessonId);

      if (lessonError) throw lessonError;

      // 2. If charging, deduct from pupil's account balance
      if (chargeOption === "charge" && chargeAmount > 0) {
        const newBalance = pupilBalance - chargeAmount;
        
        const { error: balanceError } = await supabase
          .from("pupils")
          .update({ account_balance: newBalance })
          .eq("id", pupilId);

        if (balanceError) throw balanceError;

        // Record cancellation fee in payment_history
        await supabase.from("payment_history").insert({
          pupil_id: pupilId,
          instructor_id: instructorId,
          amount: -chargeAmount,
          payment_method: "Cancellation Fee",
          notes: `Cancellation charge (${chargePercent}%) for ${lessonDate} ${lessonTime}`,
        });

        invalidatePaymentQueries({ pupilId, instructorId });

        toast({
          title: "Lesson cancelled with charge",
          description: `£${chargeAmount.toFixed(2)} deducted from ${pupilName}'s balance`,
        });
      } else {
        toast({
          title: "Lesson cancelled",
          description: `No charge applied to ${pupilName}`,
        });
      }

      // Process waitlist - find matching pupils for this slot
      try {
        const { data: waitlistResult } = await supabase.functions.invoke("process-cancellation-waitlist", {
          body: {
            instructorId,
            lessonDate,
            startTime: lessonTime,
            endTime: endTime || lessonTime,
            durationMins: durationMinutes,
            originalLessonId: lessonId,
          },
        });

        if (waitlistResult?.offersCreated > 0) {
          toast({
            title: "Waitlist matches found!",
            description: `${waitlistResult.offersCreated} pupil(s) matched. Review offers in your Gaps section.`,
          });
        }
      } catch (waitlistError) {
        console.error("Failed to process waitlist:", waitlistError);
      }

      // Notify instructor via SMS
      try {
        await supabase.functions.invoke("notify-instructor", {
          body: {
            instructorId,
            type: "cancellation",
            pupilName,
            lessonDate,
            lessonTime,
            chargeApplied: chargeOption === "charge",
          },
        });
      } catch (smsError) {
        console.error("Failed to send cancellation SMS:", smsError);
      }

      // Fire automations for cancellation
      triggerAutomations({
        triggerType: "cancellation",
        instructorId,
        pupilId,
        pupilName,
      });

      onCancelled();
      onOpenChange(false);
      // Show backfill sheet after cancellation
      setShowBackfill(true);
    } catch (error) {
      console.error("Error cancelling lesson:", error);
      toast({
        title: "Error",
        description: "Failed to cancel lesson",
        variant: "destructive",
      });
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Cancel Lesson
            </DialogTitle>
            <DialogDescription>
              Cancel the {durationMinutes}-minute lesson with {pupilName}?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <RadioGroup
              value={chargeOption}
              onValueChange={(v) => setChargeOption(v as "no_charge" | "charge")}
              className="space-y-3"
            >
              <div className="flex items-start space-x-3 rounded-none border p-4">
                <RadioGroupItem value="no_charge" id="no_charge" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="no_charge" className="font-medium cursor-pointer">
                    Cancel without charge
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    The lesson will be cancelled and no fee will be applied
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 rounded-none border p-4">
                <RadioGroupItem value="charge" id="charge" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="charge" className="font-medium cursor-pointer">
                    Charge cancellation fee ({chargePercent}%)
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Deduct{" "}
                    <span className="font-semibold text-foreground">
                      £{chargeAmount.toFixed(2)}
                    </span>{" "}
                    from {pupilName}'s balance
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Current balance: £{pupilBalance.toFixed(2)} → New balance: £{(pupilBalance - chargeAmount).toFixed(2)}
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Keep Lesson
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {chargeOption === "charge" ? "Cancel & Charge" : "Cancel Lesson"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CancellationBackfillSheet
        open={showBackfill}
        onOpenChange={setShowBackfill}
        instructorId={instructorId}
        lessonDate={lessonDate}
        startTime={lessonTime}
        endTime={endTime || lessonTime}
        durationMinutes={durationMinutes}
        originalLessonId={lessonId}
      />
    </>
  );
}
