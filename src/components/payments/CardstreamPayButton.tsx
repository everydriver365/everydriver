import { useState, useRef, useCallback } from "react";
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
  className?: string;
  disabled?: boolean;
};

/**
 * CardstreamPayButton — HPP redirect-based payment.
 *
 * Calls `npi-checkout` edge function to get signed form data,
 * then auto-submits a hidden HTML form to Cardstream's Hosted Payment Page.
 * No jQuery, no iframes, no SDK — works everywhere.
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
  const formRef = useRef<HTMLFormElement>(null);

  const amountLabel = `£${amount.toFixed(2)}`;

  const handlePay = useCallback(async () => {
    try {
      setSubmitting(true);

      const orderRef = `ED-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const returnUrl = `${window.location.origin}/booking-confirmation?pupilId=${pupilId || ""}&npi=success`;
      const cancelUrl = window.location.href;

      const { data, error } = await supabase.functions.invoke("npi-checkout", {
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

      // Build hidden form and auto-submit to Cardstream HPP
      const form = formRef.current;
      if (!form) throw new Error("Form element not found");

      // Clear any existing inputs
      form.innerHTML = "";
      form.action = data.gatewayUrl;
      form.method = "POST";

      // Add all signed form fields as hidden inputs
      for (const [key, value] of Object.entries(data.formData as Record<string, string>)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
      }

      // Submit — redirects to Cardstream HPP
      form.submit();
    } catch (e: any) {
      const msg = e?.message || "Payment failed";
      setSubmitting(false);
      onError?.(msg);
    }
  }, [amount, pupilId, instructorId, customerName, customerEmail, customerPhone, customerAddress, customerPostcode, description, onError]);

  return (
    <div className="w-full">
      {/* Hidden form for HPP redirect */}
      <form ref={formRef} style={{ display: "none" }} />

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

      <p className="text-xs text-muted-foreground text-center mt-2">
        You'll be redirected to a secure payment page
      </p>
    </div>
  );
}
