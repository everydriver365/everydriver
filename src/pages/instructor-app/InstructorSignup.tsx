import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { InstructorSaaSLayout } from "@/components/layout/InstructorSaaSLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { toast } from "sonner";
import { Loader2, CheckCircle, ArrowRight, AlertCircle, Play } from "lucide-react";
import { motion } from "framer-motion";
import { z } from "zod";
const transparentLogo = "/everydriver-logo-v2.png";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const benefits = [
  "Manage your diary and bookings",
  "Accept payments online",
  "Build your personal website",
  "Track pupil progress",
  "Get more pupils in your area",
];

export default function InstructorSignup() {
  const [searchParams] = useSearchParams();
  const selectedPlan = searchParams.get("plan") || "free";
  const promo = searchParams.get("promo");
  const isFirstMonthFree = promo === "first-month-free" && selectedPlan === "all_in";
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp } = useInstructorAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate input
    const validation = signupSchema.safeParse({ name, email, password, confirmPassword });
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    setLoading(true);
    
    try {
      const { error: signUpError } = await signUp(email, password, name);
      
      if (signUpError) {
        if (signUpError.message.includes("already registered")) {
          setError("An account with this email already exists. Please sign in.");
        } else {
          setError(signUpError.message);
        }
      } else {
        toast.success("Account created! Let's set up your profile.");
        navigate(`/instructor-app/onboarding?step=1&plan=${selectedPlan}${promo ? `&promo=${promo}` : ""}`);
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <InstructorSaaSLayout>
      <div className="container py-12 md:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Left Section - Video & Benefits */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="hidden lg:block"
          >
            {/* Logo & Header */}
            <div className="mb-6">
              <img 
                src={transparentLogo} 
                alt="EveryDriver" 
                className="h-10 mb-4"
              />
              <h2 className="text-2xl font-bold text-foreground">
                The smart platform for driving instructors
              </h2>
              <p className="text-muted-foreground mt-2">
                Join thousands of ADIs who've grown their business with EveryDriver
              </p>
            </div>

            {/* Explainer Video Placeholder */}
            <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 border border-border mb-8 aspect-video">
              <div className="absolute inset-0 flex items-center justify-center">
                <button className="flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 transition-transform">
                  <Play className="h-6 w-6 ml-1" />
                </button>
              </div>
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-sm font-medium text-foreground">
                  See how EveryDriver works
                </p>
                <p className="text-xs text-muted-foreground">
                  2 minute overview
                </p>
              </div>
              {/* Placeholder background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[length:20px_20px]" />
              </div>
            </div>

            {/* Benefits List */}
            <div className="space-y-3 mb-6">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-success/10">
                    <CheckCircle className="h-4 w-4 text-success" />
                  </div>
                  <span className="text-foreground">{benefit}</span>
                </motion.div>
              ))}
            </div>

            {/* Testimonial */}
            <div className="rounded-xl bg-secondary p-6">
              <p className="text-lg font-medium text-foreground mb-2">
                "EveryDriver has transformed how I run my business. I've doubled my bookings!"
              </p>
              <p className="text-sm text-muted-foreground">— Sarah M., ADI in Manchester</p>
            </div>
          </motion.div>

          {/* Signup Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-border">
              <CardHeader className="text-center pb-2">
                {isFirstMonthFree && (
                  <div className="mb-3 rounded-lg bg-success/10 border border-success/20 p-3">
                    <p className="text-sm font-semibold text-success">
                      🎉 First month free on the All-In plan!
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      £7.99/mo after your free trial — cancel anytime
                    </p>
                  </div>
                )}
                <CardTitle className="text-2xl">Create Your Account</CardTitle>
                <CardDescription>
                  {isFirstMonthFree
                    ? "Sign up now to claim your free month"
                    : "Start your free trial today — no credit card required"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Smith"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@example.com"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      disabled={loading}
                    />
                  </div>

                  <Button type="submit" className="w-full h-12 bg-emerald-500 text-white hover:bg-emerald-600" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        Get Started Free
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>

                  {/* Mobile Benefits */}
                  <div className="lg:hidden mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span>Free plan includes diary & 5 pupils</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span>Your own mini-website instantly</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span>Upgrade or cancel anytime</span>
                    </div>
                  </div>

                  <p className="text-center text-sm text-muted-foreground pt-2">
                    Already have an account?{" "}
                    <Link to="/instructor-app/login" className="text-primary hover:underline font-medium">
                      Log in
                    </Link>
                  </p>

                  <p className="text-center text-xs text-muted-foreground">
                    By signing up, you agree to our{" "}
                    <Link to="/terms" className="underline hover:text-foreground">Terms of Service</Link>
                    {" "}and{" "}
                    <Link to="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>
                  </p>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </InstructorSaaSLayout>
  );
}
