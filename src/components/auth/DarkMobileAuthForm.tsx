import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Check, Eye, EyeOff, Loader2, Lock, Mail, ScanFace } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MobilePortalLoginShell,
  darkPortalGhostBtnClass,
  darkPortalGhostBtnStyle,
  darkPortalInputClass,
  darkPortalInputStyle,
  darkPortalLabelClass,
  darkPortalPrimaryBtnClass,
} from "./MobilePortalLoginShell";

interface Props {
  /** Portal logo image (Drive365 / DSM / EveryDriver / …) */
  logoSrc: string;
  logoAlt: string;
  logoHeightPx?: number;
  /** Optional hero illustration shown above the logo. */
  heroSrc?: string;
  heroAlt?: string;
  title: string;
  subtitle: string;
  hideAt?: "md" | "lg";

  // form state
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

  /** Optional Face ID handler */
  onBiometric?: () => void;
  biometricAvailable?: boolean;
  biometricLoading?: boolean;

  /** Optional secondary CTA below sign in — e.g. Google button trigger */
  onGoogleClick?: () => void;
  /** Slot for hidden OAuth widget */
  hiddenSlot?: ReactNode;
}

/**
 * Reusable dark-navy mobile login form shared by Drive365 pupil, DSM
 * instructor, EveryDriver admin and School portals. Render this alongside
 * the existing desktop layout — its fixed `md:hidden` (or `lg:hidden`)
 * positioning means mobile sees this shell, desktop sees the layout.
 */
export function DarkMobileAuthForm({
  logoSrc,
  logoAlt,
  logoHeightPx = 44,
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
  onGoogleClick,
  hiddenSlot,
}: Props) {
  const canSubmit = isForgot ? email.trim().length > 0 : email.trim().length > 0 && password.length > 0;

  return (
    <MobilePortalLoginShell
      logoSrc={logoSrc}
      logoAlt={logoAlt}
      logoHeightPx={logoHeightPx}
      title={title}
      subtitle={subtitle}
      hideAt={hideAt}
      footer={
        isForgot ? (
          <button
            type="button"
            onClick={() => onForgotToggle(false)}
            className="text-[13px] font-semibold text-white"
          >
            Back to sign in
          </button>
        ) : signUpHref ? (
          <span className="text-[13px] text-white">
            {signUpLabel ?? "New here?"}{" "}
            <a href={signUpHref} className="font-bold text-white">
              Create account
            </a>
          </span>
        ) : null
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col flex-1">
        {error && (
          <div className="mb-3 rounded-[10px] px-3 py-2 flex items-start gap-2 bg-white/10 border border-white/20">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-white" />
            <p className="text-[12px] font-medium text-white">{error}</p>
          </div>
        )}

        <label className={darkPortalLabelClass}>Email</label>
        <div className="relative mb-[14px]">
          <Mail className="absolute left-[14px] top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-white" strokeWidth={1.8} />
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
            required
            disabled={loading}
            className={darkPortalInputClass}
            style={darkPortalInputStyle}
          />
        </div>

        {!isForgot && (
          <>
            <label className={darkPortalLabelClass}>Password</label>
            <div className="relative mb-[14px]">
              <Lock className="absolute left-[14px] top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-white" strokeWidth={1.8} />
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className={cn(darkPortalInputClass, "pr-12")}
                style={darkPortalInputStyle}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-[12px] top-1/2 -translate-y-1/2 p-1 text-white/80"
              >
                {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
              </button>
            </div>

            <div className="flex items-center justify-between mb-4">
              {setRememberMe ? (
                <button type="button" onClick={() => setRememberMe(!rememberMe)} className="flex items-center gap-2">
                  <span
                    className={cn(
                      "w-5 h-5 rounded-[5px] flex items-center justify-center transition-colors",
                      rememberMe ? "bg-white" : "bg-transparent",
                    )}
                    style={{ border: "1.5px solid rgba(255,255,255,0.9)" }}
                  >
                    {rememberMe && <Check className="h-3 w-3 text-[#0F2044]" strokeWidth={3.5} />}
                  </span>
                  <span className="text-[13px] font-medium text-white">Remember me</span>
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={() => onForgotToggle(true)}
                className="text-[13px] font-semibold text-white"
              >
                Forgot password?
              </button>
            </div>
          </>
        )}

        <motion.button
          type="submit"
          whileTap={{ scale: 0.985, opacity: 0.85 }}
          disabled={!canSubmit || loading || biometricLoading}
          style={{ opacity: canSubmit && !loading && !biometricLoading ? 1 : 0.6 }}
          className={darkPortalPrimaryBtnClass}
        >
          <span className="py-4 text-[15px] flex items-center justify-center gap-2">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : isForgot ? "Send reset link" : "Sign in"}
          </span>
        </motion.button>

        {!isForgot && (onGoogleClick || (biometricAvailable && onBiometric)) && (
          <>
            <div className="flex items-center gap-3 mt-6 mb-5">
              <div className="flex-1 h-px bg-white/25" />
              <span className="text-[12px] text-white/70 uppercase" style={{ letterSpacing: "2px" }}>or</span>
              <div className="flex-1 h-px bg-white/25" />
            </div>

            {onGoogleClick && (
              <button
                type="button"
                onClick={onGoogleClick}
                className={darkPortalGhostBtnClass}
                style={darkPortalGhostBtnStyle}
              >
                <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.7 2.9l5.7-5.7C33.9 6.2 29.2 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.3-3.5z"/>
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12.5 24 12.5c2.9 0 5.6 1.1 7.7 2.9l5.7-5.7C33.9 6.2 29.2 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z"/>
                  <path fill="#4CAF50" d="M24 43.5c5.1 0 9.8-1.7 13.4-4.6l-6.2-5.1c-2 1.4-4.5 2.3-7.2 2.3-5.3 0-9.7-3.1-11.3-7.4l-6.5 5C9.6 39 16.2 43.5 24 43.5z"/>
                  <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.6l6.2 5.1c.4-.3 6.6-4.8 6.6-14.7 0-1.2-.1-2.3-.3-3.5z"/>
                </svg>
                <span className="text-white text-[14px] font-semibold">Continue with Google</span>
              </button>
            )}

            {biometricAvailable && onBiometric && (
              <button
                type="button"
                onClick={onBiometric}
                disabled={biometricLoading || loading}
                className={cn(darkPortalGhostBtnClass, onGoogleClick && "mt-3")}
                style={darkPortalGhostBtnStyle}
              >
                {biometricLoading
                  ? <Loader2 className="h-[22px] w-[22px] animate-spin text-white" />
                  : <ScanFace className="h-[22px] w-[22px] text-white" strokeWidth={1.8} />}
                <span className="text-white text-[14px] font-semibold">
                  {biometricLoading ? "Scanning…" : "Sign in with Face ID"}
                </span>
              </button>
            )}
          </>
        )}
      </form>

      {hiddenSlot}
    </MobilePortalLoginShell>
  );
}
