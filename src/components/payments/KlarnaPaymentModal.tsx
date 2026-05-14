import { useEffect, useRef, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface KlarnaPaymentsAPI {
  init: (config: { client_token: string }) => void;
  load: (
    config: { container: string; payment_method_category: string },
    callback: (res: { show_form: boolean; error?: any }) => void
  ) => void;
  authorize: (
    config: { payment_method_category: string },
    data: Record<string, any>,
    callback: (res: { approved: boolean; authorization_token?: string; show_form?: boolean; error?: any }) => void
  ) => void;
}

function getKlarnaPayments(): KlarnaPaymentsAPI | null {
  return (window as any).Klarna?.Payments ?? null;
}

interface KlarnaPaymentModalProps {
  open: boolean;
  onClose: () => void;
  amount: number;
  merchantReference: string;
  orderDescription: string;
  onSuccess: (orderId: string) => void;
  consumer: {
    givenName: string;
    familyName: string;
    email: string;
    phone: string;
  };
  billing: {
    streetAddress: string;
    postalCode: string;
    city: string;
    country: string;
  };
  pupilId?: string | null;
  instructorId?: string | null;
}

export function KlarnaPaymentModal({
  open,
  onClose,
  amount,
  merchantReference,
  orderDescription,
  onSuccess,
  consumer,
  billing,
  pupilId,
  instructorId,
}: KlarnaPaymentModalProps) {
  const [loading, setLoading] = useState(true);
  const [authorizing, setAuthorizing] = useState(false);
  const [formReady, setFormReady] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const initRef = useRef(false);

  // Load Klarna SDK script
  useEffect(() => {
    if (!open) return;
    if (document.getElementById("klarna-payments-sdk")) {
      setSdkLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "klarna-payments-sdk";
    script.src = "https://x.klarnacdn.net/kp/lib/v1/api.js";
    script.async = true;
    script.onload = () => setSdkLoaded(true);
    script.onerror = () => {
      toast.error("Failed to load Klarna. Please try again.");
      onClose();
    };
    document.head.appendChild(script);
  }, [open, onClose]);

  // Create session and init widget
  useEffect(() => {
    if (!open || !sdkLoaded || initRef.current) return;
    initRef.current = true;

    const initKlarna = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("klarna-session", {
          body: {
            amount,
            currency: "GBP",
            merchantReference,
            orderDescription,
            consumer,
          },
        });

        if (error || !data?.client_token) {
          console.error("Klarna session error:", error, data);
          toast.error("Failed to initialize Klarna. Please try another payment method.");
          onClose();
          return;
        }

        getKlarnaPayments()!.init({ client_token: data.client_token });

        // Small delay to ensure container is rendered
        setTimeout(() => {
          getKlarnaPayments()!.load(
            { container: "#klarna-payments-container", payment_method_category: "pay_over_time" },
            (res) => {
              setLoading(false);
              if (res.show_form) {
                setFormReady(true);
              } else if (res.error) {
                console.error("Klarna load error:", res.error);
                // Try pay_later as fallback
                getKlarnaPayments()!.load(
                  { container: "#klarna-payments-container", payment_method_category: "pay_later" },
                  (res2) => {
                    if (res2.show_form) {
                      setFormReady(true);
                    } else {
                      toast.error("Klarna is not available for this purchase. Please try another payment method.");
                      onClose();
                    }
                  }
                );
              }
            }
          );
        }, 300);
      } catch (err) {
        console.error("Klarna init error:", err);
        toast.error("Something went wrong with Klarna.");
        onClose();
      }
    };

    initKlarna();
  }, [open, sdkLoaded, amount, merchantReference, orderDescription, consumer, onClose]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      initRef.current = false;
      setFormReady(false);
      setLoading(true);
      setSdkLoaded(!!document.getElementById("klarna-payments-sdk"));
    }
  }, [open]);

  const handleAuthorize = useCallback(() => {
    const kp = getKlarnaPayments();
    if (!kp || authorizing) return;
    setAuthorizing(true);

    const amountInMinor = Math.round(amount * 100);

    kp.authorize(
      { payment_method_category: "pay_over_time" },
      {
        purchase_country: "GB",
        purchase_currency: "GBP",
        locale: "en-GB",
        order_amount: amountInMinor,
        order_tax_amount: 0,
        order_lines: [
          {
            type: "digital",
            reference: merchantReference,
            name: orderDescription.substring(0, 255),
            quantity: 1,
            unit_price: amountInMinor,
            total_amount: amountInMinor,
            tax_rate: 0,
            total_tax_amount: 0,
          },
        ],
        billing_address: {
          given_name: consumer.givenName,
          family_name: consumer.familyName,
          email: consumer.email,
          phone: consumer.phone,
          street_address: billing.streetAddress,
          postal_code: billing.postalCode,
          city: billing.city,
          country: billing.country,
        },
      },
      async (res) => {
        if (res.approved && res.authorization_token) {
          try {
            const { data, error } = await supabase.functions.invoke("klarna-order", {
              body: {
                authorization_token: res.authorization_token,
                order_amount: amountInMinor,
                order_lines: [
                  {
                    type: "digital",
                    reference: merchantReference,
                    name: orderDescription.substring(0, 255),
                    quantity: 1,
                    unit_price: amountInMinor,
                    total_amount: amountInMinor,
                    tax_rate: 0,
                    total_tax_amount: 0,
                  },
                ],
                merchant_reference: merchantReference,
                purchase_country: "GB",
                purchase_currency: "GBP",
                instructorId: instructorId ?? undefined,
                pupilId: pupilId ?? undefined,
                bookingRef: merchantReference,
              },
            });

            if (error || !data?.success) {
              console.error("Klarna order error:", error, data);
              toast.error(data?.error || "Failed to complete Klarna payment.");
              setAuthorizing(false);
              return;
            }

            toast.success("Klarna payment approved!");
            onSuccess(data.order_id);
          } catch (err) {
            console.error("Klarna order error:", err);
            toast.error("Failed to complete payment. Please try again.");
            setAuthorizing(false);
          }
        } else {
          if (res.show_form === false) {
            toast.error("Klarna payment was declined. Please try another payment method.");
            onClose();
          }
          setAuthorizing(false);
        }
      }
    );
  }, [amount, merchantReference, orderDescription, consumer, billing, onSuccess, onClose, authorizing]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="rounded bg-[#ffb3c7] px-2 py-0.5 text-sm font-bold text-black">
              Klarna.
            </span>
            Pay in 3 interest-free instalments
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#FFB3C7]" />
            <span className="ml-3 text-sm text-muted-foreground">Loading Klarna...</span>
          </div>
        )}

        <div
          id="klarna-payments-container"
          className={loading ? "h-0 overflow-hidden" : "min-h-[200px]"}
        />

        {formReady && !authorizing && (
          <Button
            onClick={handleAuthorize}
            className="w-full bg-[#FFB3C7] hover:bg-[#ff9ab5] text-black font-semibold py-3"
          >
            Complete Purchase — £{amount.toFixed(2)}
          </Button>
        )}

        {authorizing && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-[#FFB3C7]" />
            <span className="ml-2 text-sm">Processing payment...</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
