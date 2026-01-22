import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { InstructorSaaSLayout } from "@/components/layout/InstructorSaaSLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { toast } from "sonner";
import { Loader2, Car, AlertCircle, ArrowLeft, Fingerprint, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { z } from "zod";
import { Drive365InstallBanner } from "@/components/pwa/Drive365InstallBanner";

const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address").max(255),
  password: z.string().min(1, "Password is required").max(128),
});

// Extend Window interface for PasswordCredential
declare global {
  interface Window {
    PasswordCredential: {
      new(data: { id: string; password: string; name?: string }): Credential;
    };
  }
}

export default function InstructorLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const { signIn, resetPassword } = useInstructorAuth();
  const navigate = useNavigate();

  // Check if biometric login is available
  useEffect(() => {
    const checkBiometricAvailability = async () => {
      try {
        if ('credentials' in navigator && 'PasswordCredential' in window) {
          const hasSavedCredentials = localStorage.getItem('instructor-biometric-enabled');
          if (hasSavedCredentials) {
            setBiometricAvailable(true);
          }
        }
      } catch (err) {
        console.log('Biometric not available:', err);
      }
    };

    checkBiometricAvailability();
  }, []);

  // Handle biometric login (Face ID / Touch ID)
  const handleBiometricLogin = async () => {
    setBiometricLoading(true);
    setError("");
    
    try {
      const credential = await navigator.credentials.get({
        password: true,
        mediation: 'optional'
      } as CredentialRequestOptions);
      
      if (credential && 'password' in credential) {
        const passwordCredential = credential as any;
        const savedEmail = passwordCredential.id;
        const savedPassword = passwordCredential.password;
        
        if (savedEmail && savedPassword) {
          const { error: signInError } = await signIn(savedEmail, savedPassword);
          
          if (signInError) {
            setError("Biometric login failed. Please use email and password.");
          } else {
            toast.success("Welcome back!");
            navigate("/instructor");
          }
        }
      } else {
        setError("No saved credentials found. Please log in manually first.");
      }
    } catch (err) {
      console.error("Biometric login error:", err);
      setError("Biometric login not available. Please use email and password.");
    } finally {
      setBiometricLoading(false);
    }
  };

  // Save credentials for future biometric login
  const saveCredentialsForBiometric = async (emailToSave: string, passwordToSave: string) => {
    try {
      if ('credentials' in navigator && 'PasswordCredential' in window) {
        const PasswordCredentialClass = (window as any).PasswordCredential;
        const credential = new PasswordCredentialClass({
          id: emailToSave,
          password: passwordToSave,
          name: 'Drive365 Instructor'
        });
        await navigator.credentials.store(credential);
        localStorage.setItem('instructor-biometric-enabled', 'true');
        setBiometricAvailable(true);
      }
    } catch (err) {
      console.log('Could not save credentials:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isForgotPassword) {
      const emailValidation = z.string().trim().email().safeParse(email);
      if (!emailValidation.success) {
        setError("Please enter a valid email address");
        return;
      }
      
      setLoading(true);
      try {
        const { error: resetError } = await resetPassword(email.trim());
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

    const validation = loginSchema.safeParse({ email: email.trim(), password });
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    setLoading(true);
    
    try {
      const { error: signInError } = await signIn(email.trim(), password);
      
      if (signInError) {
        if (signInError.message.includes("Invalid login")) {
          setError("Invalid email or password");
        } else {
          setError(signInError.message);
        }
      } else {
        // Save credentials if remember me is checked
        if (rememberMe) {
          await saveCredentialsForBiometric(email.trim(), password);
        }
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
    <>
      <Drive365InstallBanner />
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

                  {/* Biometric Login Button */}
                  {biometricAvailable && !isForgotPassword && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-12 gap-2"
                      onClick={handleBiometricLogin}
                      disabled={biometricLoading}
                    >
                      {biometricLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Fingerprint className="h-5 w-5" />
                      )}
                      Sign in with Face ID / Touch ID
                    </Button>
                  )}

                  {biometricAvailable && !isForgotPassword && (
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">
                          Or continue with email
                        </span>
                      </div>
                    </div>
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
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          disabled={loading}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {!isForgotPassword && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="rememberMe"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      />
                      <Label 
                        htmlFor="rememberMe" 
                        className="text-sm font-normal cursor-pointer text-muted-foreground"
                      >
                        Remember me (enables Face ID / Touch ID)
                      </Label>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-emerald-500 text-white hover:bg-emerald-600"
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
    </>
  );
}
