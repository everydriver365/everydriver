import { useState, useRef, FormEvent, useEffect } from "react";
import { CreditCard, Lock, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

export function NPIHostedFields({
  amount,
  orderReference,
  customerEmail,
  customerName,
  returnUrl,
  instructorId,
  pupilId,
  onError,
  brandColor = "#3b82f6",
}: NPIHostedFieldsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Record<string, string> | null>(null);
  const [gatewayUrl, setGatewayUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    initializePayment();
  }, []);

  const initializePayment = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fnError } = await supabase.functions.invoke("npi-checkout", {
        body: {
          amount,
          currency: "GBP",
          orderReference,
          customerEmail,
          customerName,
          description: `Course booking payment`,
          returnUrl,
          cancelUrl: window.location.href,
          instructorId,
          pupilId,
          formResponsive: true,
        },
      });

      if (fnError || !data?.success) {
        throw new Error(fnError?.message || "Failed to initialize payment");
      }

      setGatewayUrl(data.gatewayUrl);
      setFormData(data.formData);
      setIsLoading(false);
    } catch (err) {
      console.error("Payment initialization error:", err);
      const errorMessage = err instanceof Error ? err.message : "Payment initialization failed";
      setError(errorMessage);
      setIsLoading(false);
      onError?.(errorMessage);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formRef.current || !gatewayUrl || !formData) return;

    setIsSubmitting(true);
    
    // Submit the form - it will redirect to the payment page
    formRef.current.submit();
  };

  const handleOpenInNewTab = () => {
    if (!gatewayUrl || !formData) return;

    // Create a temporary form and submit it
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = gatewayUrl;
    form.target = '_blank';
    form.style.display = 'none';

    for (const [key, value] of Object.entries(formData)) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = String(value);
      form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
    
    toast.info("Payment page opened in new tab");
  };

  if (error) {
    return (
      <Card className="border-2 border-destructive/50">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-4 gap-3 text-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="text-sm text-destructive font-medium">{error}</p>
            <Button variant="outline" onClick={initializePayment}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

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
            <p className="text-sm text-muted-foreground">Preparing secure payment...</p>
          </div>
        )}

        {/* Payment options when ready */}
        {!isLoading && gatewayUrl && formData && (
          <div className="space-y-4">
            {/* Amount display */}
            <div className="flex items-center justify-between py-3 px-4 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">Amount to pay:</span>
              <span className="text-lg font-bold">£{amount.toFixed(2)}</span>
            </div>

            {/* Info text */}
            <p className="text-sm text-muted-foreground text-center">
              Click below to complete your payment securely via our payment partner.
            </p>

            {/* Hidden form for submission */}
            <form 
              ref={formRef}
              method="POST" 
              action={gatewayUrl}
              onSubmit={handleSubmit}
            >
              {Object.entries(formData).map(([key, value]) => (
                <input key={key} type="hidden" name={key} value={String(value)} />
              ))}

              {/* Submit button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 text-base font-semibold"
                style={{ backgroundColor: brandColor }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Redirecting...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-5 w-5" />
                    Pay £{amount.toFixed(2)} Securely
                  </>
                )}
              </Button>
            </form>

            {/* Alternative: open in new tab */}
            <Button
              variant="outline"
              onClick={handleOpenInNewTab}
              className="w-full"
              disabled={isSubmitting}
            >
              Open payment in new tab
            </Button>

            {/* Card logos */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <img 
                src="https://cdn.jsdelivr.net/gh/lipis/flag-icons@6.6.6/flags/4x3/gb.svg" 
                alt="UK" 
                className="h-4 w-6 rounded" 
              />
              <span className="text-xs text-muted-foreground">Visa, Mastercard, Amex accepted</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
