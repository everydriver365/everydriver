import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Phone, Loader2, User, ArrowRight, KeyRound, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { MainLayout } from "@/components/layout/MainLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

type LoginStep = "phone" | "otp";

export default function PupilLogin() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<LoginStep>("phone");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [pupilData, setPupilData] = useState<{ name: string; slug: string } | null>(null);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();

  // Check for remembered phone on mount
  useEffect(() => {
    const rememberedPhone = localStorage.getItem("pupil_remembered_phone");
    if (rememberedPhone) {
      setPhone(formatPhoneForDisplay(rememberedPhone));
      setRememberMe(true);
    }
  }, []);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const formatPhoneForDisplay = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 4) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneForDisplay(e.target.value);
    setPhone(formatted);
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    const cleanPhone = phone.replace(/\D/g, "");
    
    if (cleanPhone.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-pupil-otp", {
        body: { phone: cleanPhone },
      });

      if (error) throw error;

      if (data.error) {
        if (data.error === "Phone number not found") {
          toast.error("Phone number not found", {
            description: "Please check your number or contact your instructor",
          });
        } else {
          toast.error(data.error);
        }
        setLoading(false);
        return;
      }

      setPupilData({ name: data.pupilName, slug: data.instructorSlug });
      setStep("otp");
      setCountdown(60);
      toast.success(`Code sent to ${formatPhoneForDisplay(cleanPhone)}`);
    } catch (error) {
      console.error("Send OTP error:", error);
      toast.error("Something went wrong", {
        description: "Please try again or contact support",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setResending(true);
    await handleSendOtp();
    setResending(false);
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }

    const cleanPhone = phone.replace(/\D/g, "");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("verify-pupil-otp", {
        body: { phone: cleanPhone, code: otp },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        setLoading(false);
        return;
      }

      // Save to session/local storage
      sessionStorage.setItem("pupil_phone_verified", cleanPhone);
      
      if (rememberMe) {
        localStorage.setItem("pupil_remembered_phone", cleanPhone);
      } else {
        localStorage.removeItem("pupil_remembered_phone");
      }

      toast.success(`Welcome back, ${data.pupilName.split(" ")[0]}!`);
      navigate(`/p/${data.instructorSlug}`);
    } catch (error) {
      console.error("Verify OTP error:", error);
      toast.error("Something went wrong", {
        description: "Please try again",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep("phone");
    setOtp("");
    setPupilData(null);
  };

  return (
    <MainLayout>
      <div className="container flex min-h-[70vh] items-center justify-center py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="border-2">
            <CardHeader className="text-center pb-2">
              <div className="mb-2 mx-auto inline-block">
                <img src="/everydriver-logo-main.png" alt="EveryDriver" className="h-10 mx-auto" />
              </div>
              <CardTitle className="text-2xl">Pupil Login</CardTitle>
              <CardDescription>
                {step === "phone" 
                  ? "Enter the phone number registered with your instructor"
                  : `Enter the 6-digit code sent to ${phone}`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {step === "phone" ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-2">
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="tel"
                        placeholder="07XX XXX XXXX"
                        value={phone}
                        onChange={handlePhoneChange}
                        className="pl-10 text-lg h-12"
                        maxLength={14}
                        autoFocus
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      We'll send you a verification code via SMS
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    />
                    <label
                      htmlFor="remember"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Remember me on this device
                    </label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 text-base"
                    disabled={loading || phone.replace(/\D/g, "").length < 10}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending code...
                      </>
                    ) : (
                      <>
                        Send Verification Code
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <KeyRound className="h-8 w-8 text-primary" />
                    </div>
                    
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={(value) => setOtp(value)}
                      autoFocus
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>

                    <p className="text-sm text-muted-foreground text-center">
                      Didn't receive the code?{" "}
                      {countdown > 0 ? (
                        <span>Resend in {countdown}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={resending}
                          className="text-primary hover:underline font-medium"
                        >
                          {resending ? "Sending..." : "Resend code"}
                        </button>
                      )}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleBack}
                      className="flex-1"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button
                      onClick={handleVerifyOtp}
                      className="flex-1"
                      disabled={loading || otp.length !== 6}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Verify & Login"
                      )}
                    </Button>
                  </div>
                </div>
              )}

              <div className="mt-6 pt-6 border-t text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  Not registered yet?
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/courses")}
                >
                  <User className="mr-2 h-4 w-4" />
                  Book Your First Lesson
                </Button>
              </div>

              <p className="mt-6 text-center text-xs text-muted-foreground">
                Having trouble? Contact your instructor directly or email{" "}
                <a href="mailto:support@everydriver.co.uk" className="text-primary hover:underline">
                  support@everydriver.co.uk
                </a>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </MainLayout>
  );
}
