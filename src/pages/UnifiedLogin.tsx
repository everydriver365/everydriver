import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, Phone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { UnifiedMobileLoginCard } from "@/components/auth/UnifiedMobileLoginCard";
import { setRememberMe } from "@/lib/sessionPersistence";

const FONT = `Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;

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

  // Parent OTP — unchanged from previous behaviour.
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

  const handleSignIn = async (email: string, password: string, rememberMe: boolean) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    setRememberMe(rememberMe);
    navigate("/auth/redirect", { replace: true });
  };

  const handleForgot = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return { error: error.message };
  };

  const handleSendCode = async () => {
    setPError(null);
    if (!phone.trim()) { setPError("Enter your phone number"); return; }
    setPBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-parent-otp", {
        body: { phone: cleanUkPhone(phone) },
      });
      if (error) throw error;
      if (data?.error) { setPError(data.error); return; }
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
    if (otp.length !== 6) { setPError("Enter the 6-digit code"); return; }
    setPBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-parent-otp", {
        body: { phone: cleanUkPhone(phone), code: otp },
      });
      if (error) throw error;
      if (data?.error) { setPError(data.error); return; }
      const tokenHash: string | undefined = data?.token_hash;
      if (!tokenHash) throw new Error("Missing session token");
      const { error: verifyErr } = await supabase.auth.verifyOtp({
        token_hash: tokenHash, type: "magiclink",
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
    <div style={{ minHeight: "100dvh", background: "#F2F4F8", fontFamily: FONT }}>
      <div style={{ padding: "calc(env(safe-area-inset-top) + 20px) 16px 8px", display: "flex", justifyContent: "center" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            background: "#FFFFFF",
            border: "0.5px solid #E0E3EA",
            borderRadius: 10,
            padding: 4,
            width: "100%",
            maxWidth: 400,
          }}
        >
          {([{ id: "signin", label: "Sign in" }, { id: "parent", label: "Parent access" }] as const).map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                style={{
                  background: active ? "#1A1A1F" : "transparent",
                  color: active ? "#FFFFFF" : "#666",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: FONT,
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {tab === "signin" ? (
        <UnifiedMobileLoginCard
          portalName="Drive365"
          descriptor="For instructors and pupils"
          onSignIn={handleSignIn}
          onForgot={handleForgot}
          className=""
          googleSlot={
            <GoogleSignInButton
              redirectTo={`${window.location.origin}/auth/redirect`}
              className="w-full"
            />
          }
        />
      ) : (
        <ParentCard
          phone={phone}
          setPhone={setPhone}
          otp={otp}
          setOtp={setOtp}
          pStep={pStep}
          setPStep={setPStep}
          pBusy={pBusy}
          pError={pError}
          setPError={setPError}
          resendIn={resendIn}
          onSendCode={handleSendCode}
          onVerify={handleVerify}
        />
      )}
    </div>
  );
}

interface ParentCardProps {
  phone: string;
  setPhone: (v: string) => void;
  otp: string;
  setOtp: (v: string) => void;
  pStep: ParentStep;
  setPStep: (v: ParentStep) => void;
  pBusy: boolean;
  pError: string | null;
  setPError: (v: string | null) => void;
  resendIn: number;
  onSendCode: () => void;
  onVerify: () => void;
}

function ParentCard(props: ParentCardProps) {
  const { phone, setPhone, otp, setOtp, pStep, setPStep, pBusy, pError, resendIn, onSendCode, onVerify } = props;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px", minHeight: "calc(100dvh - 100px)" }}>
      <div style={{
        width: "100%", maxWidth: 400, background: "#FFFFFF",
        border: "0.5px solid #E0E3EA", borderRadius: 14, padding: 24,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)", fontFamily: FONT,
      }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <img src="/app-logo.png" alt="Drive365" style={{ width: 80, height: 80, borderRadius: 18, display: "block", margin: "0 auto 12px", objectFit: "contain" }} />
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1A1A1F", margin: 0 }}>Parent access</h1>
          <p style={{ fontSize: 12, color: "#AAA", margin: "4px 0 0" }}>For parents and guardians</p>
        </div>

        {pStep === "phone" ? (
          <>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#555", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.4px" }}>Phone number</label>
            <div style={{ position: "relative" }}>
              <Phone size={15} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#888" }} />
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="07XXX XXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSendCode()}
                style={{
                  width: "100%", background: "#F2F4F8", border: "1px solid #EAECEE",
                  borderRadius: 8, padding: "10px 10px 10px 32px", fontSize: 13,
                  fontFamily: FONT, color: "#1A1A1F", outline: "none", height: 42, boxSizing: "border-box",
                }}
              />
            </div>
            {pError && <p style={{ fontSize: 11, color: "#B91C1C", margin: "8px 0 0" }}>{pError}</p>}
            <button
              type="button"
              onClick={onSendCode}
              disabled={pBusy || !phone.trim()}
              style={{
                marginTop: 14, width: "100%", background: "#1A1A1F", color: "#FFF",
                border: "none", borderRadius: 10, padding: "11px 14px", fontSize: 13, fontWeight: 600,
                fontFamily: FONT, cursor: pBusy || !phone.trim() ? "not-allowed" : "pointer",
                opacity: pBusy || !phone.trim() ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {pBusy ? <Loader2 size={14} className="animate-spin" /> : null}
              {pBusy ? "Sending…" : "Send code"}
            </button>
            <p style={{ fontSize: 11, color: "#888", textAlign: "center", margin: "12px 0 0" }}>
              Your instructor will set up your access.
            </p>
          </>
        ) : (
          <>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#555", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.4px" }}>Verification code</label>
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
            <p style={{ fontSize: 11, color: "#888", textAlign: "center", margin: 0 }}>Sent to your phone</p>
            {pError && <p style={{ fontSize: 11, color: "#B91C1C", margin: "8px 0 0" }}>{pError}</p>}
            <button
              type="button"
              onClick={onVerify}
              disabled={pBusy || otp.length !== 6}
              style={{
                marginTop: 14, width: "100%", background: "#1A1A1F", color: "#FFF",
                border: "none", borderRadius: 10, padding: "11px 14px", fontSize: 13, fontWeight: 600,
                fontFamily: FONT, cursor: pBusy || otp.length !== 6 ? "not-allowed" : "pointer",
                opacity: pBusy || otp.length !== 6 ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {pBusy ? <Loader2 size={14} className="animate-spin" /> : null}
              {pBusy ? "Verifying…" : "Verify"}
            </button>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: 11, fontFamily: FONT }}>
              <button type="button" onClick={() => { setPStep("phone"); setOtp(""); }} style={{ background: "transparent", border: "none", color: "#888", cursor: "pointer", padding: 0 }}>Change number</button>
              <button type="button" onClick={onSendCode} disabled={resendIn > 0 || pBusy} style={{ background: "transparent", border: "none", color: resendIn > 0 ? "#AAA" : "#2952B3", cursor: resendIn > 0 ? "not-allowed" : "pointer", padding: 0, fontWeight: 600 }}>
                {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
