import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { OnboardingLayout } from "../components/OnboardingLayout";
import { StepNavigation } from "../components/StepNavigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Check, Loader2, Star, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  price_monthly: number;
  price_yearly: number | null;
  description: string | null;
  features: string[];
  is_popular: boolean;
  cta_text: string | null;
  max_pupils: number | null;
  sms_credits_monthly: number | null;
}

interface StepPlanSelectionProps {
  selectedPlanId: string | null;
  billingCycle: "monthly" | "yearly";
  onUpdate: (data: { selectedPlanId?: string; billingCycle?: "monthly" | "yearly" }) => void;
  onNext: () => void;
  onBack: () => void;
  onPaidPlanSelected: (plan: SubscriptionPlan) => void;
}

export function StepPlanSelection({
  selectedPlanId,
  billingCycle,
  onUpdate,
  onNext,
  onBack,
  onPaidPlanSelected,
}: StepPlanSelectionProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (!error && data) {
        const typedPlans = data.map((plan) => ({
          ...plan,
          features: (plan.features as string[]) || [],
          is_popular: plan.is_popular || false,
        }));
        setPlans(typedPlans);
      }
      setLoading(false);
    };
    fetchPlans();
  }, []);

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    onUpdate({ selectedPlanId: plan.id });
  };

  const handleContinue = async () => {
    const selectedPlan = plans.find((p) => p.id === selectedPlanId);
    if (!selectedPlan) return;

    setIsProcessing(true);

    if (selectedPlan.price_monthly === 0) {
      // Free plan - proceed directly
      onNext();
    } else {
      // Paid plan - trigger GoCardless flow
      onPaidPlanSelected(selectedPlan);
    }

    setIsProcessing(false);
  };

  const getPrice = (plan: SubscriptionPlan) => {
    if (billingCycle === "yearly" && plan.price_yearly) {
      return plan.price_yearly;
    }
    return plan.price_monthly;
  };

  const getMonthlyEquivalent = (plan: SubscriptionPlan) => {
    if (billingCycle === "yearly" && plan.price_yearly) {
      return Math.round(plan.price_yearly / 12);
    }
    return plan.price_monthly;
  };

  const getSavings = (plan: SubscriptionPlan) => {
    if (billingCycle === "yearly" && plan.price_yearly && plan.price_monthly > 0) {
      const yearlyIfMonthly = plan.price_monthly * 12;
      const savings = yearlyIfMonthly - plan.price_yearly;
      if (savings > 0) {
        return Math.round((savings / yearlyIfMonthly) * 100);
      }
    }
    return 0;
  };

  if (loading) {
    return (
      <OnboardingLayout step={6} totalSteps={9} title="Loading plans...">
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </OnboardingLayout>
    );
  }

  return (
    <OnboardingLayout
      step={6}
      totalSteps={9}
      title="Choose Your Plan"
      description="Select the plan that best fits your needs. Start free or unlock more features."
    >

      {/* Plans Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {plans.map((plan, index) => {
          const isSelected = selectedPlanId === plan.id;
          const savings = getSavings(plan);

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={cn(
                  "relative cursor-pointer transition-all duration-200 h-full",
                  isSelected
                    ? "border-primary ring-2 ring-primary/20 shadow-lg"
                    : "border-border hover:border-primary/50 hover:shadow-md",
                  plan.is_popular && "border-emerald-500"
                )}
                onClick={() => handlePlanSelect(plan)}
              >
                {/* Popular badge */}
                {plan.is_popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <Badge className="bg-emerald-500 text-white flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                {/* Savings badge */}
                {savings > 0 && billingCycle === "yearly" && (
                  <div className="absolute -top-3 right-4 z-10">
                    <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                      Save {savings}%
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4 pt-6">
                  <CardTitle className="text-xl text-foreground">{plan.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>

                  <div className="pt-4">
                    {plan.price_monthly === 0 ? (
                      <div className="text-4xl font-bold text-foreground">Free</div>
                    ) : (
                      <>
                        <div className="text-4xl font-bold text-foreground">
                          £{getMonthlyEquivalent(plan)}
                          <span className="text-lg font-normal text-muted-foreground">
                            /mo
                          </span>
                        </div>
                        {billingCycle === "yearly" && plan.price_yearly && (
                          <p className="text-sm text-muted-foreground mt-1">
                            £{plan.price_yearly} billed yearly
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {/* Limits */}
                  <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mb-4 pb-4 border-b">
                    <span>
                      {plan.max_pupils === null ? "Unlimited" : plan.max_pupils} pupils
                    </span>
                    {plan.sms_credits_monthly !== null && plan.sms_credits_monthly > 0 && (
                      <>
                        <span>•</span>
                        <span>{plan.sms_credits_monthly} SMS/mo</span>
                      </>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-6">
                    {plan.features.slice(0, 6).map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-success shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                    {plan.features.length > 6 && (
                      <li className="text-sm text-muted-foreground text-center">
                        +{plan.features.length - 6} more features
                      </li>
                    )}
                  </ul>

                  {/* Select button */}
                  <Button
                    variant={isSelected ? "default" : "outline"}
                    className={cn(
                      "w-full",
                      isSelected && "bg-primary text-primary-foreground",
                      plan.is_popular && !isSelected && "border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                    )}
                  >
                    {isSelected ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Selected
                      </>
                    ) : (
                      plan.cta_text || "Select Plan"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Additional plans hint */}
      {plans.length > 3 && (
        <p className="text-center text-sm text-muted-foreground mb-4">
          <Zap className="h-4 w-4 inline mr-1" />
          Looking for more? Enterprise and multi-instructor plans available.{" "}
          <a href="/contact" className="text-primary hover:underline">
            Contact us
          </a>
        </p>
      )}

      <StepNavigation
        onBack={onBack}
        onNext={handleContinue}
        nextLabel={
          plans.find((p) => p.id === selectedPlanId)?.price_monthly === 0
            ? "Continue with Free"
            : "Set Up Payment"
        }
        isLoading={isProcessing}
        canProceed={!!selectedPlanId}
      />
    </OnboardingLayout>
  );
}
