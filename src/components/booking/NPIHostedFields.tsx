import { useState, useEffect, useRef } from "react";
import { CreditCard, Lock, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NPIHostedFieldsProps {
  amount: number;
  orderReference: string;
  customerEmail: string;
  customerName: string;
  returnUrl: string;
  instructorId: string;
  pupilId: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  brandColor?: string;
}

declare global {
  interface Window {
    hostedFields?: {
      create: (config: Record<string, unknown>) => Promise<{
        submit: () => Promise<void>;
        on: (event: string, callback: (data: unknown) => void) => void;
      }>;
    };
  }
}

export function NPIHostedFields({
  amount,
  orderReference,
  customerEmail,
  customerName,
  returnUrl,
  instructorId,
  pupilId,
  onSuccess,
  onError,
  brandColor = "#3b82f6",
}: NPIHostedFieldsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [cardValid, setCardValid] = useState(false);
  const [expiryValid, setExpiryValid] = useState(false);
  const [cvvValid, setCvvValid] = useState(false);
  const hostedFieldsRef = useRef<{ submit: () => Promise<void> } | null>(null);
  const sdkLoadedRef = useRef(false);

  useEffect(() => {
    initializeHostedFields();
    
    return () => {
      // Cleanup
      hostedFieldsRef.current = null;
    };
  }, []);

  const loadSDK = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (sdkLoadedRef.current && window.hostedFields) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://gateway.cardstream.com/sdk/web/v1/js/hostedfields.min.js";
      script.async = true;
      script.onload = () => {
        sdkLoadedRef.current = true;
        resolve();
      };
      script.onerror = () => reject(new Error("Failed to load payment SDK"));
      document.head.appendChild(script);
    });
  };

  const initializeHostedFields = async () => {
    try {
      setIsLoading(true);

      // Get hosted fields configuration from backend
      const { data, error } = await supabase.functions.invoke("npi-hosted-fields", {
        body: {
          amount,
          orderReference,
          customerEmail,
          customerName,
          returnUrl,
          instructorId,
          pupilId,
        },
      });

      if (error || !data?.success) {
        throw new Error(error?.message || "Failed to initialize payment form");
      }

      // Load the Cardstream SDK
      await loadSDK();

      if (!window.hostedFields) {
        throw new Error("Payment SDK not available");
      }

      // Create hosted fields instance
      const instance = await window.hostedFields.create({
        merchantID: data.merchantId,
        stylesheet: getCustomStyles(),
        fields: {
          cardNumber: {
            selector: "#card-number",
            placeholder: "1234 5678 9012 3456",
          },
          cardExpiryDate: {
            selector: "#card-expiry",
            placeholder: "MM/YY",
          },
          cardCVV: {
            selector: "#card-cvv",
            placeholder: "123",
          },
        },
        formData: data.formData,
      });

      // Listen for validation events
      instance.on("validity", (event: unknown) => {
        const e = event as { field: string; valid: boolean };
        if (e.field === "cardNumber") setCardValid(e.valid);
        if (e.field === "cardExpiryDate") setExpiryValid(e.valid);
        if (e.field === "cardCVV") setCvvValid(e.valid);
      });

      instance.on("ready", () => {
        setIsReady(true);
        setIsLoading(false);
      });

      hostedFieldsRef.current = instance;
    } catch (err) {
      console.error("Hosted Fields initialization error:", err);
      setIsLoading(false);
      onError?.(err instanceof Error ? err.message : "Payment initialization failed");
      toast.error("Could not load payment form. Please try another payment method.");
    }
  };

  const getCustomStyles = () => `
    input {
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 16px;
      padding: 12px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      width: 100%;
      box-sizing: border-box;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    input:focus {
      outline: none;
      border-color: ${brandColor};
      box-shadow: 0 0 0 3px ${brandColor}20;
    }
    input.valid {
      border-color: #22c55e;
    }
    input.invalid {
      border-color: #ef4444;
    }
    input::placeholder {
      color: #94a3b8;
    }
  `;

  const handleSubmit = async () => {
    if (!hostedFieldsRef.current || !isReady) {
      toast.error("Payment form not ready");
      return;
    }

    if (!cardValid || !expiryValid || !cvvValid) {
      toast.error("Please complete all card details correctly");
      return;
    }

    setIsSubmitting(true);
    try {
      await hostedFieldsRef.current.submit();
      onSuccess?.();
    } catch (err) {
      console.error("Payment submission error:", err);
      onError?.(err instanceof Error ? err.message : "Payment failed");
      toast.error("Payment failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = cardValid && expiryValid && cvvValid;

  return (
    <Card className="border-2" style={{ borderColor: brandColor }}>
      <CardContent className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" style={{ color: brandColor }} />
            <span className="font-semibold">Secure Card Payment</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            <span>256-bit SSL</span>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: brandColor }} />
            <p className="text-sm text-muted-foreground">Loading secure payment form...</p>
          </div>
        )}

        {/* Hosted Fields Container */}
        <div className={isLoading ? "hidden" : "space-y-4"}>
          {/* Card Number */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Card Number
              {cardValid && <CheckCircle className="h-4 w-4 text-green-500" />}
            </Label>
            <div id="card-number" className="min-h-[48px] rounded-lg border bg-background" />
          </div>

          {/* Expiry and CVV row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Expiry Date
                {expiryValid && <CheckCircle className="h-4 w-4 text-green-500" />}
              </Label>
              <div id="card-expiry" className="min-h-[48px] rounded-lg border bg-background" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                CVV
                {cvvValid && <CheckCircle className="h-4 w-4 text-green-500" />}
              </Label>
              <div id="card-cvv" className="min-h-[48px] rounded-lg border bg-background" />
            </div>
          </div>

          {/* Amount display */}
          <div className="flex items-center justify-between py-3 px-4 bg-muted/50 rounded-lg">
            <span className="text-sm text-muted-foreground">Amount to pay:</span>
            <span className="text-lg font-bold">£{amount.toFixed(2)}</span>
          </div>

          {/* Submit button */}
          <Button
            onClick={handleSubmit}
            disabled={!isReady || isSubmitting || !isFormValid}
            className="w-full h-12 text-base font-semibold"
            style={{ backgroundColor: brandColor }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Lock className="mr-2 h-5 w-5" />
                Pay £{amount.toFixed(2)}
              </>
            )}
          </Button>

          {/* Card logos */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <img src="https://cdn.jsdelivr.net/gh/lipis/flag-icons@6.6.6/flags/4x3/gb.svg" alt="UK" className="h-4 w-6 rounded" />
            <span className="text-xs text-muted-foreground">Visa, Mastercard, Amex accepted</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
