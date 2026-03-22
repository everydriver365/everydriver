import { useState, useEffect } from "react";
import { OnboardingLayout } from "../components/OnboardingLayout";
import { StepNavigation } from "../components/StepNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  CreditCard, 
  Shield, 
  CheckCircle2, 
  Loader2, 
  Globe,
  ArrowRight,
  AlertCircle,
  Banknote
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StepPaymentProps {
  data: {
    name: string;
    selectedPlanId: string | null;
    selectedDomain: string | null;
  };
  instructorId: string;
  onNext: () => void;
  onBack: () => void;
  onSkip?: () => void;
}

interface PlanDetails {
  id: string;
  name: string;
  price_monthly: number;
}

export function StepPayment({
  data,
  instructorId,
  onNext,
  onBack,
  onSkip,
}: StepPaymentProps) {
  const [plan, setPlan] = useState<PlanDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        if (data.selectedPlanId) {
          const { data: planData, error } = await supabase
            .from("subscription_plans")
            .select("id, name, price_monthly")
            .eq("id", data.selectedPlanId)
            .single();

          if (!error && planData) {
            setPlan(planData);
          }
        }
      } catch (err) {
        console.error("Init error:", err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [data.selectedPlanId]);

  const handleSetupDirectDebit = async () => {
    if (!plan) return;

    setSubmitting(true);
    setError(null);

    try {
      // Parse domain if selected
      let domainName: string | undefined;
      let domainTld: string | undefined;
      let domainPrice: number | undefined;

      if (data.selectedDomain) {
        const domainParts = data.selectedDomain.match(/^(.+?)(\.co\.uk|\.uk|\.com|\.org|\.net|\.io)$/i);
        domainName = domainParts ? domainParts[1] : data.selectedDomain.split(".")[0];
        domainTld = domainParts ? domainParts[2] : "." + data.selectedDomain.split(".").slice(1).join(".");
        domainPrice = 12.99;
      }

      const redirectUrl = `${window.location.origin}/instructor-app/onboarding?step=10&dd_complete=true`;

      const { data: result, error: fnError } = await supabase.functions.invoke(
        "gocardless-create-billing-request",
        {
          body: {
            instructor_id: instructorId,
            plan_id: plan.id,
            redirect_url: redirectUrl,
            domain_name: domainName,
            domain_tld: domainTld,
            domain_price: domainPrice,
          },
        }
      );

      if (fnError || !result?.success) {
        throw new Error(result?.error || fnError?.message || "Failed to set up Direct Debit");
      }

      // Redirect to GoCardless hosted page
      if (result.authorisation_url) {
        window.location.href = result.authorisation_url;
      } else {
        throw new Error("No authorisation URL returned");
      }
    } catch (err) {
      console.error("DD setup error:", err);
      setError(err instanceof Error ? err.message : "Failed to set up Direct Debit");
      toast.error("Failed to set up Direct Debit");
      setSubmitting(false);
    }
  };

  // Check if returning from GoCardless DD setup
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("dd_complete") === "true") {
      toast.success("Direct Debit set up successfully!");
      onNext();
    }
  }, [onNext]);

  const monthlyAmount = plan?.price_monthly || 0;
  const domainAmount = data.selectedDomain ? 12.99 : 0;

  if (loading) {
    return (
      <OnboardingLayout step={9} totalSteps={10} title="Loading...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </OnboardingLayout>
    );
  }

  // If no paid plan selected, skip this step
  if (!plan || plan.price_monthly === 0) {
    return (
      <OnboardingLayout
        step={9}
        totalSteps={10}
        title="You're All Set!"
        description="You've selected the free plan - no payment required"
      >
        <div className="space-y-6">
          <Card className="border-success/30 bg-success/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold">Free Plan Active</h3>
                  <p className="text-sm text-muted-foreground">
                    You can upgrade to a paid plan at any time from your settings.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {data.selectedDomain && (
            <Card className="border-warning/30 bg-warning/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center">
                    <Globe className="h-6 w-6 text-warning" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Domain Selected: {data.selectedDomain}</h3>
                    <p className="text-sm text-muted-foreground">
                      You'll need a paid plan to register your custom domain.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <StepNavigation
          onBack={onBack}
          onNext={onNext}
          canProceed={true}
          nextLabel="Complete Setup"
        />
      </OnboardingLayout>
    );
  }

  return (
    <OnboardingLayout
      step={9}
      totalSteps={10}
      title="Set Up Direct Debit"
      description="Set up a monthly Direct Debit to activate your subscription"
    >
      <div className="space-y-6">
        {/* Order Summary */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Order Summary
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">{plan.name} Plan</p>
                  <p className="text-sm text-muted-foreground">Monthly Direct Debit</p>
                </div>
                <p className="font-semibold">£{plan.price_monthly.toFixed(2)}/mo</p>
              </div>

              {data.selectedDomain && (
                <div className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{data.selectedDomain}</p>
                      <p className="text-sm text-muted-foreground">Domain registration (1 year)</p>
                    </div>
                  </div>
                  <p className="font-semibold">£{domainAmount.toFixed(2)}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <p className="font-semibold">Monthly Payment</p>
                <p className="text-xl font-bold text-primary">£{monthlyAmount.toFixed(2)}/mo</p>
              </div>

              {domainAmount > 0 && (
                <p className="text-xs text-muted-foreground">
                  Plus one-off domain charge of £{domainAmount.toFixed(2)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Direct Debit Info */}
        <Card className="bg-muted/30">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Banknote className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">UK Direct Debit</p>
                <p className="text-xs text-muted-foreground mt-1">
                  You'll be redirected to securely set up your Direct Debit mandate via GoCardless.
                  Payments are protected by the Direct Debit Guarantee.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Direct Debit Guarantee</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your payments are protected. You can cancel at any time and get an immediate refund
                  for any payments taken in error.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Button */}
        <Button
          size="lg"
          className="w-full gap-2"
          onClick={handleSetupDirectDebit}
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Setting up...
            </>
          ) : (
            <>
              Set Up Direct Debit
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </Button>

        {/* Skip option */}
        {onSkip && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={onSkip}
          >
            Skip for now (you can set up payment later)
          </Button>
        )}
      </div>

      <StepNavigation onBack={onBack} canProceed={false} />
    </OnboardingLayout>
  );
}
