import { useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface PayInSafariButtonProps {
  amount: number;
  pupilId: string;
  pupilName: string;
  pupilEmail?: string | null;
  pupilPhone?: string | null;
  instructorId: string;
  instructorSlug: string;
  disabled?: boolean;
}

/**
 * Shown inside native wrappers (Despia / Capacitor WKWebView / Android WebView)
 * where Apple Pay's `ApplePaySession` JS API is not available.
 *
 * Generates a hosted Square checkout URL and opens it in the system browser
 * (real Safari on iOS) so Apple Pay can render natively. The pupil returns
 * to the app afterwards and balance updates via the existing webhook.
 */
export function PayInSafariButton({
  amount,
  pupilId,
  pupilName,
  pupilEmail,
  pupilPhone,
  instructorId,
  instructorSlug,
  disabled,
}: PayInSafariButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const baseUrl = window.location.origin;
      const orderReference = `pupil-${pupilId}-${Date.now()}`;
      const returnUrl = `${baseUrl}/i/${instructorSlug}?payment=success&amount=${amount}`;
      const cancelUrl = `${baseUrl}/i/${instructorSlug}?payment=cancelled`;

      const { data, error } = await supabase.functions.invoke("square-checkout", {
        body: {
          amount,
          orderReference,
          customerName: pupilName,
          customerEmail: pupilEmail || undefined,
          customerPhone: pupilPhone || undefined,
          description: "Lesson payment",
          returnUrl,
          cancelUrl,
          instructorId,
          pupilId,
        },
      });

      if (error) throw error;
      if (!data?.success || !data?.checkoutUrl) {
        throw new Error(data?.error || "Could not create payment link");
      }

      // window.open with _blank inside Despia / WKWebView hands the URL to
      // the system browser (Safari), where Apple Pay is available.
      window.open(data.checkoutUrl, "_blank");
    } catch (err) {
      console.error("PayInSafariButton error:", err);
      toast({
        title: "Couldn't open payment page",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <Button
        type="button"
        onClick={handleClick}
        disabled={disabled || loading || amount <= 0}
        className="w-full h-12 rounded-xl text-base font-semibold"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
        ) : (
          <ExternalLink className="h-5 w-5 mr-2" />
        )}
        Pay with Apple Pay / Card
      </Button>
      <p className="text-[11px] text-muted-foreground text-center px-2">
        Opens in Safari so you can use Apple Pay
      </p>
    </div>
  );
}
