/**
 * UnifiedMobileLoginCard
 *
 * Shared mobile login surface used across every portal login screen
 * (pupil / instructor / admin / school / parent). Internally renders the
 * new MobilePortalLoginShell + DarkMobileAuthForm so every portal shares:
 *   - Essex logo top-left + "Welcome" headline
 *   - Hero car image (passed via heroImage prop, falls back to default)
 *   - Light surface with white form fields
 *   - Face ID / biometric quick sign-in (via biometricScope)
 *   - Email + password + remember me + forgot password flow
 *   - Optional Google slot + footer
 *
 * Parents own auth side-effects (navigation, sessionPersistence). onSignIn
 * returns { error?: string } so inline errors can surface without coupling
 * to specific auth providers.
 */
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  isBiometricAvailable,
  getBiometricCredentials,
  saveBiometricCredentials,
  type BiometricScope,
} from "@/lib/biometricAuth";
import { DarkMobileAuthForm } from "./DarkMobileAuthForm";
import essexLogo from "@/assets/essex-logo.png";
import defaultMobileHero from "@/assets/mobile-login-hero.png";

type AsyncResult = { error?: string } | void;

export interface UnifiedMobileLoginCardProps {
  portalName: string;
  descriptor: string;
  /** Provide a scope to enable Face ID / Quick Sign In. */
  biometricScope?: BiometricScope;
  /** Called when the user submits email/password. Parent handles redirect. */
  onSignIn: (email: string, password: string, rememberMe: boolean) => Promise<AsyncResult>;
  /** Called when the user submits the forgot-password form. */
  onForgot: (email: string) => Promise<AsyncResult>;
  /** Optional Google sign-in button rendered below the form. */
  googleSlot?: ReactNode;
  /** Optional footer (e.g. "Don't have an account? Sign up"). */
  footer?: ReactNode;
  /** Default visibility — render only on mobile by default. */
  className?: string;
  /** Optional hero illustration rendered above the card. */
  heroImage?: string;
  /** Optional alt text for the hero image. */
  heroAlt?: string;
}

export function UnifiedMobileLoginCard({
  portalName,
  descriptor: _descriptor,
  biometricScope,
  onSignIn,
  onForgot,
  googleSlot: _googleSlot,
  footer,
  className = "md:hidden",
  heroImage,
  heroAlt,
}: UnifiedMobileLoginCardProps) {
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
        if (err) {
          setError(err);
        } else if (biometricScope) {
          try {
            await saveBiometricCredentials(biometricScope, email.trim(), password);
            setBioAvailable(true);
          } catch {
            /* best-effort */
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
      const creds = await getBiometricCredentials(biometricScope, `Sign in to ${portalName}`);
      if (!creds?.email || !creds?.password) {
        setError("No saved sign-in found. Sign in with your password once to enable.");
        return;
      }
      setEmail(creds.email);
      const result = await onSignIn(creds.email, creds.password, true);
      const err = result && "error" in result ? result.error : undefined;
      if (err) setError(err);
    } catch {
      /* silent fallback — user can still use email/password */
    } finally {
      setBioBusy(false);
    }
  };

  return (
    <div className={className}>
      <DarkMobileAuthForm
        logoSrc={essexLogo}
        logoAlt={portalName}
        logoHeightPx={72}
        heroSrc={heroImage ?? defaultMobileHero}
        heroAlt={heroAlt || portalName}
        title={isForgot ? "Reset password" : "Welcome"}
        subtitle={isForgot ? "Enter your email and we'll send you a reset link." : ""}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        showPassword={showPw}
        setShowPassword={setShowPw}
        rememberMe={rememberMe}
        setRememberMe={setRememberMe}
        isForgot={isForgot}
        onForgotToggle={switchView}
        loading={loading}
        error={error}
        onSubmit={handleSubmit}
        biometricAvailable={Boolean(biometricScope) && bioAvailable && !isForgot}
        biometricLoading={bioBusy}
        onBiometric={handleBiometric}
        surface="light"
        heroOffsetY={-50}
        customFooter={footer}
      />
    </div>
  );
}
