/**
 * DarkMobileAuthForm
 *
 * Premium deep-blue iOS mobile login screen used across every portal
 * (pupil / parent / instructor / admin / school). Replaces the previous
 * light surface design. Caller API is preserved — unused legacy props
 * (heroSrc, heroOffsetY, surface, etc.) are accepted but ignored so all
 * existing call sites keep working.
 */
import { useEffect, useState, type ReactNode, type CSSProperties } from "react";
import { motion } from "framer-motion";
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, ScanFace } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LoginSurface } from "./MobilePortalLoginShell";

interface Props {
  logoSrc: string;
  logoAlt: string;
  logoHeightPx?: number;
  /** Brand controls the 84x84 logo block styling. dsm = tinted glass + contain; drive365 = transparent + cover (app-icon style). */
  brand?: "dsm" | "drive365";
  /** @deprecated kept for API compat */
  heroSrc?: string;
  /** @deprecated kept for API compat */
  heroAlt?: string;
  title: string;
  subtitle: string;
  hideAt?: "md" | "lg";

  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;

  rememberMe?: boolean;
  setRememberMe?: (v: boolean) => void;

  isForgot: boolean;
  onForgotToggle: (v: boolean) => void;

  loading: boolean;
  error?: string | null;

  onSubmit: (e: React.FormEvent) => void;

  signUpHref?: string;
  signUpLabel?: string;

  onBiometric?: () => void;
  biometricAvailable?: boolean;
  biometricLoading?: boolean;

  onGoogleClick?: () => void;
  hiddenSlot?: ReactNode;

  /** @deprecated kept for API compat */
  surface?: LoginSurface;
  /** @deprecated kept for API compat */
  heroOffsetY?: number;
  /** Override the default footer (sign-up link / back link). */
  customFooter?: ReactNode;
  /** Override the "New to ..." brand name in the default footer. */
  brandName?: string;
}


export function DarkMobileAuthForm({
  logoSrc,
  logoAlt,
  logoHeightPx = 80,
  brand = "dsm",
  title,
  subtitle,
  hideAt = "md",
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  rememberMe,
  setRememberMe,
  isForgot,
  onForgotToggle,
  loading,
  error,
  onSubmit,
  signUpHref,
  signUpLabel,
  onBiometric,
  biometricAvailable,
  biometricLoading,
  hiddenSlot,
  customFooter,
  brandName,
}: Props) {

  const canSubmit = isForgot ? email.trim().length > 0 : email.trim().length > 0 && password.length > 0;
  const [emailFocus, setEmailFocus] = useState(false);
  const [pwFocus, setPwFocus] = useState(false);
  const [pressedBio, setPressedBio] = useState(false);

  // Lock body scroll on mount (full-screen experience)
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const fieldStyle = (focused: boolean): CSSProperties => ({
    background: "rgba(255,255,255,0.08)",
    border: `1px solid ${focused ? "rgba(91,163,245,0.7)" : "rgba(255,255,255,0.10)"}`,
    boxShadow: focused ? "0 0 0 4px rgba(59,142,240,0.15), 0 0 24px -4px rgba(59,142,240,0.35) inset" : "none",
    transition: "all 180ms ease",
  });

  return (
    <div
      className={cn(
        hideAt === "lg" ? "lg:hidden" : "md:hidden",
        "fixed inset-0 z-40 flex flex-col text-white overflow-hidden",
      )}
      style={{
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif",
        background: "#0A1628",
        backgroundImage: [
          "radial-gradient(120% 60% at 50% -10%, rgba(30,111,217,0.55) 0%, rgba(30,111,217,0.18) 35%, rgba(10,22,40,0) 70%)",
          "linear-gradient(180deg, #0A1628 0%, #060F1F 100%)",
        ].join(", "),
      }}
    >
      {/* faint grid texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 55%)",
          WebkitMaskImage: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 55%)",
        }}
      />

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fsu { animation: fadeSlideUp 520ms cubic-bezier(.22,.61,.36,1) both; }
        .fsu-2 { animation-delay: 90ms; }
        .fsu-3 { animation-delay: 180ms; }
      `}</style>

      {/* Scrollable content */}
      <div
        className="relative z-10 flex-1 flex flex-col overflow-y-auto"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 16px)" }}
      >
        {/* Logo badge */}
        <div className="fsu flex flex-col items-center" style={{ marginTop: 28 }}>
          <div
            className="flex items-center justify-center"
            style={{
              width: 84,
              height: 84,
              borderRadius: 22,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.20)",
              background: brand === "drive365" ? "transparent" : "rgba(255,255,255,0.12)",
              backdropFilter: brand === "drive365" ? undefined : "blur(20px)",
              WebkitBackdropFilter: brand === "drive365" ? undefined : "blur(20px)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.22), 0 12px 32px -8px rgba(0,0,0,0.55), 0 0 32px -10px rgba(59,142,240,0.35)",
            }}
          >
            <img
              src={logoSrc}
              alt={logoAlt}
              style={
                brand === "drive365"
                  ? { width: "100%", height: "100%", objectFit: "cover" }
                  : { maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }
              }
            />
          </div>

          {title && (
            <h1
              className="fsu fsu-2"
              style={{
                marginTop: 22,
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: "-0.6px",
                color: "#FFFFFF",
                textShadow: "0 2px 18px rgba(0,0,0,0.45)",
              }}
            >
              {title}
            </h1>
          )}
          {subtitle && (
            <p
              className="fsu fsu-2"
              style={{ marginTop: 6, fontSize: 14, color: "rgba(255,255,255,0.65)", textAlign: "center", padding: "0 24px" }}
            >
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex-1" />

        {/* Glass form card */}
        <div
          className="fsu fsu-3 relative"
          style={{
            background: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(40px) saturate(140%)",
            WebkitBackdropFilter: "blur(40px) saturate(140%)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderBottom: "none",
            borderRadius: "28px 28px 0 0",
            padding: "28px 24px calc(env(safe-area-inset-bottom) + 28px)",
            boxShadow: "0 -10px 40px -10px rgba(0,0,0,0.5)",
          }}
        >
          <form onSubmit={onSubmit} className="flex flex-col">
            {error && (
              <div
                className="mb-4 rounded-2xl px-3.5 py-2.5 flex items-start gap-2"
                style={{ background: "rgba(255,80,80,0.10)", border: "1px solid rgba(255,80,80,0.25)" }}
              >
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-[#FF8A8A]" />
                <p className="text-[12.5px] font-medium text-white/95">{error}</p>
              </div>
            )}

            {/* Email */}
            <label className="text-[11px] font-semibold uppercase tracking-[0.7px] text-white/55 mb-1.5">
              Email Address
            </label>
            <div className="relative mb-3.5">
              <Mail className="absolute left-[15px] top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-white/55" strokeWidth={1.8} />
              <input
                type="email"
                inputMode="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoComplete="username"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setEmailFocus(true)}
                onBlur={() => setEmailFocus(false)}
                required
                disabled={loading}
                className="w-full h-[54px] pl-[46px] pr-4 rounded-2xl text-white text-[15px] outline-none placeholder:text-white/25"
                style={fieldStyle(emailFocus)}
              />
            </div>

            {!isForgot && (
              <>
                <label className="text-[11px] font-semibold uppercase tracking-[0.7px] text-white/55 mb-1.5">
                  Password
                </label>
                <div className="relative mb-3.5">
                  <Lock className="absolute left-[15px] top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-white/55" strokeWidth={1.8} />
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPwFocus(true)}
                    onBlur={() => setPwFocus(false)}
                    required
                    disabled={loading}
                    className="w-full h-[54px] pl-[46px] pr-12 rounded-2xl text-white text-[15px] outline-none placeholder:text-white/25"
                    style={fieldStyle(pwFocus)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-white/70 active:bg-white/10"
                  >
                    {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                  </button>
                </div>

                <div className="flex items-center justify-between mb-5 mt-1">
                  {setRememberMe ? (
                    <button
                      type="button"
                      onClick={() => setRememberMe(!rememberMe)}
                      className="flex items-center gap-2.5"
                    >
                      {/* iOS-style switch */}
                      <motion.span
                        className="relative inline-flex items-center"
                        style={{
                          width: 44,
                          height: 26,
                          borderRadius: 999,
                          background: rememberMe ? "#3B8EF0" : "rgba(255,255,255,0.18)",
                          boxShadow: rememberMe ? "0 0 14px rgba(59,142,240,0.55)" : "inset 0 0 0 1px rgba(255,255,255,0.12)",
                          transition: "background 220ms ease, box-shadow 220ms ease",
                        }}
                      >
                        <motion.span
                          animate={{ x: rememberMe ? 20 : 2 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          style={{
                            position: "absolute",
                            top: 2,
                            width: 22,
                            height: 22,
                            borderRadius: 999,
                            background: "#FFFFFF",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.35)",
                          }}
                        />
                      </motion.span>
                      <span className="text-[13.5px] font-medium text-white/85">Remember Me</span>
                    </button>
                  ) : (
                    <span />
                  )}
                  <button
                    type="button"
                    onClick={() => onForgotToggle(true)}
                    className="text-[13px] font-semibold"
                    style={{ color: "#5BA3F5" }}
                  >
                    Forgot Password?
                  </button>
                </div>
              </>
            )}

            {/* Primary button */}
            <motion.button
              type="submit"
              whileTap={{ scale: 0.975 }}
              disabled={!canSubmit || loading || biometricLoading}
              style={{
                height: 58,
                borderRadius: 18,
                background: "linear-gradient(180deg, #3B8EF0 0%, #1E6FD9 100%)",
                color: "#FFFFFF",
                fontWeight: 700,
                fontSize: 16,
                letterSpacing: "0.2px",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.35), 0 10px 28px -6px rgba(30,111,217,0.55), 0 0 0 1px rgba(59,142,240,0.4)",
                opacity: canSubmit && !loading && !biometricLoading ? 1 : 0.55,
                transition: "opacity 160ms ease",
              }}
              className="w-full flex items-center justify-center gap-2 relative"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <span>{isForgot ? "Send reset link" : "Sign In"}</span>
                  <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2.2} />
                </>
              )}
            </motion.button>

            {/* Face ID */}
            {!isForgot && biometricAvailable && onBiometric && (
              <>
                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.10)" }} />
                  <span className="text-[11px] uppercase text-white/45" style={{ letterSpacing: "2px" }}>or</span>
                  <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.10)" }} />
                </div>

                <motion.button
                  type="button"
                  onClick={onBiometric}
                  disabled={biometricLoading || loading}
                  whileTap={{ scale: 0.975 }}
                  onPointerDown={() => setPressedBio(true)}
                  onPointerUp={() => setPressedBio(false)}
                  onPointerLeave={() => setPressedBio(false)}
                  className="w-full flex items-center justify-center gap-2.5"
                  style={{
                    height: 54,
                    borderRadius: 18,
                    background: pressedBio ? "rgba(59,142,240,0.18)" : "rgba(255,255,255,0.07)",
                    border: `1px solid ${pressedBio ? "rgba(91,163,245,0.55)" : "rgba(255,255,255,0.18)"}`,
                    color: "#FFFFFF",
                    fontWeight: 600,
                    fontSize: 14.5,
                    transition: "background 160ms ease, border-color 160ms ease",
                  }}
                >
                  {biometricLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <ScanFace className="h-[22px] w-[22px]" strokeWidth={1.7} />
                  )}
                  <span>{biometricLoading ? "Scanning…" : "Sign in with Face ID"}</span>
                </motion.button>
              </>
            )}

            {/* Footer */}
            <div className="mt-6 text-center text-[13px] text-white/70">
              {customFooter !== undefined ? (
                customFooter
              ) : isForgot ? (
                <button
                  type="button"
                  onClick={() => onForgotToggle(false)}
                  className="font-semibold text-white"
                >
                  Back to sign in
                </button>
              ) : signUpHref ? (
                <>
                  {signUpLabel ?? `New to ${brandName ?? "us"}?`}{" "}
                  <a href={signUpHref} className="font-bold" style={{ color: "#5BA3F5" }}>
                    Create an account
                  </a>
                </>
              ) : brandName ? (
                <>New to {brandName}? <span className="font-bold" style={{ color: "#5BA3F5" }}>Create an account</span></>
              ) : null}
            </div>
          </form>

          {hiddenSlot}
        </div>
      </div>
    </div>
  );
}
