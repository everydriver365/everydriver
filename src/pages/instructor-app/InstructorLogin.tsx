import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { InstructorSaaSLayout } from "@/components/layout/InstructorSaaSLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { toast } from "sonner";
import { Loader2, Car, AlertCircle, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function InstructorLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const { signIn, resetPassword } = useInstructorAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isForgotPassword) {
      if (!email) {
        setError("Please enter your email address");
        return;
      }
      
      setLoading(true);
      try {
        const { error: resetError } = await resetPassword(email);
        if (resetError) {
          setError(resetError.message);
        } else {
          toast.success("Password reset email sent! Check your inbox.");
          setIsForgotPassword(false);
        }
      } catch (err) {
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
      return;
    }

    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    setLoading(true);
    
    try {
      const { error: signInError } = await signIn(email, password);
      
      if (signInError) {
        if (signInError.message.includes("Invalid login")) {
          setError("Invalid email or password");
        } else {
          setError(signInError.message);
        }
      } else {
        toast.success("Welcome back!");
        navigate("/instructor");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <InstructorSaaSLayout>
      <div className="container flex min-h-[60vh] items-center justify-center py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="border-border">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Car className="h-6 w-6" />
              </div>
              <CardTitle className="text-2xl">
                {isForgotPassword ? "Reset Password" : "Welcome Back"}
              </CardTitle>
              <CardDescription>
                {isForgotPassword 
                  ? "Enter your email to receive a reset link"
                  : "Sign in to your Drive365 account"}
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
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                
                {!isForgotPassword && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                )}

                <Button 
                  type="submit" 
                  variant="accent"
                  className="w-full h-12"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isForgotPassword ? "Sending..." : "Signing in..."}
                    </>
                  ) : (
                    isForgotPassword ? "Send Reset Link" : "Sign In"
                  )}
                </Button>

                <div className="text-center text-sm text-muted-foreground space-y-2">
                  {isForgotPassword ? (
                    <button
                      type="button"
                      onClick={() => { setIsForgotPassword(false); setError(""); }}
                      className="inline-flex items-center text-primary hover:underline"
                    >
                      <ArrowLeft className="mr-1 h-3 w-3" />
                      Back to sign in
                    </button>
                  ) : (
                    <>
                      <div>
                        <button
                          type="button"
                          onClick={() => { setIsForgotPassword(true); setError(""); }}
                          className="text-primary hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div>
                        Don't have an account?{" "}
                        <Link to="/instructor-app/signup" className="text-primary hover:underline font-medium">
                          Sign up free
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </InstructorSaaSLayout>
  );
}
