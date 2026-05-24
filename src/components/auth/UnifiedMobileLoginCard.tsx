/**
 * UnifiedMobileLoginCard
 *
 * Single shared mobile login card used across every portal login screen.
 * Renders a centred white card on a #F2F4F8 background with:
 *  - Logo (public/app-logo.png) + portal name + descriptor
 *  - Email + password (eye toggle), inline validation
 *  - Remember-me checkbox (passed up to parent for sessionPersistence)
 *  - Forgot-password link with inline error/success
 *  - Sign-in button with loading state + inline error
 *  - Optional Face ID / biometric button (mirrors src/lib/biometricAuth.ts)
 *  - Optional Google slot (rendered below the form)
 *
 * Desktop layouts are preserved by parents — this component renders only on
 * mobile via the default `md:hidden` class on the outer wrapper.
 *
 * Parents own auth side-effects: navigate on success, persist rememberMe via
 * setRememberMe / persistRememberMe etc. onSignIn returns { error?: string }
 * so this component can surface inline errors without coupling to providers.
 */
import { useEffect, useState, type ReactNode } from "react";
import { Eye, EyeOff, Loader2, ScanFace, CheckCircle2 } from "lucide-react";
import {
  isBiometricAvailable,
  getBiometricCredentials,
  saveBiometricCredentials,
  getBiometryLabel,
  type BiometricScope,
} from "@/lib/biometricAuth";

type AsyncResult = { error?: string } | void;

export interface UnifiedMobileLoginCardProps {
  portalName: string;
  descriptor: string;
  /** Provide a scope to enable Face ID / Quick Sign In. */
  biometricScope?: BiometricScope;
  /** Called when the user submits email/password. Parent handles redirect. */
  onSignIn: (email: string, password: string, rememberMe: boolean) => Promise<AsyncResult>;
  /** Called when the user taps "Forgot password?". */
  onForgot: (email: string) => Promise<AsyncResult>;
  /** Optional Google sign-in button rendered below the form. */
  googleSlot?: ReactNode;
  /** Optional footer (e.g. "Don't have an account? Sign up"). */
  footer?: ReactNode;
  /** Default visibility — render only on mobile by default. */
  className?: string;
}

const FONT = `Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;

const styles = {
  root: {
    minHeight: "100dvh",
    width: "100%",
    background: "#F2F4F8",
    fontFamily: FONT,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 16px",
    paddingTop: "calc(env(safe-area-inset-top) + 32px)",
    paddingBottom: "calc(env(safe-area-inset-bottom) + 32px)",
    boxSizing: "border-box" as const,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    background: "#FFFFFF",
    border: "0.5px solid #E0E3EA",
    borderRadius: 14,
    padding: 24,
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    boxSizing: "border-box" as const,
  },
  brand: { textAlign: "center" as const, marginBottom: 20 },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 18,
    display: "block",
    margin: "0 auto 12px",
    objectFit: "contain" as const,
  },
  portalName: {
    fontSize: 20,
    fontWeight: 700,
    color: "#1A1A1F",
    margin: 0,
    letterSpacing: "-0.2px",
  },
  descriptor: { fontSize: 12, color: "#AAAAAA", margin: "4px 0 0", fontWeight: 400 },
  label: {
    display: "block",
    fontSize: 11,
    fontWeight: 600,
    color: "#555",
    marginBottom: 4,
    textTransform: "uppercase" as const,
    letterSpacing: "0.4px",
  },
  input: {
    width: "100%",
    background: "#F2F4F8",
    border: "1px solid #EAECEE",
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    fontFamily: FONT,
    color: "#1A1A1F",
    outline: "none",
    boxSizing: "border-box" as const,
    height: 42,
  },
  eyeBtn: {
    position: "absolute" as const,
    right: 8,
    top: "50%",
    transform: "translateY(-50%)",
    background: "transparent",
    border: "none",
    color: "#888",
    cursor: "pointer",
    padding: 6,
    display: "flex",
  },
  primaryBtn: (disabled: boolean): React.CSSProperties => ({
    width: "100%",
    background: "#1A1A1F",
    color: "#FFFFFF",
    border: "none",
    borderRadius: 10,
    padding: "11px 14px",
    fontSize: 13,
    fontWeight: 600,
    fontFamily: FONT,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  }),
  faceBtn: (disabled: boolean): React.CSSProperties => ({
    width: "100%",
    background: "#FFFFFF",
    color: "#1A1A1F",
    border: "1px solid #EAECEE",
    borderRadius: 10,
    padding: "11px 14px",
    fontSize: 13,
    fontWeight: 600,
    fontFamily: FONT,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 14,
  }),
  forgot: {
    background: "transparent",
    border: "none",
    color: "#2952B3",
    fontSize: 11,
    fontFamily: FONT,
    cursor: "pointer",
    padding: 0,
    fontWeight: 500,
  },
  remember: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: 0,
    color: "#888",
    fontSize: 11,
    fontFamily: FONT,
  },
  errorText: { fontSize: 11, color: "#B91C1C", margin: "8px 0 0", fontFamily: FONT },
  successText: { fontSize: 11, color: "#0F7A47", margin: "8px 0 0", fontFamily: FONT },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    margin: "18px 0 14px",
  },
  dividerLine: { flex: 1, height: 1, background: "#EAECEE" },
  dividerLabel: { fontSize: 10, color: "#AAA", letterSpacing: "1px" },
};

export function UnifiedMobileLoginCard({
  portalName,
  descriptor,
  biometricScope,
  onSignIn,
  onForgot,
  googleSlot,
  footer,
  className = "md:hidden",
}: UnifiedMobileLoginCardProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [signinErr, setSigninErr] = useState<string | null>(null);
  const [forgotMsg, setForgotMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [forgotBusy, setForgotBusy] = useState(false);

  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioLabel, setBioLabel] = useState("Face ID");
  const [bioBusy, setBioBusy] = useState(false);
  const [bioOk, setBioOk] = useState(false);

  useEffect(() => {
    if (!biometricScope) return;
    let cancelled = false;
    (async () => {
      const [ok, label] = await Promise.all([
        isBiometricAvailable(biometricScope),
        getBiometryLabel(),
      ]);
      if (cancelled) return;
      setBioAvailable(ok);
      setBioLabel(label);
    })();
    return () => {
      cancelled = true;
    };
  }, [biometricScope]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigninErr(null);
    setForgotMsg(null);
    if (!email.trim() || !password) {
      setSigninErr("Enter your email and password");
      return;
    }
    setSigningIn(true);
    try {
      const result = await onSignIn(email.trim(), password, rememberMe);
      const err = result && "error" in result ? result.error : undefined;
      if (err) {
        setSigninErr(err);
      } else if (biometricScope) {
        // Silent save mirrors existing instructor/pupil behaviour: any successful
        // password login arms the Face ID button for next launch.
        try {
          await saveBiometricCredentials(biometricScope, email.trim(), password);
          setBioAvailable(true);
        } catch {
          // best-effort
        }
      }
    } catch (err) {
      setSigninErr(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setSigningIn(false);
    }
  };

  const handleForgot = async () => {
    setSigninErr(null);
    setForgotMsg(null);
    if (!email.trim()) {
      setForgotMsg({ kind: "error", text: "Enter your email address first" });
      return;
    }
    setForgotBusy(true);
    try {
      const result = await onForgot(email.trim());
      const err = result && "error" in result ? result.error : undefined;
      if (err) setForgotMsg({ kind: "error", text: err });
      else setForgotMsg({ kind: "success", text: "Check your email for a reset link" });
    } catch (err) {
      setForgotMsg({
        kind: "error",
        text: err instanceof Error ? err.message : "Could not send reset email",
      });
    } finally {
      setForgotBusy(false);
    }
  };

  const handleFaceId = async () => {
    if (!biometricScope) return;
    setBioBusy(true);
    setSigninErr(null);
    try {
      const creds = await getBiometricCredentials(biometricScope, `Sign in to ${portalName}`);
      if (!creds?.email || !creds?.password) {
        setSigninErr("No saved sign-in found. Sign in with your password once to enable.");
        return;
      }
      setBioOk(true);
      setEmail(creds.email);
      const result = await onSignIn(creds.email, creds.password, true);
      const err = result && "error" in result ? result.error : undefined;
      if (err) setSigninErr(err);
    } catch {
      // Silent fallback per spec — user can still use email/password.
    } finally {
      setBioBusy(false);
      setTimeout(() => setBioOk(false), 800);
    }
  };

  return (
    <div className={className} style={styles.root}>
      <div style={styles.card}>
        <div style={styles.brand}>
          <img src="/app-logo.png" alt={portalName} style={styles.logo} />
          <h1 style={styles.portalName}>{portalName}</h1>
          <p style={styles.descriptor}>{descriptor}</p>
        </div>

        {biometricScope && bioAvailable && (
          <button
            type="button"
            onClick={handleFaceId}
            disabled={bioBusy || signingIn}
            style={styles.faceBtn(bioBusy || signingIn)}
          >
            {bioOk ? (
              <CheckCircle2 size={16} color="#0F7A47" />
            ) : bioBusy ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <ScanFace size={16} />
            )}
            {bioOk ? "Recognised — signing in" : bioBusy ? "Scanning…" : `Sign in with ${bioLabel}`}
          </button>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={styles.label} htmlFor="ul-email">Email</label>
            <input
              id="ul-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              disabled={signingIn}
            />
          </div>

          <div>
            <label style={styles.label} htmlFor="ul-password">Password</label>
            <div style={{ position: "relative" }}>
              <input
                id="ul-password"
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ ...styles.input, paddingRight: 38 }}
                disabled={signingIn}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                style={styles.eyeBtn}
                aria-label={showPw ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <div style={{ marginTop: 6, textAlign: "right" }}>
              <button type="button" onClick={handleForgot} disabled={forgotBusy} style={styles.forgot}>
                {forgotBusy ? "Sending…" : "Forgot password?"}
              </button>
            </div>
          </div>

          <button type="button" onClick={() => setRememberMe((v) => !v)} style={styles.remember}>
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: 3,
                border: `1px solid ${rememberMe ? "#1A1A1F" : "#CCC"}`,
                background: rememberMe ? "#1A1A1F" : "#FFFFFF",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {rememberMe && (
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                  <path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            Remember me
          </button>

          {signinErr && <p style={styles.errorText}>{signinErr}</p>}
          {forgotMsg && (
            <p style={forgotMsg.kind === "error" ? styles.errorText : styles.successText}>
              {forgotMsg.text}
            </p>
          )}

          <button type="submit" disabled={signingIn} style={styles.primaryBtn(signingIn)}>
            {signingIn ? <Loader2 size={14} className="animate-spin" /> : null}
            {signingIn ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {googleSlot && (
          <>
            <div style={styles.divider}>
              <div style={styles.dividerLine} />
              <span style={styles.dividerLabel}>OR</span>
              <div style={styles.dividerLine} />
            </div>
            {googleSlot}
          </>
        )}

        {footer && <div style={{ marginTop: 18, textAlign: "center" }}>{footer}</div>}
      </div>
    </div>
  );
}
