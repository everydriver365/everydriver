import { useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface CancelLessonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessonId: string;
  pupilId: string;
  pupilName: string;
  amountDue: number;
  pupilBalance: number;
  durationMinutes: number;
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
  onCancelled,
}: CancelLessonDialogProps) {
  const [chargeOption, setChargeOption] = useState<"no_charge" | "charge">("no_charge");
  const [cancelling, setCancelling] = useState(false);

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
      if (chargeOption === "charge" && amountDue > 0) {
        const newBalance = pupilBalance - amountDue;
        
        const { error: balanceError } = await supabase
          .from("pupils")
          .update({ account_balance: newBalance })
          .eq("id", pupilId);

        if (balanceError) throw balanceError;

        toast({
          title: "Lesson cancelled with charge",
          description: `£${amountDue.toFixed(2)} deducted from ${pupilName}'s balance`,
        });
      } else {
        toast({
          title: "Lesson cancelled",
          description: `No charge applied to ${pupilName}`,
        });
      }

      onCancelled();
      onOpenChange(false);
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
            <div className="flex items-start space-x-3 rounded-lg border p-4">
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

            <div className="flex items-start space-x-3 rounded-lg border p-4">
              <RadioGroupItem value="charge" id="charge" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="charge" className="font-medium cursor-pointer">
                  Charge cancellation fee
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Deduct{" "}
                  <span className="font-semibold text-foreground">
                    £{amountDue.toFixed(2)}
                  </span>{" "}
                  from {pupilName}'s balance
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Current balance: £{pupilBalance.toFixed(2)} → New balance: £{(pupilBalance - amountDue).toFixed(2)}
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
  );
}
