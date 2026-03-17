import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
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
 * CardstreamPayButton — HPP embedded in an iframe.
 *
 * Calls `elavon-checkout` edge function to get signed form data,
 * then auto-submits a hidden HTML form targeting a named iframe.
 * The Cardstream HPP loads inside the iframe. After payment,
 * the callback redirects to our domain — we detect success by
 * reading the iframe URL on load.
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
  onSuccess,
  className,
  disabled,
}: Props) {
  const isMobile = useIsMobile();
  const [submitting, setSubmitting] = useState(false);
  const [showIframe, setShowIframe] = useState(false);
  const [formPayload, setFormPayload] = useState<{ gatewayUrl: string; formData: Record<string, string> } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const iframeLoadCountRef = useRef(0);

  const amountLabel = `£${amount.toFixed(2)}`;

  // Listen for iframe loads to detect when it redirects back to our domain
  const handleIframeLoad = useCallback(() => {
    iframeLoadCountRef.current += 1;
    
    // Skip the first load (blank) and second load (cardstream HPP)
    // The third+ load is when it redirects back to our domain
    if (iframeLoadCountRef.current < 2) return;

    try {
      const iframeUrl = iframeRef.current?.contentWindow?.location?.href;
      if (!iframeUrl) return;

      // Check if the iframe has navigated to our domain (same-origin or known domains)
      const url = new URL(iframeUrl);
      const isOurDomain = url.origin === window.location.origin ||
        url.hostname.includes('everydriver.lovable.app') ||
        url.hostname.includes('everydriver.co.uk') ||
        url.hostname.includes('drive365.co.uk');
      
      if (isOurDomain) {
        const params = url.searchParams;
        const isSuccess = params.get("npi") === "success" || params.get("payment") === "success";
        
        if (isSuccess) {
          setShowIframe(false);
          setSubmitting(false);
          onSuccess?.();
        } else {
          const errorMsg = params.get("responseMessage") || "Payment was not successful";
          setShowIframe(false);
          setSubmitting(false);
          onError?.(errorMsg);
        }
      }
    } catch {
      // Cross-origin error — iframe is still on Cardstream's domain, ignore
    }
  }, [onSuccess, onError]);

  // When iframe is shown and we have a payload, populate and submit the form
  useEffect(() => {
    if (!showIframe || !formPayload || !formRef.current) return;

    const form = formRef.current;
    form.innerHTML = "";
    form.action = formPayload.gatewayUrl;
    form.method = "POST";
    form.target = "cardstream-hpp-frame";

    for (const [key, value] of Object.entries(formPayload.formData)) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = value;
      form.appendChild(input);
    }

    form.submit();
    setFormPayload(null);
  }, [showIframe, formPayload]);

  const handlePay = useCallback(async () => {
    try {
      setSubmitting(true);
      iframeLoadCountRef.current = 0;

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

      // Store payload and show iframe — useEffect will handle form submission
      setFormPayload({
        gatewayUrl: data.gatewayUrl,
        formData: data.formData as Record<string, string>,
      });
      setShowIframe(true);
    } catch (e: any) {
      const msg = e?.message || "Payment failed";
      setSubmitting(false);
      setShowIframe(false);
      onError?.(msg);
    }
  }, [amount, pupilId, instructorId, customerName, customerEmail, customerPhone, customerAddress, customerPostcode, description, onError]);

  const handleCancel = useCallback(() => {
    setShowIframe(false);
    setSubmitting(false);
  }, []);

  if (showIframe) {
    return (
      <div className="w-full space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">Enter card details below</p>
          <Button variant="ghost" size="sm" onClick={handleCancel} className="h-7 px-2">
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        </div>
        <div className="w-full rounded-lg border border-border overflow-hidden bg-white">
          {/* Hidden form that POSTs into the iframe */}
          <form ref={formRef} style={{ display: "none" }} />
          <iframe
            ref={iframeRef}
            name="cardstream-hpp-frame"
            title="Secure Card Payment"
            onLoad={handleIframeLoad}
            className="w-full border-none"
            style={{ height: isMobile ? "240px" : "480px", minHeight: isMobile ? "200px" : "400px" }}
            sandbox="allow-forms allow-scripts allow-same-origin allow-top-navigation-by-user-activation"
          />
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Secured by Elavon — card details never touch our servers
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Hidden form for HPP — will be shown later */}
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

      <p className="text-xs text-muted-foreground text-center mt-2">
        Secure card payment via Elavon
      </p>
    </div>
  );
}
