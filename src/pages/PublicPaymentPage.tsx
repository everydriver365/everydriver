import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CardstreamCheckout } from "@/components/payments/CardstreamCheckout";
import { Loader2, CheckCircle2, PoundSterling, User, Mail } from "lucide-react";

interface InstructorInfo {
  id: string;
  name: string;
  profile_image_url: string | null;
  logo_url: string | null;
  brand_colour: string | null;
}

export default function PublicPaymentPage() {
  const { instructorId } = useParams<{ instructorId: string }>();
  const [instructor, setInstructor] = useState<InstructorInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const prefillAmount = searchParams.get("amount");
  const [amount, setAmount] = useState(() => {
    if (prefillAmount) {
      const parsed = parseFloat(prefillAmount);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 5000) return parsed.toString();
    }
    return "";
  });
  const [showCheckout, setShowCheckout] = useState(false);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    if (!instructorId) return;
    (async () => {
      const { data } = await supabase
        .from("public_instructors")
        .select("id, name, profile_image_url, logo_url, brand_colour")
        .eq("id", instructorId)
        .single();

      if (data) setInstructor(data);
      setLoading(false);
    })();
  }, [instructorId]);

  const parsedAmount = parseFloat(amount);
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount >= 1 && parsedAmount <= 5000;

  const handleContinue = () => {
    if (!isValidAmount) return;
    setShowCheckout(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!instructor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground">Instructor not found</h1>
          <p className="text-muted-foreground mt-2">This payment link may be invalid.</p>
        </div>
      </div>
    );
  }

  if (paid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground">Payment Successful</h1>
          <p className="text-muted-foreground mt-2">
            Your payment of £{parsedAmount.toFixed(2)} to {instructor.name} has been processed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Instructor branding */}
        <div className="text-center space-y-3">
          {instructor.logo_url || instructor.profile_image_url ? (
            <img
              src={instructor.logo_url || instructor.profile_image_url || ""}
              alt={instructor.name}
              className="h-24 w-auto max-w-[12rem] object-contain mx-auto"
            />
          ) : (
            <div
              className="h-24 w-24 rounded-full mx-auto flex items-center justify-center text-3xl font-bold text-white"
              style={{ backgroundColor: instructor.brand_colour || "hsl(var(--primary))" }}
            >
              {instructor.name.charAt(0)}
            </div>
          )}
          <h1 className="text-xl font-bold text-foreground">Pay {instructor.name}</h1>
        </div>

        {!showCheckout ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Amount to pay
              </label>
              <div className="relative">
                <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  min="1"
                  max="5000"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-9 text-lg h-12"
                  autoFocus
                />
              </div>
              {amount && !isValidAmount && (
                <p className="text-xs text-destructive mt-1">Enter an amount between £1 and £5,000</p>
              )}
            </div>

            <Button
              onClick={handleContinue}
              disabled={!isValidAmount}
              className="w-full h-12 text-base"
            >
              Continue to Payment
            </Button>
          </div>
        ) : (
          <CardstreamCheckout
            amount={parsedAmount}
            instructorId={instructorId}
            merchantIdForHPF=""
            onPaid={() => setPaid(true)}
          />
        )}

        <p className="text-xs text-center text-muted-foreground">
          Payments are processed securely via Elavon
        </p>
      </div>
    </div>
  );
}
