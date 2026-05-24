import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, Eye, EyeOff, Mail, Lock, Phone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const FONT = `Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
const BG = "#F2F4F8";
const CARD_BG = "#FFFFFF";
const BORDER = "0.5px solid #E0E3EA";
const RADIUS = 14;
const INPUT_RADIUS = 10;
const PRIMARY = "#1A1A1F";
const MUTED = "#6B7280";
const TEXT = "#111827";
const ERROR = "#B91C1C";

function cleanUkPhone(phone: string): string {
  let c = phone.replace(/\s+/g, "").replace(/[^0-9+]/g, "");
  if (c.startsWith("0")) c = "+44" + c.substring(1);
  else if (!c.startsWith("+")) c = "+44" + c;
  return c;
}

type Tab = "signin" | "parent";
type ParentStep = "phone" | "otp";

export default function UnifiedLogin() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [tab, setTab] = useState<Tab>(params.get("tab") === "parent" ? "parent" : "signin");

  // Sign-in state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [signinError, setSigninError] = useState<string | null>(null);

  // Parent state
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [pStep, setPStep] = useState<ParentStep>("phone");
  const [pBusy, setPBusy] = useState(false);
  const [pError, setPError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (pStep !== "otp") return;
    setResendIn(30);
    const t = setInterval(() => setResendIn((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [pStep]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigninError(null);
    if (!email.trim() || !password) {
      setSigninError("Enter your email and password");
      return;
    }
    setSigningIn(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        setSigninError(error.message);
        toast.error(error.message);
        return;
      }
      navigate("/auth/redirect", { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign-in failed";
      setSigninError(msg);
      toast.error(msg);
    } finally {
      setSigningIn(false);
    }
  };

  const handleForgot = async () => {
    if (!email.trim()) {
      toast.error("Enter your email first");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Password reset email sent");
  };

  const handleSendCode = async () => {
    setPError(null);
    if (!phone.trim()) {
      setPError("Enter your phone number");
      return;
    }
    setPBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-parent-otp", {
        body: { phone: cleanUkPhone(phone) },
      });
      if (error) throw error;
      if (data?.error) {
        setPError(data.error);
        return;
      }
      setPStep("otp");
      toast.success("Verification code sent");
    } catch (err) {
      setPError(err instanceof Error ? err.message : "Could not send code");
    } finally {
      setPBusy(false);
    }
  };

  const handleVerify = async () => {
    setPError(null);
    if (otp.length !== 6) {
      setPError("Enter the 6-digit code");
      return;
    }
    setPBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-parent-otp", {
        body: { phone: cleanUkPhone(phone), code: otp },
      });
      if (error) throw error;
      if (data?.error) {
        setPError(data.error);
        return;
      }
      const tokenHash: string | undefined = data?.token_hash;
      if (!tokenHash) throw new Error("Missing session token");

      const { error: verifyErr } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "magiclink",
      });
      if (verifyErr) throw verifyErr;

      navigate("/auth/redirect", { replace: true });
    } catch (err) {
      setPError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setPBusy(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: BG,
        fontFamily: FONT,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: CARD_BG,
          borderRadius: RADIUS,
          border: BORDER,
          padding: 28,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: TEXT, margin: 0, letterSpacing: -0.3 }}>
            Drive365
          </h1>
          <p style={{ fontSize: 13, color: MUTED, margin: "4px 0 0" }}>Sign in to your account</p>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            background: "#F1F3F7",
            borderRadius: 10,
            padding: 4,
            marginBottom: 22,
          }}
        >
          {(
            [
              { id: "signin", label: "Sign in" },
              { id: "parent", label: "Parent access" },
            ] as { id: Tab; label: string }[]
          ).map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                style={{
                  background: active ? "#FFFFFF" : "transparent",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 13,
                  fontWeight: 600,
                  color: active ? TEXT : MUTED,
                  boxShadow: active ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                  cursor: "pointer",
                  fontFamily: FONT,
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {tab === "signin" ? (
          <form onSubmit={handleSignIn} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={labelStyle}>Email</label>
              <div style={{ position: "relative" }}>
                <Mail size={16} style={iconStyle} />
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={inputStyle}
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Password</label>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={iconStyle} />
                <input
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ ...inputStyle, paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    color: MUTED,
                    cursor: "pointer",
                    padding: 4,
                  }}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {signinError && <p style={errorStyle}>{signinError}</p>}

            <button type="submit" disabled={signingIn} style={primaryBtnStyle(signingIn)}>
              {signingIn ? <Loader2 size={16} className="animate-spin" /> : "Sign in"}
            </button>

            <button
              type="button"
              onClick={handleForgot}
              style={{
                background: "transparent",
                border: "none",
                color: MUTED,
                fontSize: 12,
                cursor: "pointer",
                textAlign: "center",
                padding: 0,
                fontFamily: FONT,
              }}
            >
              Forgot password?
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "4px 0" }}>
              <div style={{ flex: 1, height: 1, background: "#E0E3EA" }} />
              <span style={{ fontSize: 11, color: MUTED }}>OR</span>
              <div style={{ flex: 1, height: 1, background: "#E0E3EA" }} />
            </div>

            <GoogleSignInButton
              redirectTo={`${window.location.origin}/auth/redirect`}
              className="w-full"
            />
          </form>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {pStep === "phone" ? (
              <>
                <div>
                  <label style={labelStyle}>Phone number</label>
                  <div style={{ position: "relative" }}>
                    <Phone size={16} style={iconStyle} />
                    <input
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="07XXX XXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendCode()}
                      style={inputStyle}
                    />
                  </div>
                </div>

                {pError && <p style={errorStyle}>{pError}</p>}

                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={pBusy || !phone.trim()}
                  style={primaryBtnStyle(pBusy || !phone.trim())}
                >
                  {pBusy ? <Loader2 size={16} className="animate-spin" /> : "Send code"}
                </button>

                <p style={{ fontSize: 12, color: MUTED, textAlign: "center", margin: 0 }}>
                  Your instructor will set up your access.
                </p>
              </>
            ) : (
              <>
                <div>
                  <label style={labelStyle}>Verification code</label>
                  <div style={{ display: "flex", justifyContent: "center", margin: "6px 0" }}>
                    <InputOTP value={otp} onChange={(v) => setOtp(v)} maxLength={6}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <p style={{ fontSize: 12, color: MUTED, textAlign: "center", margin: 0 }}>
                    Sent to {cleanUkPhone(phone)}
                  </p>
                </div>

                {pError && <p style={errorStyle}>{pError}</p>}

                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={pBusy || otp.length !== 6}
                  style={primaryBtnStyle(pBusy || otp.length !== 6)}
                >
                  {pBusy ? <Loader2 size={16} className="animate-spin" /> : "Verify"}
                </button>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setPStep("phone");
                      setOtp("");
                      setPError(null);
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: MUTED,
                      cursor: "pointer",
                      padding: 0,
                      fontFamily: FONT,
                    }}
                  >
                    Change number
                  </button>
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={resendIn > 0 || pBusy}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: resendIn > 0 ? MUTED : PRIMARY,
                      cursor: resendIn > 0 ? "not-allowed" : "pointer",
                      padding: 0,
                      fontFamily: FONT,
                      fontWeight: 600,
                    }}
                  >
                    {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: TEXT,
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 44,
  padding: "0 12px 0 38px",
  border: "0.5px solid #E0E3EA",
  borderRadius: INPUT_RADIUS,
  fontSize: 14,
  color: TEXT,
  background: "#FFFFFF",
  outline: "none",
  fontFamily: FONT,
  boxSizing: "border-box",
};

const iconStyle: React.CSSProperties = {
  position: "absolute",
  left: 12,
  top: "50%",
  transform: "translateY(-50%)",
  color: MUTED,
  pointerEvents: "none",
};

const errorStyle: React.CSSProperties = {
  fontSize: 12,
  color: ERROR,
  margin: 0,
};

function primaryBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    width: "100%",
    height: 44,
    background: PRIMARY,
    color: "#FFFFFF",
    border: "none",
    borderRadius: INPUT_RADIUS,
    fontSize: 14,
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontFamily: FONT,
  };
}
