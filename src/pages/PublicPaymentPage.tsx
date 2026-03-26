import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SquarePaymentForm } from "@/components/payments/SquarePaymentForm";
import { SquareWalletButtons } from "@/components/payments/SquareWalletButtons";
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
  const pupilParam = searchParams.get("pupil");

  // Derive success directly from URL — no state dependency
  const isSuccess = searchParams.get("success") === "true";
  const transactionId = searchParams.get("transactionId");

  const [amount, setAmount] = useState(() => {
    if (prefillAmount) {
      const parsed = parseFloat(prefillAmount);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 5000) return parsed.toString();
    }
    return "";
  });
  const [payerName, setPayerName] = useState("");
  const [payerEmail, setPayerEmail] = useState("");
  const [pupilLinked, setPupilLinked] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paid, setPaid] = useState(false);

  const emailValid = !payerEmail || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payerEmail);

  useEffect(() => {
    if (!instructorId) return;
    (async () => {
      const { data } = await supabase
        .from("public_instructors")
        .select("id, name, profile_image_url, logo_url, brand_colour")
        .eq("id", instructorId)
        .single();

      if (data) setInstructor(data);

      // Fetch pupil info if pupil param present
      if (pupilParam && data) {
        const { data: pupilData } = await supabase.rpc("get_pupil_payment_info", {
          p_pupil_id: pupilParam,
          p_instructor_id: data.id,
        });
        if (pupilData && pupilData.length > 0) {
          setPayerName(pupilData[0].name || "");
          setPayerEmail(pupilData[0].email || "");
          setPupilLinked(true);
        }
      }

      setLoading(false);
    })();
  }, [instructorId, pupilParam]);

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
            {isValidAmount
              ? `Your payment of £${parsedAmount.toFixed(2)} to ${instructor.name} has been processed.`
              : `Your payment to ${instructor.name} has been processed.`}
          </p>
          <p className="text-xs text-muted-foreground mt-4">You can close this page.</p>
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
          <h1 className="text-xl font-bold text-foreground">
            Pay {instructor.name}
            {pupilLinked && payerName && (
              <span className="block text-base font-normal text-muted-foreground mt-1">
                for {payerName}
              </span>
            )}
          </h1>
        </div>

         {!showCheckout ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Your name {!pupilLinked && <span className="text-muted-foreground font-normal">(optional)</span>}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Full name"
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value.slice(0, 100))}
                  className="pl-9 h-12"
                  readOnly={pupilLinked}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Email address {!pupilLinked && <span className="text-muted-foreground font-normal">(optional)</span>}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={payerEmail}
                  onChange={(e) => setPayerEmail(e.target.value.slice(0, 255))}
                  className="pl-9 h-12"
                  readOnly={pupilLinked}
                />
              </div>
              {payerEmail && !emailValid && (
                <p className="text-xs text-destructive mt-1">Enter a valid email address</p>
              )}
            </div>

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
                />
              </div>
              {amount && !isValidAmount && (
                <p className="text-xs text-destructive mt-1">Enter an amount between £1 and £5,000</p>
              )}
            </div>

            <Button
              onClick={handleContinue}
              disabled={!isValidAmount || !emailValid}
              className="w-full h-12 text-base"
            >
              Continue to Payment
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <SquareWalletButtons
              amount={parsedAmount}
              instructorId={instructorId}
              pupilId={pupilParam || undefined}
              customerName={payerName.trim() || undefined}
              customerEmail={payerEmail.trim() || undefined}
              onPaid={() => setPaid(true)}
            />
            <SquarePaymentForm
              amount={parsedAmount}
              instructorId={instructorId}
              pupilId={pupilParam || undefined}
              customerName={payerName.trim() || undefined}
              customerEmail={payerEmail.trim() || undefined}
              onPaid={() => setPaid(true)}
            />
          </div>
        )}

        <p className="text-xs text-center text-muted-foreground">
          Payments are processed securely via Square
        </p>
      </div>
    </div>
  );
}
