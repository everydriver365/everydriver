import { useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PupilPaymentDisputeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentId: string | null;
  pupilId: string;
}

export function PupilPaymentDisputeSheet({
  open,
  onOpenChange,
  paymentId,
  pupilId,
}: PupilPaymentDisputeSheetProps) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!paymentId || reason.trim().length < 3) {
      toast.error("Please explain the issue (at least a few words).");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("submit-payment-dispute", {
        body: { payment_id: paymentId, pupil_id: pupilId, reason: reason.trim() },
      });
      if (error) throw error;
      toast.success("Sent to your instructor for review.");
      setReason("");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message || "Could not send. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <DrawerTitle>Flag for review</DrawerTitle>
          </div>
          <DrawerDescription>
            Tell your instructor what looks wrong. They'll get back to you.
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-4 space-y-3">
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            maxLength={1000}
            placeholder="e.g. I think this lesson was already paid for, or the amount looks wrong…"
            disabled={submitting}
          />
          <p className="text-[11px] text-muted-foreground text-right">{reason.length}/1000</p>
        </div>

        <div className="px-4 pb-6 pt-2 flex gap-2 border-t border-border">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={submit} disabled={submitting || reason.trim().length < 3}>
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Send to instructor
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
