/**
 * DarkMobileAuthForm
 *
 * Light "DSM white" mobile login surface used across every portal
 * (pupil / parent / instructor / admin / school). The component name is
 * kept for backwards compatibility with all existing call sites — the
 * caller API is unchanged. Unused legacy props (heroSrc, surface, etc.)
 * are accepted but ignored.
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
  brand?: "dsm" | "drive365";
  /** @deprecated */ heroSrc?: string;
  /** @deprecated */ heroAlt?: string;
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

  /** @deprecated */ surface?: LoginSurface;
  /** @deprecated */ heroOffsetY?: number;
  customFooter?: ReactNode;
  brandName?: string;
}

const BRAND = "#0070C0";
const TEXT = "#0F172A";
const MUTED = "#8A96A6";
const FIELD_BG = "#EEF1F5";
const DIVIDER = "#E5E9EF";

export function DarkMobileAuthForm({
  logoSrc,
  logoAlt,
  logoHeightPx = 84,
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
  const canSubmit = isForgot
    ? email.trim().length > 0
    : email.trim().length > 0 && password.length > 0;

  const [emailFocus, setEmailFocus] = useState(false);
  const [pwFocus, setPwFocus] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const fieldStyle = (focused: boolean): CSSProperties => ({
    background: FIELD_BG,
    border: `1px solid ${focused ? BRAND : "transparent"}`,
    boxShadow: focused ? `0 0 0 4px ${BRAND}1F` : "none",
    transition: "all 160ms ease",
    color: TEXT,
  });

  return (
    <div
      className={cn(
        hideAt === "lg" ? "lg:hidden" : "md:hidden",
        "fixed inset-0 z-40 flex flex-col overflow-hidden",
      )}
      style={{
        background: "#FFFFFF",
        color: TEXT,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif",
      }}
    >
      <style>{`
        @keyframes fsuKF {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fsu  { animation: fsuKF 480ms cubic-bezier(.22,.61,.36,1) both; }
        .fsu-2 { animation-delay: 80ms; }
        .fsu-3 { animation-delay: 160ms; }
      `}</style>

      <div
        className="relative z-10 flex-1 flex flex-col overflow-y-auto px-6"
        style={{
          paddingTop: "calc(env(safe-area-inset-top) + 32px)",
          paddingBottom: "calc(env(safe-area-inset-bottom) + 28px)",
        }}
      >
        {/* Logo */}
        <div className="fsu flex flex-col items-center" style={{ marginTop: 8 }}>
          <img
            src={logoSrc}
            alt={logoAlt}
            style={{
              height: logoHeightPx,
              width: "auto",
              maxWidth: "70%",
              objectFit: "contain",
            }}
          />

          {title && (
            <h1
              className="fsu fsu-2"
              style={{
                marginTop: 28,
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: "-0.5px",
                color: TEXT,
                textAlign: "center",
              }}
            >
              {title}
            </h1>
          )}
          {subtitle && (
            <p
              className="fsu fsu-2"
              style={{
                marginTop: 8,
                fontSize: 14.5,
                color: MUTED,
                textAlign: "center",
                padding: "0 16px",
                lineHeight: 1.45,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>

        <div style={{ height: 32 }} />

        {/* Form */}
        <form onSubmit={onSubmit} className="fsu fsu-3 flex flex-col">
          {error && (
            <div
              className="mb-4 flex items-start gap-2 px-4 py-3"
              style={{
                background: "#FEECEC",
                border: "1px solid #F5C2C2",
                borderRadius: 14,
              }}
            >
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" color="#C0392B" />
              <p className="text-[13px] font-medium" style={{ color: "#8E1E1E" }}>
                {error}
              </p>
            </div>
          )}

          {/* Email */}
          <div className="relative mb-3">
            <Mail
              className="absolute left-[18px] top-1/2 -translate-y-1/2 h-[18px] w-[18px]"
              style={{ color: MUTED }}
              strokeWidth={1.8}
            />
            <input
              type="email"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoComplete="username"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setEmailFocus(true)}
              onBlur={() => setEmailFocus(false)}
              required
              disabled={loading}
              className="w-full outline-none text-[15px]"
              style={{
                height: 56,
                padding: "0 20px 0 50px",
                borderRadius: 999,
                ...fieldStyle(emailFocus),
              }}
            />
          </div>

          {!isForgot && (
            <>
              {/* Password */}
              <div className="relative mb-3">
                <Lock
                  className="absolute left-[18px] top-1/2 -translate-y-1/2 h-[18px] w-[18px]"
                  style={{ color: MUTED }}
                  strokeWidth={1.8}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPwFocus(true)}
                  onBlur={() => setPwFocus(false)}
                  required
                  disabled={loading}
                  className="w-full outline-none text-[15px]"
                  style={{
                    height: 56,
                    padding: "0 50px 0 50px",
                    borderRadius: 999,
                    ...fieldStyle(pwFocus),
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full"
                  style={{ color: MUTED }}
                >
                  {showPassword ? (
                    <EyeOff className="h-[18px] w-[18px]" />
                  ) : (
                    <Eye className="h-[18px] w-[18px]" />
                  )}
                </button>
              </div>

              {/* Remember + Forgot */}
              <div className="flex items-center justify-between mb-5 mt-1 px-1">
                {setRememberMe ? (
                  <button
                    type="button"
                    onClick={() => setRememberMe(!rememberMe)}
                    className="flex items-center gap-2.5"
                  >
                    <span
                      className="relative inline-flex items-center"
                      style={{
                        width: 40,
                        height: 22,
                        borderRadius: 999,
                        background: rememberMe ? BRAND : "#D6DCE5",
                        transition: "background 180ms ease",
                      }}
                    >
                      <motion.span
                        animate={{ x: rememberMe ? 20 : 2 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        style={{
                          position: "absolute",
                          top: 2,
                          width: 18,
                          height: 18,
                          borderRadius: 999,
                          background: "#FFFFFF",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
                        }}
                      />
                    </span>
                    <span
                      className="text-[13.5px] font-medium"
                      style={{ color: TEXT }}
                    >
                      Remember me
                    </span>
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={() => onForgotToggle(true)}
                  className="text-[13px] font-semibold"
                  style={{ color: BRAND }}
                >
                  Forgot password?
                </button>
              </div>
            </>
          )}

          {/* Primary button */}
          <motion.button
            type="submit"
            whileTap={{ scale: 0.98 }}
            disabled={!canSubmit || loading || biometricLoading}
            style={{
              height: 56,
              borderRadius: 999,
              background: BRAND,
              color: "#FFFFFF",
              fontWeight: 600,
              fontSize: 16,
              letterSpacing: "0.2px",
              boxShadow: "0 12px 28px -10px rgba(0,112,192,0.55)",
              opacity: canSubmit && !loading && !biometricLoading ? 1 : 0.5,
              transition: "opacity 160ms ease",
            }}
            className="w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <span>{isForgot ? "Send reset link" : "Log in"}</span>
                <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2.2} />
              </>
            )}
          </motion.button>

          {/* Face ID */}
          {!isForgot && biometricAvailable && onBiometric && (
            <>
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px" style={{ background: DIVIDER }} />
                <span
                  className="text-[11px] uppercase"
                  style={{ letterSpacing: "2px", color: MUTED }}
                >
                  or
                </span>
                <div className="flex-1 h-px" style={{ background: DIVIDER }} />
              </div>

              <motion.button
                type="button"
                onClick={onBiometric}
                disabled={biometricLoading || loading}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2.5"
                style={{
                  height: 56,
                  borderRadius: 999,
                  background: FIELD_BG,
                  border: `1px solid ${DIVIDER}`,
                  color: TEXT,
                  fontWeight: 600,
                  fontSize: 15,
                }}
              >
                {biometricLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <ScanFace
                    className="h-[22px] w-[22px]"
                    strokeWidth={1.8}
                    color={BRAND}
                  />
                )}
                <span>{biometricLoading ? "Scanning…" : "Sign in with Face ID"}</span>
              </motion.button>
            </>
          )}

          {/* Footer */}
          <div
            className="mt-6 text-center text-[13px]"
            style={{ color: MUTED }}
          >
            {customFooter !== undefined ? (
              customFooter
            ) : isForgot ? (
              <button
                type="button"
                onClick={() => onForgotToggle(false)}
                className="font-semibold"
                style={{ color: BRAND }}
              >
                Back to sign in
              </button>
            ) : signUpHref ? (
              <>
                {signUpLabel ?? `New to ${brandName ?? "us"}?`}{" "}
                <a
                  href={signUpHref}
                  className="font-bold"
                  style={{ color: BRAND }}
                >
                  Create an account
                </a>
              </>
            ) : brandName ? (
              <>
                New to {brandName}?{" "}
                <span className="font-bold" style={{ color: BRAND }}>
                  Contact your administrator
                </span>
              </>
            ) : null}
          </div>

          <div
            className="text-center"
            style={{ marginTop: 16, fontSize: 10, color: "#B0B8C4", letterSpacing: "0.04em" }}
          >
            build {typeof __BUILD_TIME__ !== "undefined" ? __BUILD_TIME__.slice(0, 16).replace("T", " ") : "dev"}
          </div>

          {hiddenSlot}
        </form>
      </div>
    </div>
  );
}

declare const __BUILD_TIME__: string;
