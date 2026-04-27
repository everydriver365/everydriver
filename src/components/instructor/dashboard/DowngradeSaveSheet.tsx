import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { trackFunnelEvent } from "@/lib/funnelTracker";
import { toast } from "sonner";
import { Sparkles, PauseCircle, Tag, ArrowDown, Loader2 } from "lucide-react";

interface Plan {
  id: string;
  slug: string;
  name: string;
  price_monthly: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fromPlan: Plan;
  toPlan: Plan;
  onProceedDowngrade: () => Promise<void> | void;
}

type OfferType = "discount_50_3mo" | "pause_30d" | "pause_60d";

export function DowngradeSaveSheet({
  open,
  onOpenChange,
  fromPlan,
  toPlan,
  onProceedDowngrade,
}: Props) {
  const { instructor, refreshInstructor } = useInstructorAuth();
  const [eligible, setEligible] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState<OfferType | "downgrade" | null>(null);

  useEffect(() => {
    if (!open || !instructor?.id) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.rpc("check_save_offer_eligibility", {
        p_instructor_id: instructor.id,
      });
      if (!cancelled) setEligible(Boolean(data));
      void trackFunnelEvent("save_offer_shown", {
        instructorId: instructor.id,
        data: { from: fromPlan.slug, to: toPlan.slug },
      });
    })();
    return () => { cancelled = true; };
  }, [open, instructor?.id, fromPlan.slug, toPlan.slug]);

  const applyOffer = async (offerType: OfferType) => {
    setSubmitting(offerType);
    try {
      const { data, error } = await supabase.functions.invoke("subscription-save-apply", {
        body: { offer_type: offerType, from_plan_slug: fromPlan.slug, to_plan_slug: toPlan.slug },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      await refreshInstructor();
      toast.success("Offer applied — thanks for staying!");
      onOpenChange(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not apply offer";
      toast.error(msg);
    } finally {
      setSubmitting(null);
    }
  };

  const declineAndDowngrade = async () => {
    setSubmitting("downgrade");
    try {
      if (instructor?.id) {
        await trackFunnelEvent("save_offer_declined", {
          instructorId: instructor.id,
          data: { from: fromPlan.slug, to: toPlan.slug },
        });
      }
      await onProceedDowngrade();
      onOpenChange(false);
    } finally {
      setSubmitting(null);
    }
  };

  const halfPrice = (fromPlan.price_monthly / 2).toFixed(2);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Before you downgrade…
          </SheetTitle>
          <SheetDescription>
            You're moving from <strong>{fromPlan.name}</strong> (£{fromPlan.price_monthly}/mo)
            to <strong>{toPlan.name}</strong> (£{toPlan.price_monthly}/mo).
            {eligible === false && " You've already used a save offer in the last 12 months."}
          </SheetDescription>
        </SheetHeader>

        {eligible !== false && (
          <div className="space-y-3 mb-4">
            <button
              onClick={() => applyOffer("discount_50_3mo")}
              disabled={submitting !== null}
              className="w-full text-left rounded-2xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 p-4 hover:border-emerald-400 transition disabled:opacity-50"
            >
              <div className="flex items-start gap-3">
                <Tag className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-foreground">50% off for 3 months</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Keep {fromPlan.name} at <strong>£{halfPrice}/mo</strong> for 3 cycles, then back to £{fromPlan.price_monthly}.
                  </p>
                </div>
                {submitting === "discount_50_3mo" && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
            </button>

            <button
              onClick={() => applyOffer("pause_30d")}
              disabled={submitting !== null}
              className="w-full text-left rounded-2xl border border-blue-200 bg-blue-50 dark:bg-blue-950/20 p-4 hover:border-blue-400 transition disabled:opacity-50"
            >
              <div className="flex items-start gap-3">
                <PauseCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-foreground">Pause for 30 days</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    No charges for 30 days. Your plan resumes automatically.
                  </p>
                </div>
                {submitting === "pause_30d" && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
            </button>

            <button
              onClick={() => applyOffer("pause_60d")}
              disabled={submitting !== null}
              className="w-full text-left rounded-2xl border border-blue-200 bg-blue-50 dark:bg-blue-950/20 p-4 hover:border-blue-400 transition disabled:opacity-50"
            >
              <div className="flex items-start gap-3">
                <PauseCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-foreground">Pause for 60 days</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Take a longer break. No charges, no data loss.
                  </p>
                </div>
                {submitting === "pause_60d" && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
            </button>
          </div>
        )}

        <div className="border-t pt-3">
          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={declineAndDowngrade}
            disabled={submitting !== null}
          >
            {submitting === "downgrade" ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ArrowDown className="h-4 w-4 mr-2" />
            )}
            No thanks, downgrade to {toPlan.name}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
