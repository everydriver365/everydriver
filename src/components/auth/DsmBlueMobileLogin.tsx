/**
 * DsmBlueMobileLogin
 *
 * Mobile-only login surface for the DSM Instructor Portal.
 * Glassmorphic dark direction — visual only. Auth/forgot logic delegated to parent.
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

const BRAND = "#0070C0";
const BG = "#020817";

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
    color: "rgba(148,163,184,0.9)",
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "1px",
    marginLeft: 4,
    marginBottom: 8,
    display: "block",
  };

  const inputWrap: React.CSSProperties = {
    position: "relative",
    background: "rgba(15,23,42,0.5)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 16,
    display: "flex",
    alignItems: "center",
    transition: "border-color 0.15s",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "transparent",
    border: "none",
    outline: "none",
    padding: "14px 16px 14px 44px",
    fontSize: 14,
    color: "#FFFFFF",
    borderRadius: 16,
  };

  return (
    <div
      className={className}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 40,
        background: `radial-gradient(120% 80% at 50% 0%, #0b1a3a 0%, ${BG} 60%, #000814 100%)`,
        overflowY: "auto",
        paddingTop: "calc(env(safe-area-inset-top) + 40px)",
        paddingLeft: 24,
        paddingRight: 24,
        paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)",
        minHeight: "100dvh",
        fontFamily:
          "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Hero */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
          paddingBottom: 24,
        }}
      >
        <img
          src={dsmLogo}
          alt="DSM"
          style={{
            width: "auto",
            height: 64,
            maxWidth: "80%",
            objectFit: "contain",
            display: "block",
            filter: "drop-shadow(0 8px 24px rgba(0,112,192,0.45))",
          }}
        />

        <h1
          style={{
            color: "#FFFFFF",
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: "-0.4px",
            margin: 0,
            textAlign: "center",
          }}
        >
          {isForgot ? "Reset password" : "Instructor Portal"}
        </h1>
        <p
          style={{
            color: "rgba(148,163,184,0.9)",
            fontSize: 13,
            textAlign: "center",
            margin: 0,
          }}
        >
          {isForgot
            ? "Enter your email and we'll send you a reset link."
            : "Welcome back, please sign in"}
        </p>
      </div>

      {/* Glass Card */}
      <div
        style={{
          background: "rgba(255,255,255,0.05)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 24,
          padding: 22,
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
        }}
      >
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Email */}
          <div>
            <label style={labelStyle}>Email Address</label>
            <div style={inputWrap}>
              <Mail size={18} style={{ position: "absolute", left: 14, color: "#64748B" }} />
              <input
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="name@dsmportal.co.uk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Password */}
          {!isForgot && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginLeft: 4,
                  marginBottom: 8,
                }}
              >
                <label
                  style={{
                    color: "rgba(148,163,184,0.9)",
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => switchView(true)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: BRAND,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  Forgot Password?
                </button>
              </div>
              <div style={inputWrap}>
                <Lock size={18} style={{ position: "absolute", left: 14, color: "#64748B" }} />
                <input
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ ...inputStyle, paddingRight: 44 }}
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
                    color: "#64748B",
                  }}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          {/* Remember Me */}
          {!isForgot && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: 4 }}>
              <button
                type="button"
                role="switch"
                aria-checked={rememberMe}
                onClick={() => setRememberMe((v) => !v)}
                style={{
                  width: 40,
                  height: 22,
                  background: rememberMe ? BRAND : "#334155",
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
                    left: rememberMe ? 20 : 2,
                    width: 18,
                    height: 18,
                    background: "#FFFFFF",
                    borderRadius: "50%",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    transition: "left 0.15s",
                  }}
                />
              </button>
              <span style={{ color: "#CBD5E1", fontSize: 13 }}>Remember session</span>
            </div>
          )}

          {error && (
            <div
              style={{
                background: "rgba(220,38,38,0.15)",
                border: "1px solid rgba(248,113,113,0.3)",
                borderRadius: 12,
                padding: "10px 12px",
                color: "#FCA5A5",
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
              background: BRAND,
              color: "#FFFFFF",
              border: "none",
              borderRadius: 16,
              padding: 15,
              fontSize: 15,
              fontWeight: 700,
              boxShadow: "0 10px 25px -5px rgba(0,112,192,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.15s",
            }}
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                {isForgot ? "Send reset link" : "Sign In"}
                {!isForgot && <ArrowRight size={18} />}
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
                color: "rgba(148,163,184,0.9)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Back to sign in
            </button>
          )}
        </form>
      </div>

      {!isForgot && biometricScope && (
        <>
          {/* Divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              margin: "24px 0 16px",
            }}
          >
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
            <span
              style={{
                color: "#64748B",
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "1.5px",
              }}
            >
              Quick Access
            </span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
          </div>

          {/* Face ID */}
          <button
            type="button"
            onClick={handleBiometric}
            disabled={bioBusy}
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 16,
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              color: "#FFFFFF",
              fontSize: 14,
              fontWeight: 600,
              cursor: bioBusy ? "not-allowed" : "pointer",
              transition: "background 0.15s",
            }}
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 8V6a2 2 0 0 1 2-2h2" />
              <path d="M16 4h2a2 2 0 0 1 2 2v2" />
              <path d="M20 16v2a2 2 0 0 1-2 2h-2" />
              <path d="M8 20H6a2 2 0 0 1-2-2v-2" />
              <line x1="9" y1="9" x2="9" y2="11" />
              <line x1="15" y1="9" x2="15" y2="11" />
              <line x1="12" y1="9" x2="12" y2="14" />
              <path d="M9 16c1 1 2 1.5 3 1.5s2-.5 3-1.5" />
            </svg>
            {bioBusy ? "Authenticating…" : "Sign in with Face ID"}
          </button>
        </>
      )}

      {/* Optional footer slot */}
      {!isForgot && footer && <div style={{ marginTop: 14 }}>{footer}</div>}

      {/* Contact administrator */}
      {!isForgot && (
        <p
          style={{
            color: "#64748B",
            fontSize: 13,
            textAlign: "center",
            marginTop: 24,
          }}
        >
          Need access?{" "}
          <a
            href="mailto:support@drivingschoolmanager.co.uk"
            style={{ color: BRAND, fontWeight: 600, textDecoration: "none" }}
          >
            Contact your administrator
          </a>
        </p>
      )}

      {/* iOS home bar indicator */}
      <div style={{ paddingTop: 18, paddingBottom: 8, display: "flex", justifyContent: "center" }}>
        <div
          style={{
            width: 100,
            height: 4,
            background: "rgba(255,255,255,0.15)",
            borderRadius: 4,
          }}
        />
      </div>
    </div>
  );
}
