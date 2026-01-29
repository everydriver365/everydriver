import { useState, useEffect } from "react";
import { OnboardingLayout } from "../components/OnboardingLayout";
import { StepNavigation } from "../components/StepNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  Shield, 
  CheckCircle2, 
  Loader2, 
  ExternalLink,
  Building2,
  Globe,
  ArrowRight,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
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
  const [initiating, setInitiating] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  useEffect(() => {
    if (data.selectedPlanId) {
      fetchPlanDetails();
    } else {
      setLoading(false);
    }
  }, [data.selectedPlanId]);

  // Check for return from GoCardless
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const billingRequestFlowId = urlParams.get("billing_request_flow_id");
    
    if (billingRequestFlowId) {
      handleGoCardlessReturn();
    }
  }, []);

  const fetchPlanDetails = async () => {
    try {
      const { data: planData, error } = await supabase
        .from("subscription_plans")
        .select("id, name, price_monthly")
        .eq("id", data.selectedPlanId)
        .single();

      if (error) throw error;
      setPlan(planData);
    } catch (error) {
      console.error("Error fetching plan:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoCardlessReturn = async () => {
    setCheckingStatus(true);
    try {
      // Check subscription status
      const { data: subscription, error } = await supabase
        .from("instructor_subscriptions")
        .select("status, gocardless_mandate_id")
        .eq("instructor_id", instructorId)
        .maybeSingle();

      if (error) throw error;

      if (subscription?.gocardless_mandate_id || subscription?.status === "active") {
        toast.success("Payment method set up successfully!");
        
        // Clear URL params
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Proceed to next step
        onNext();
      } else {
        toast.info("Setting up your payment method...");
        // Poll for a few seconds to wait for webhook
        setTimeout(() => {
          handleGoCardlessReturn();
        }, 2000);
      }
    } catch (error) {
      console.error("Error checking status:", error);
      toast.error("Could not verify payment setup. Please try again.");
    } finally {
      setCheckingStatus(false);
    }
  };

  const initiateGoCardlessSetup = async () => {
    if (!plan) return;

    setInitiating(true);
    try {
      // Parse domain if selected
      let domainName: string | undefined;
      let domainTld: string | undefined;
      let domainPrice: number | undefined;

      if (data.selectedDomain) {
        const domainParts = data.selectedDomain.match(/^(.+?)(\.co\.uk|\.uk|\.com|\.org|\.net|\.io)$/i);
        domainName = domainParts ? domainParts[1] : data.selectedDomain.split('.')[0];
        domainTld = domainParts ? domainParts[2] : '.' + data.selectedDomain.split('.').slice(1).join('.');
        domainPrice = 12.99; // Default domain price
      }

      const redirectUrl = `${window.location.origin}${window.location.pathname}?step=9`;

      const { data: result, error } = await supabase.functions.invoke(
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

      if (error) throw error;

      if (result?.authorisation_url) {
        // Redirect to GoCardless
        window.location.href = result.authorisation_url;
      } else {
        throw new Error("No authorisation URL received");
      }
    } catch (error) {
      console.error("Error initiating GoCardless:", error);
      toast.error("Failed to start payment setup. Please try again.");
      setInitiating(false);
    }
  };

  // Calculate totals
  const monthlyAmount = plan?.price_monthly || 0;
  const domainAmount = data.selectedDomain ? 12.99 : 0;
  const totalFirstPayment = monthlyAmount + domainAmount;

  if (loading) {
    return (
      <OnboardingLayout
        step={9}
        totalSteps={10}
        title="Loading..."
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </OnboardingLayout>
    );
  }

  if (checkingStatus) {
    return (
      <OnboardingLayout
        step={9}
        totalSteps={10}
        title="Verifying Payment Setup"
        description="Please wait while we confirm your payment method"
      >
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Confirming your Direct Debit setup...</p>
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
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Globe className="h-6 w-6 text-amber-600" />
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
      title="Set Up Payment"
      description="Secure Direct Debit via GoCardless"
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
              {/* Plan */}
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">{plan.name} Plan</p>
                  <p className="text-sm text-muted-foreground">Monthly subscription</p>
                </div>
                <p className="font-semibold">£{plan.price_monthly.toFixed(2)}/mo</p>
              </div>

              {/* Domain if selected */}
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

              {/* Total */}
              <div className="flex items-center justify-between pt-2">
                <p className="font-semibold">First Payment</p>
                <p className="text-xl font-bold text-primary">£{totalFirstPayment.toFixed(2)}</p>
              </div>

              <p className="text-xs text-muted-foreground">
                Then £{monthlyAmount.toFixed(2)}/month via Direct Debit
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security Info */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Secure Direct Debit</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Protected by the Direct Debit Guarantee. You can cancel anytime.
                  Powered by GoCardless, trusted by over 75,000 businesses worldwide.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bank Info Preview */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Building2 className="h-4 w-4" />
          <span>You'll be redirected to securely enter your bank details</span>
        </div>

        {/* Action Button */}
        <Button
          size="lg"
          className="w-full gap-2"
          onClick={initiateGoCardlessSetup}
          disabled={initiating}
        >
          {initiating ? (
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

        {/* Skip option for testing */}
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

      <StepNavigation
        onBack={onBack}
        canProceed={false}
      />
    </OnboardingLayout>
  );
}
