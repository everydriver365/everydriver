import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Phone, Loader2, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MainLayout } from "@/components/layout/MainLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/logo-everydriver-transparent.png";

export default function PupilLogin() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const formatPhoneForDisplay = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "");
    
    // Format as UK phone number
    if (digits.length <= 4) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneForDisplay(e.target.value);
    setPhone(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanPhone = phone.replace(/\D/g, "");
    
    if (cleanPhone.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setLoading(true);

    try {
      // Search for pupil by phone number across all instructors
      const { data: pupils, error } = await supabase
        .from("pupils")
        .select(`
          id,
          name,
          phone,
          instructor:instructors!inner(
            id,
            app_slug,
            pupil_app_enabled
          )
        `)
        .or(`phone.ilike.%${cleanPhone}%,phone.ilike.%${cleanPhone.slice(-10)}%`)
        .limit(1);

      if (error) throw error;

      if (!pupils || pupils.length === 0) {
        toast.error("Phone number not found", {
          description: "Please check your number or contact your instructor",
        });
        setLoading(false);
        return;
      }

      const pupil = pupils[0] as any;
      const instructor = Array.isArray(pupil.instructor) 
        ? pupil.instructor[0] 
        : pupil.instructor;

      if (!instructor?.pupil_app_enabled || !instructor?.app_slug) {
        toast.error("Portal not available", {
          description: "Your instructor hasn't enabled the pupil portal yet",
        });
        setLoading(false);
        return;
      }

      // Store phone in sessionStorage for auto-login on branded portal
      sessionStorage.setItem("pupil_phone_verified", cleanPhone);
      
      toast.success(`Welcome back, ${pupil.name.split(" ")[0]}!`);
      navigate(`/p/${instructor.app_slug}`);
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Something went wrong", {
        description: "Please try again or contact support",
      });
    } finally {
      setLoading(false);
    }
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
              <div className="mx-auto mb-4">
                <img src={logo} alt="EveryDriver" className="h-12 mx-auto" />
              </div>
              <CardTitle className="text-2xl">Pupil Login</CardTitle>
              <CardDescription>
                Enter the phone number registered with your instructor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                    This is the phone number you gave your driving instructor
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base"
                  disabled={loading || phone.replace(/\D/g, "").length < 10}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Finding your portal...
                    </>
                  ) : (
                    <>
                      Access My Portal
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

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
