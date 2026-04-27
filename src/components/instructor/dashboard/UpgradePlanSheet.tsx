import { useEffect, useState } from "react";
import { Check, Mail } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlanBadge } from "@/components/instructor/PlanBadge";
import { DowngradeSaveSheet } from "@/components/instructor/dashboard/DowngradeSaveSheet";
import { supabase } from "@/integrations/supabase/client";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { toast } from "sonner";

interface Plan {
  id: string;
  name: string;
  slug: string;
  price_monthly: number;
  price_yearly: number | null;
  description: string | null;
  features: string[];
  is_popular: boolean | null;
  max_pupils: number | null;
  sms_credits_monthly: number | null;
  cta_text: string | null;
  is_per_seat: boolean;
  base_price_monthly: number;
  per_seat_price_monthly: number;
  min_seats: number;
}

interface UpgradePlanSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlanSlug: string;
}

export function UpgradePlanSheet({ open, onOpenChange, currentPlanSlug }: UpgradePlanSheetProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);
  const [saveOffer, setSaveOffer] = useState<{ from: Plan; to: Plan } | null>(null);
  const { subscription, refreshInstructor } = useInstructorAuth();

  useEffect(() => {
    if (!open) return;
    const fetchPlans = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("id, name, slug, price_monthly, price_yearly, description, features, is_popular, max_pupils, sms_credits_monthly, cta_text, is_per_seat, base_price_monthly, per_seat_price_monthly, min_seats")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (!error && data) {
        setPlans(data.map(p => ({
          ...p,
          features: Array.isArray(p.features) ? (p.features as string[]) : [],
          is_per_seat: (p as any).is_per_seat || false,
          base_price_monthly: (p as any).base_price_monthly ?? 0,
          per_seat_price_monthly: (p as any).per_seat_price_monthly ?? 0,
          min_seats: (p as any).min_seats ?? 1,
        })));
      }
      setLoading(false);
    };
    fetchPlans();
  }, [open]);

  const performPlanSwitch = async (plan: Plan) => {
    if (!subscription?.id) return;
    setSwitching(plan.slug);
    try {
      const { error } = await supabase
        .from("instructor_subscriptions")
        .update({ plan_id: plan.id })
        .eq("id", subscription.id);

      if (error) throw error;
      await refreshInstructor();
      toast.success(`Switched to ${plan.name} plan!`);
      onOpenChange(false);
    } catch (err) {
      toast.error("Failed to switch plan.");
    } finally {
      setSwitching(null);
    }
  };

  const handleChangePlan = async (plan: Plan) => {
    if (!subscription?.id) return;

    if (plan.price_monthly > 0 && currentPlanSlug === "free") {
      toast.success(`To upgrade to ${plan.name}, please contact us`, {
        description: "Email hello@drive365.co.uk or call us to upgrade your plan.",
        duration: 5000,
      });
      return;
    }

    // Intercept downgrades (paid → cheaper paid) with a save offer
    const currentPlan = plans.find(p => p.slug === currentPlanSlug);
    if (
      currentPlan &&
      currentPlan.price_monthly > 0 &&
      plan.price_monthly > 0 &&
      plan.price_monthly < currentPlan.price_monthly
    ) {
      setSaveOffer({ from: currentPlan, to: plan });
      return;
    }

    await performPlanSwitch(plan);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>Choose Your Plan</SheetTitle>
          <SheetDescription>Compare features and pick the plan that fits your business.</SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="space-y-3 pb-4">
            {plans.map((plan) => {
              const isCurrent = plan.slug === currentPlanSlug;
              return (
                <div
                  key={plan.id}
                  className={`border p-4 relative ${
                    isCurrent ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  {plan.is_popular && !isCurrent && (
                    <Badge className="absolute -top-2 right-3 text-[10px]">Popular</Badge>
                  )}

                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <PlanBadge planSlug={plan.slug} size="md" />
                      <span className="font-medium text-foreground">{plan.name}</span>
                    </div>
                    <div className="text-right">
                      {plan.is_per_seat ? (
                        <div>
                          <span className="text-lg font-semibold text-foreground">£{plan.base_price_monthly}</span>
                          <span className="text-xs text-muted-foreground">/mo</span>
                          <p className="text-[10px] text-muted-foreground">+ £{plan.per_seat_price_monthly}/seat</p>
                        </div>
                      ) : plan.price_monthly === 0 ? (
                        <span className="text-lg font-semibold text-foreground">Free</span>
                      ) : (
                        <div>
                          <span className="text-lg font-semibold text-foreground">£{plan.price_monthly}</span>
                          <span className="text-xs text-muted-foreground">/mo</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {plan.description && (
                    <p className="text-xs text-muted-foreground mb-2">{plan.description}</p>
                  )}

                  {plan.features.length > 0 && (
                    <ul className="space-y-1 mb-3">
                      {plan.features.slice(0, 5).map((f, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  )}

                  {plan.max_pupils && (
                    <p className="text-[10px] text-muted-foreground mb-2">Up to {plan.max_pupils} pupils</p>
                  )}

                  {isCurrent ? (
                    <Button variant="outline" size="sm" className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full gap-1.5"
                      onClick={() => handleChangePlan(plan)}
                      disabled={switching === plan.slug}
                    >
                      <Mail className="h-3.5 w-3.5" />
                      {plan.cta_text || "Contact to Upgrade"}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
