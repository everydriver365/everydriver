/**
 * DsmBlueMobileLogin
 *
 * Mobile-only login surface for the DSM Instructor Portal.
 * Clean white minimal direction with pill inputs and brand-blue CTA.
 * Auth/forgot logic delegated to parent.
 */
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
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
const FIELD_BG = "#EEF1F5";
const MUTED = "#8A96A6";
const TEXT = "#0F172A";

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

  const pillWrap: React.CSSProperties = {
    position: "relative",
    background: FIELD_BG,
    borderRadius: 999,
    display: "flex",
    alignItems: "center",
    height: 56,
  };

  const pillInput: React.CSSProperties = {
    width: "100%",
    background: "transparent",
    border: "none",
    outline: "none",
    padding: "0 20px 0 50px",
    fontSize: 15,
    color: TEXT,
    height: "100%",
    borderRadius: 999,
  };

  return (
    <div
      className={className}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 40,
        background: "#FFFFFF",
        overflowY: "auto",
        paddingTop: "calc(env(safe-area-inset-top) + 52px)",
        paddingLeft: 24,
        paddingRight: 24,
        paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)",
        minHeight: "100dvh",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingBottom: 36,
        }}
      >
        <img
          src={dsmLogo}
          alt="DSM"
          style={{
            width: "auto",
            height: 84,
            maxWidth: "70%",
            objectFit: "contain",
            display: "block",
          }}
        />
      </div>

      {/* Heading */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <h1
          style={{
            color: TEXT,
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: "-0.4px",
            margin: 0,
          }}
        >
          {isForgot ? "Reset password" : "Welcome back"}
        </h1>
        <p
          style={{
            color: MUTED,
            fontSize: 14,
            margin: "6px 0 0",
          }}
        >
          {isForgot
            ? "Enter your email and we'll send you a reset link."
            : "Sign in to your Instructor Portal"}
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Email */}
        <div style={pillWrap}>
          <Mail size={18} style={{ position: "absolute", left: 20, color: MUTED }} />
          <input
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={pillInput}
          />
        </div>

        {/* Password */}
        {!isForgot && (
          <div style={pillWrap}>
            <Lock size={18} style={{ position: "absolute", left: 20, color: MUTED }} />
            <input
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ ...pillInput, paddingRight: 50 }}
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              aria-label={showPw ? "Hide password" : "Show password"}
              style={{
                position: "absolute",
                right: 16,
                background: "transparent",
                border: "none",
                padding: 4,
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                color: MUTED,
              }}
            >
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        )}

        {/* Remember + Forgot row */}
        {!isForgot && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "4px 8px 0",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                type="button"
                role="switch"
                aria-checked={rememberMe}
                onClick={() => setRememberMe((v) => !v)}
                style={{
                  width: 40,
                  height: 22,
                  background: rememberMe ? BRAND : "#CBD5E1",
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
              <span style={{ color: TEXT, fontSize: 13, fontWeight: 500 }}>Remember me</span>
            </div>
            <button
              type="button"
              onClick={() => switchView(true)}
              style={{
                background: "transparent",
                border: "none",
                color: BRAND,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                padding: 0,
              }}
            >
              Forgot password?
            </button>
          </div>
        )}

        {error && (
          <div
            style={{
              background: "rgba(220,38,38,0.08)",
              border: "1px solid rgba(220,38,38,0.2)",
              borderRadius: 14,
              padding: "10px 14px",
              color: "#B91C1C",
              fontSize: 13,
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        {/* Sign In */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            background: BRAND,
            color: "#FFFFFF",
            border: "none",
            borderRadius: 999,
            padding: 17,
            fontSize: 16,
            fontWeight: 600,
            boxShadow: "0 12px 28px -10px rgba(0,112,192,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            cursor: loading ? "not-allowed" : "pointer",
            marginTop: 24,
          }}
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>{isForgot ? "Send reset link" : "Log in"}</>
          )}
        </button>

        {isForgot && (
          <button
            type="button"
            onClick={() => switchView(false)}
            style={{
              background: "transparent",
              border: "none",
              color: MUTED,
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              marginTop: 4,
            }}
          >
            Back to sign in
          </button>
        )}
      </form>

      {/* Face ID */}
      {!isForgot && biometricScope && (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              margin: "28px 0 18px",
            }}
          >
            <div style={{ flex: 1, height: 1, background: "#E5E9EF" }} />
            <span
              style={{
                color: MUTED,
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "1.5px",
              }}
            >
              or
            </span>
            <div style={{ flex: 1, height: 1, background: "#E5E9EF" }} />
          </div>

          <button
            type="button"
            onClick={handleBiometric}
            disabled={bioBusy}
            style={{
              width: "100%",
              background: "#FFFFFF",
              border: `1.5px solid ${FIELD_BG}`,
              borderRadius: 999,
              padding: "15px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              color: TEXT,
              fontSize: 15,
              fontWeight: 600,
              cursor: bioBusy ? "not-allowed" : "pointer",
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke={BRAND}
              strokeWidth="1.8"
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

      {!isForgot && footer && <div style={{ marginTop: 16 }}>{footer}</div>}

      {!isForgot && (
        <p
          style={{
            color: MUTED,
            fontSize: 13,
            textAlign: "center",
            marginTop: 28,
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
    </div>
  );
}
