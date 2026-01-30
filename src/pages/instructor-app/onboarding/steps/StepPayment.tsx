import { useState, useEffect, useRef, useCallback } from "react";
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
  Lock
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

interface SquareConfig {
  appId: string;
  locationId: string;
  environment: string;
}

interface SquareCardInstance {
  attach: (selector: string) => Promise<void>;
  tokenize: () => Promise<{ status: string; token?: string; errors?: Array<{ message: string }> }>;
  destroy: () => void;
}

interface SquarePaymentsInstance {
  card: () => Promise<SquareCardInstance>;
}

// Use type assertion for Square SDK access
const getSquarePayments = async (appId: string, locationId: string): Promise<SquarePaymentsInstance> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sq = (window as any).Square;
  if (!sq) throw new Error("Square SDK not loaded");
  return sq.payments(appId, locationId) as Promise<SquarePaymentsInstance>;
};

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
  const [squareConfig, setSquareConfig] = useState<SquareConfig | null>(null);
  const [cardReady, setCardReady] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const cardRef = useRef<SquareCardInstance | null>(null);
  const cardContainerRef = useRef<HTMLDivElement>(null);

  // Fetch plan and Square config on mount
  useEffect(() => {
    const init = async () => {
      try {
        // Fetch plan details
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

        // Fetch Square config
        const { data: config, error: configError } = await supabase.functions.invoke(
          "square-wallet-config"
        );

        if (!configError && config?.appId) {
          setSquareConfig(config);
        } else {
          console.error("Failed to load Square config:", configError);
          setCardError("Payment system not configured");
        }
      } catch (err) {
        console.error("Init error:", err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [data.selectedPlanId]);

  // Load Square SDK and initialize card
  useEffect(() => {
    if (!squareConfig || !plan || plan.price_monthly === 0) return;

    const loadSquareSDK = async () => {
      // Check if SDK already loaded
      if (window.Square) {
        await initializeCard();
        return;
      }

      const script = document.createElement("script");
      script.src = squareConfig.environment === "production"
        ? "https://web.squarecdn.com/v1/square.js"
        : "https://sandbox.web.squarecdn.com/v1/square.js";
      script.async = true;
      
      script.onload = async () => {
        await initializeCard();
      };
      
      script.onerror = () => {
        setCardError("Failed to load payment form");
      };

      document.body.appendChild(script);
    };

    const initializeCard = async () => {
      try {
        if (!cardContainerRef.current || !squareConfig) return;
        
        // Clear any existing card
        if (cardRef.current) {
          cardRef.current.destroy();
          cardRef.current = null;
        }

        const payments = await getSquarePayments(
          squareConfig.appId,
          squareConfig.locationId
        );
        
        const card = await payments.card();
        await card.attach("#square-card-container");
        
        cardRef.current = card;
        setCardReady(true);
        setCardError(null);
      } catch (err) {
        console.error("Error initializing Square card:", err);
        setCardError("Failed to initialize payment form");
      }
    };

    loadSquareSDK();

    return () => {
      if (cardRef.current) {
        cardRef.current.destroy();
        cardRef.current = null;
      }
    };
  }, [squareConfig, plan]);

  const handleSubmit = useCallback(async () => {
    if (!cardRef.current || !plan) return;

    setSubmitting(true);
    setCardError(null);

    try {
      // Tokenize the card
      const result = await cardRef.current.tokenize();
      
      if (result.status !== "OK" || !result.token) {
        const errorMessage = result.errors?.[0]?.message || "Card validation failed";
        setCardError(errorMessage);
        setSubmitting(false);
        return;
      }

      // Get instructor email
      const { data: instructor } = await supabase
        .from("instructors")
        .select("email")
        .eq("id", instructorId)
        .single();

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

      // Call the subscription edge function
      const { data: subResult, error: subError } = await supabase.functions.invoke(
        "square-create-subscription",
        {
          body: {
            instructor_id: instructorId,
            plan_id: plan.id,
            card_nonce: result.token,
            instructor_name: data.name,
            instructor_email: instructor?.email || "",
            domain_name: domainName,
            domain_tld: domainTld,
            domain_price: domainPrice,
          },
        }
      );

      if (subError || !subResult?.success) {
        throw new Error(subResult?.error || subError?.message || "Subscription failed");
      }

      toast.success("Payment set up successfully!");
      onNext();
    } catch (err) {
      console.error("Payment error:", err);
      setCardError(err instanceof Error ? err.message : "Payment failed");
      toast.error("Failed to process payment");
    } finally {
      setSubmitting(false);
    }
  }, [plan, instructorId, data, onNext]);

  // Calculate totals
  const monthlyAmount = plan?.price_monthly || 0;
  const domainAmount = data.selectedDomain ? 12.99 : 0;
  const totalFirstPayment = monthlyAmount + domainAmount;

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
      title="Set Up Payment"
      description="Enter your card details to activate your subscription"
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
                Then £{monthlyAmount.toFixed(2)}/month
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card Input */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Card Details
            </h3>
            
            <div 
              id="square-card-container" 
              ref={cardContainerRef}
              className="min-h-[50px] p-3 border rounded-md bg-background"
            />
            
            {cardError && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{cardError}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Info */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Secure Payment</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your payment is processed securely by Square. Your card details are encrypted
                  and never stored on our servers. You can cancel your subscription anytime.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Button */}
        <Button
          size="lg"
          className="w-full gap-2"
          onClick={handleSubmit}
          disabled={!cardReady || submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Pay £{totalFirstPayment.toFixed(2)} & Continue
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

      <StepNavigation onBack={onBack} canProceed={false} />
    </OnboardingLayout>
  );
}
