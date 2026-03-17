import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, CreditCard, X } from "lucide-react";

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
 * then shows a "Redirecting…" state with cancel option before
 * auto-submitting a hidden form as a full-page POST.
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
  const [readyToRedirect, setReadyToRedirect] = useState(false);
  const pendingFormRef = useRef<HTMLFormElement | null>(null);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const amountLabel = `£${amount.toFixed(2)}`;

  const handleCancel = useCallback(() => {
    // Abort the pending redirect
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }
    if (pendingFormRef.current) {
      pendingFormRef.current.remove();
      pendingFormRef.current = null;
    }
    setReadyToRedirect(false);
    setSubmitting(false);
  }, []);

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

      // Build the form but don't submit yet — give user a chance to cancel
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
      pendingFormRef.current = form;
      setReadyToRedirect(true);

      // Auto-submit after a short delay so user can see the cancel option
      redirectTimerRef.current = setTimeout(() => {
        form.submit();
      }, 3500);
    } catch (e: any) {
      const msg = e?.message || "Payment failed";
      setSubmitting(false);
      setReadyToRedirect(false);
      onError?.(msg);
    }
  }, [amount, pupilId, instructorId, customerName, customerEmail, customerPhone, customerAddress, customerPostcode, description, onError]);

  const handleRedirectNow = useCallback(() => {
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }
    pendingFormRef.current?.submit();
  }, []);

  // Show cancel-able redirect state
  if (readyToRedirect) {
    return (
      <div className="w-full space-y-2">
        <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/50">
          <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
          <span className="text-sm text-foreground flex-1">Redirecting to secure payment…</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={handleCancel}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleRedirectNow}
        >
          Continue now
        </Button>
      </div>
    );
  }

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
          Loading secure payment…
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
