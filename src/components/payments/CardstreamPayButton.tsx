import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, CreditCard } from "lucide-react";

type Props = {
  amount: number; // pounds
  pupilId?: string;
  instructorId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerPostcode?: string;
  description?: string;
  onError?: (msg: string) => void;
  onSuccess?: () => void;
  className?: string;
  disabled?: boolean;
};

/**
 * CardstreamPayButton — Full-page redirect to Cardstream HPP.
 *
 * Calls `elavon-checkout` edge function to get signed form data,
 * then auto-submits a hidden HTML form as a full-page POST.
 * The Cardstream HPP loads as a full page (mobile-friendly).
 * After payment, `payment-callback` redirects back to our domain.
 */
export function CardstreamPayButton({
  amount,
  pupilId,
  instructorId,
  customerName,
  customerEmail,
  customerPhone,
  customerAddress,
  customerPostcode,
  description,
  onError,
  className,
  disabled,
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const amountLabel = `£${amount.toFixed(2)}`;

  const handlePay = useCallback(async () => {
    try {
      setSubmitting(true);

      const orderRef = `ED-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const returnUrl = `${window.location.origin}/booking-confirmation?pupilId=${pupilId || ""}&npi=success`;
      const cancelUrl = window.location.href;

      const { data, error } = await supabase.functions.invoke("elavon-checkout", {
        body: {
          amount,
          currency: "GBP",
          orderReference: orderRef,
          customerEmail: customerEmail || "",
          customerName: customerName || "",
          customerPhone,
          customerAddress,
          customerPostcode,
          description: description || "Driving lesson payment",
          returnUrl,
          cancelUrl,
          instructorId,
          pupilId,
          formResponsive: true,
          merchantName: "EveryDriver",
        },
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Failed to create checkout session");

      // Create a form and submit it as a full-page redirect
      const form = document.createElement("form");
      form.method = "POST";
      form.action = data.gatewayUrl;
      form.style.display = "none";

      for (const [key, value] of Object.entries(data.formData as Record<string, string>)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
      }

      document.body.appendChild(form);
      form.submit();
      // Page will navigate away — no need to clean up
    } catch (e: any) {
      const msg = e?.message || "Payment failed";
      setSubmitting(false);
      onError?.(msg);
    }
  }, [amount, pupilId, instructorId, customerName, customerEmail, customerPhone, customerAddress, customerPostcode, description, onError]);

  return (
    <Button
      type="button"
      onClick={handlePay}
      disabled={disabled || submitting}
      className={className || "w-full h-12 text-base font-semibold"}
      size="lg"
    >
      {submitting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Redirecting to secure payment…
        </>
      ) : (
        <>
          <Lock className="mr-2 h-4 w-4" />
          <CreditCard className="mr-2 h-4 w-4" />
          Pay {amountLabel}
        </>
      )}
    </Button>
  );
}
