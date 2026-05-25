/**
 * DsmBlueMobileLogin
 *
 * Mobile-only login surface for the DSM Instructor Portal.
 * Visual only — auth/forgot logic is delegated to parent via callbacks.
 * Uses the existing DSM logo asset.
 */
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import {
  isBiometricAvailable,
  getBiometricCredentials,
  saveBiometricCredentials,
  type BiometricScope,
} from "@/lib/biometricAuth";
import dsmLogo from "@/assets/dsm-logo.png";

type AsyncResult = { error?: string } | void;

interface Props {
  biometricScope?: BiometricScope;
  onSignIn: (email: string, password: string, rememberMe: boolean) => Promise<AsyncResult>;
  onForgot: (email: string) => Promise<AsyncResult>;
  className?: string;
  footer?: ReactNode;
}

const BG = "#0070C0";
const ICON = "#93C5FD";

export function DsmBlueMobileLogin({
  biometricScope,
  onSignIn,
  onForgot,
  className = "md:hidden",
  footer,
}: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioBusy, setBioBusy] = useState(false);

  useEffect(() => {
    if (!biometricScope) return;
    let cancelled = false;
    (async () => {
      const ok = await isBiometricAvailable(biometricScope);
      if (!cancelled) setBioAvailable(ok);
    })();
    return () => {
      cancelled = true;
    };
  }, [biometricScope]);

  const switchView = (toForgot: boolean) => {
    setError(null);
    setPassword("");
    setIsForgot(toForgot);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError(isForgot ? "Enter your email address" : "Enter your email and password");
      return;
    }
    if (!isForgot && !password) {
      setError("Enter your email and password");
      return;
    }
    setLoading(true);
    try {
      if (isForgot) {
        const result = await onForgot(email.trim());
        const err = result && "error" in result ? result.error : undefined;
        if (err) setError(err);
        else {
          toast.success("Check your email for a reset link");
          setIsForgot(false);
        }
      } else {
        const result = await onSignIn(email.trim(), password, rememberMe);
        const err = result && "error" in result ? result.error : undefined;
        if (err) setError(err);
        else if (biometricScope) {
          try {
            await saveBiometricCredentials(biometricScope, email.trim(), password);
            setBioAvailable(true);
          } catch {
            /* best effort */
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleBiometric = async () => {
    if (!biometricScope || bioBusy) return;
    setBioBusy(true);
    setError(null);
    try {
      const creds = await getBiometricCredentials(biometricScope, "Sign in to DSM");
      if (!creds?.email || !creds?.password) {
        setError("No saved sign-in found. Sign in with your password once to enable.");
        return;
      }
      setEmail(creds.email);
      const result = await onSignIn(creds.email, creds.password, true);
      const err = result && "error" in result ? result.error : undefined;
      if (err) setError(err);
    } catch {
      /* silent */
    } finally {
      setBioBusy(false);
    }
  };

  const labelStyle: React.CSSProperties = {
    color: "rgba(255,255,255,0.8)",
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "1px",
    marginBottom: 5,
    display: "block",
  };

  const inputWrap: React.CSSProperties = {
    position: "relative",
    background: "#FFFFFF",
    borderRadius: 12,
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    display: "flex",
    alignItems: "center",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "transparent",
    border: "none",
    outline: "none",
    padding: "14px 16px 14px 40px",
    fontSize: 13,
    color: "#111827",
    borderRadius: 12,
  };

  return (
    <div
      className={className}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 40,
        backgroundColor: BG,
        overflowY: "auto",
        paddingTop: "calc(env(safe-area-inset-top) + 52px)",
        paddingLeft: 24,
        paddingRight: 24,
        paddingBottom: "env(safe-area-inset-bottom)",
        minHeight: "100dvh",
      }}
    >
      {/* Hero */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
          paddingBottom: 28,
        }}
      >
        <img
          src={dsmLogo}
          alt="DSM"
          style={{
            height: 64,
            width: "auto",
            objectFit: "contain",
            filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.18))",
          }}
        />

        <h1
          style={{
            color: "#FFFFFF",
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: "-0.5px",
            margin: 0,
            textAlign: "center",
          }}
        >
          {isForgot ? "Reset password" : "Welcome back"}
        </h1>

        <span
          style={{
            background: "rgba(255,255,255,0.15)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "#FFFFFF",
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            padding: "4px 12px",
            borderRadius: 20,
          }}
        >
          DSM Instructor Portal
        </span>

        <p
          style={{
            color: "rgba(255,255,255,0.6)",
            fontSize: 12,
            textAlign: "center",
            lineHeight: 1.5,
            maxWidth: 220,
            margin: 0,
          }}
        >
          {isForgot
            ? "Enter your email and we'll send you a reset link."
            : "Sign in to your DSM instructor portal"}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        <div>
          <label style={labelStyle}>Email Address</label>
          <div style={inputWrap}>
            <Mail size={14} color={ICON} style={{ position: "absolute", left: 16 }} />
            <input
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        {!isForgot && (
          <div>
            <label style={labelStyle}>Password</label>
            <div style={inputWrap}>
              <Lock size={14} color={ICON} style={{ position: "absolute", left: 16 }} />
              <input
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ ...inputStyle, paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? "Hide password" : "Show password"}
                style={{
                  position: "absolute",
                  right: 12,
                  background: "transparent",
                  border: "none",
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                {showPw ? <EyeOff size={14} color={ICON} /> : <Eye size={14} color={ICON} />}
              </button>
            </div>
          </div>
        )}

        {!isForgot && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 4,
              marginBottom: 4,
            }}
          >
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <button
                type="button"
                role="switch"
                aria-checked={rememberMe}
                onClick={() => setRememberMe((v) => !v)}
                style={{
                  width: 36,
                  height: 20,
                  background: rememberMe ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.25)",
                  borderRadius: 20,
                  border: "none",
                  position: "relative",
                  padding: 0,
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: 2,
                    left: rememberMe ? 18 : 2,
                    width: 16,
                    height: 16,
                    background: "#FFFFFF",
                    borderRadius: "50%",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                    transition: "left 0.15s",
                  }}
                />
              </button>
              <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>Remember Me</span>
            </label>

            <button
              type="button"
              onClick={() => switchView(true)}
              style={{
                background: "transparent",
                border: "none",
                color: "#FFFFFF",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                padding: 0,
              }}
            >
              Forgot Password?
            </button>
          </div>
        )}

        {error && (
          <div
            style={{
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: 10,
              padding: "10px 12px",
              color: "#FFFFFF",
              fontSize: 12,
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            background: "#FFFFFF",
            color: BG,
            border: "none",
            borderRadius: 14,
            padding: 14,
            fontSize: 15,
            fontWeight: 800,
            boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            cursor: loading ? "not-allowed" : "pointer",
            marginTop: 4,
          }}
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              {isForgot ? "Send reset link" : "Sign In"}
              {!isForgot && <ArrowRight size={16} />}
            </>
          )}
        </button>

        {isForgot && (
          <button
            type="button"
            onClick={() => switchView(false)}
            style={{
              background: "transparent",
              border: "none",
              color: "#FFFFFF",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              marginTop: 4,
            }}
          >
            Back to sign in
          </button>
        )}
      </form>

      {!isForgot && (
        <>
          {/* Divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              margin: "20px 0 14px",
            }}
          >
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.15)" }} />
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>or sign in with</span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.15)" }} />
          </div>

          {/* Face ID */}
          {biometricScope && bioAvailable && (
            <button
              type="button"
              onClick={handleBiometric}
              disabled={bioBusy}
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.1)",
                border: "1.5px solid rgba(255,255,255,0.22)",
                borderRadius: 14,
                padding: "13px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                color: "#FFFFFF",
                fontSize: 13,
                fontWeight: 600,
                cursor: bioBusy ? "not-allowed" : "pointer",
                marginBottom: 10,
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 8V6a2 2 0 0 1 2-2h2" />
                <path d="M16 4h2a2 2 0 0 1 2 2v2" />
                <path d="M20 16v2a2 2 0 0 1-2 2h-2" />
                <path d="M8 20H6a2 2 0 0 1-2-2v-2" />
                <line x1="9" y1="10" x2="9" y2="11.5" />
                <line x1="15" y1="10" x2="15" y2="11.5" />
                <line x1="12" y1="10" x2="12" y2="14" />
                <path d="M9 16c1 1 2 1.5 3 1.5s2-.5 3-1.5" />
              </svg>
              {bioBusy ? "Authenticating…" : "Sign in with Face ID"}
            </button>
          )}

          {/* Google slot rendered by parent if needed */}
          {footer}

          {/* Contact administrator */}
          <p
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 12,
              textAlign: "center",
              marginTop: 18,
            }}
          >
            Need access?{" "}
            <a
              href="mailto:support@drivingschoolmanager.co.uk"
              style={{ color: "#FFFFFF", fontWeight: 700, textDecoration: "none" }}
            >
              Contact your administrator
            </a>
          </p>
        </>
      )}

      {/* iOS home bar indicator */}
      <div style={{ paddingTop: 16, paddingBottom: 22, display: "flex", justifyContent: "center" }}>
        <div
          style={{
            width: 100,
            height: 4,
            background: "rgba(255,255,255,0.25)",
            borderRadius: 4,
          }}
        />
      </div>
    </div>
  );
}
