/**
 * Unified biometric / quick-sign-in helper.
 *
 * Three modes:
 *  - Native (Capacitor / TestFlight iOS, Android): real Face ID / Touch ID /
 *    fingerprint via capacitor-native-biometric (Keychain / Keystore).
 *  - Wrapped app (Despia WebView, standalone PWA, iOS WKWebView): one-tap
 *    "Quick Sign In" using credentials stored in localStorage. The OS device
 *    passcode/biometric already gates access to the phone, so this is a
 *    pragmatic equivalent. The browser PasswordCredential API is unavailable
 *    in cross-origin iframes / WebViews, which is why we need this fallback.
 *  - Regular browser: PasswordCredential API for autofill where supported.
 */

import { Capacitor } from "@capacitor/core";
import {
  NativeBiometric,
  BiometryType,
} from "capacitor-native-biometric";

export type BiometricScope =
  | "instructor"
  | "pupil"
  | "admin"
  | "school";

const SERVER_PREFIX = "app.lovable.everydriver";

const serverFor = (scope: BiometricScope) => `${SERVER_PREFIX}.${scope}`;
const enabledKey = (scope: BiometricScope) => `${scope}-biometric-enabled`;
const wrappedStoreKey = (scope: BiometricScope) => `bio.${scope}.v1`;

export const isNativePlatform = () => Capacitor.isNativePlatform();

/**
 * True when running inside any non-browser shell where PasswordCredential is
 * unavailable: Capacitor, Despia, generic WebView, or a standalone PWA
 * installed to the home screen.
 */
export function isWrappedApp(): boolean {
  if (typeof window === "undefined") return false;
  if (isNativePlatform()) return true;
  const w = window as any;
  if (w.Despia || w.ReactNativeWebView) return true;
  const ua = navigator.userAgent || "";
  if (/Despia/i.test(ua)) return true;
  if (/; wv\)/i.test(ua)) return true;
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  if (isIOS && !/Safari/i.test(ua)) return true;
  try {
    if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
    if ((navigator as any).standalone === true) return true;
  } catch {}
  return false;
}

// ---- Wrapped credential store (lightly obfuscated, NOT real encryption) ----
function encode(value: string): string {
  try {
    return btoa(unescape(encodeURIComponent(value)));
  } catch {
    return value;
  }
}
function decode(value: string): string {
  try {
    return decodeURIComponent(escape(atob(value)));
  } catch {
    return value;
  }
}

function readWrappedStore(scope: BiometricScope): { email: string; password: string } | null {
  try {
    const raw = localStorage.getItem(wrappedStoreKey(scope));
    if (!raw) return null;
    const parsed = JSON.parse(decode(raw));
    if (!parsed?.email || !parsed?.password) return null;
    return { email: parsed.email, password: parsed.password };
  } catch {
    return null;
  }
}

function writeWrappedStore(scope: BiometricScope, email: string, password: string) {
  try {
    localStorage.setItem(wrappedStoreKey(scope), encode(JSON.stringify({ email, password })));
  } catch {
    // ignore storage errors
  }
}

function clearWrappedStore(scope: BiometricScope) {
  try {
    localStorage.removeItem(wrappedStoreKey(scope));
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------

/** Returns true if the device can offer biometric / quick sign-in. */
export async function isBiometricAvailable(scope: BiometricScope): Promise<boolean> {
  try {
    if (isNativePlatform()) {
      const result = await NativeBiometric.isAvailable();
      if (result.isAvailable) return true;
      // Even without OS biometrics, allow quick sign-in inside a native app.
      return !!readWrappedStore(scope);
    }
    if (isWrappedApp()) {
      return !!readWrappedStore(scope);
    }
    if (typeof window !== "undefined" && "credentials" in navigator && "PasswordCredential" in window) {
      return localStorage.getItem(enabledKey(scope)) === "true";
    }
    return false;
  } catch {
    return false;
  }
}

/** Friendly label for the available method. */
export async function getBiometryLabel(): Promise<string> {
  try {
    if (isNativePlatform()) {
      const { biometryType } = await NativeBiometric.isAvailable();
      switch (biometryType) {
        case BiometryType.FACE_ID:
          return "Face ID";
        case BiometryType.TOUCH_ID:
          return "Touch ID";
        case BiometryType.FACE_AUTHENTICATION:
          return "Face Unlock";
        case BiometryType.FINGERPRINT:
          return "Fingerprint";
        default:
          return "Quick Sign In";
      }
    }
    if (isWrappedApp()) return "Quick Sign In";
    return "Face ID / Touch ID";
  } catch {
    return "Quick Sign In";
  }
}

/** Persist credentials for future quick / biometric sign-in. */
export async function saveBiometricCredentials(
  scope: BiometricScope,
  email: string,
  password: string,
): Promise<void> {
  // Always seed the wrapped store — this is the only path that works in
  // Despia / WKWebView / iframes, and acts as a safe fallback elsewhere.
  writeWrappedStore(scope, email, password);
  localStorage.setItem(enabledKey(scope), "true");

  // Native: also store in the platform Keychain / Keystore behind biometrics.
  if (isNativePlatform()) {
    try {
      await NativeBiometric.setCredentials({
        username: email,
        password,
        server: serverFor(scope),
      });
    } catch (err) {
      console.warn("[biometricAuth] NativeBiometric.setCredentials failed", err);
    }
    return;
  }

  // Browser: best-effort PasswordCredential storage. Failures (e.g. cross-origin
  // iframe in the Lovable preview) are non-fatal — the wrapped store covers us.
  try {
    if (
      typeof window !== "undefined" &&
      "credentials" in navigator &&
      "PasswordCredential" in window
    ) {
      const PasswordCredentialClass = (window as any).PasswordCredential;
      const credential = new PasswordCredentialClass({
        id: email,
        password,
        name: `EveryDriver ${scope}`,
      });
      await navigator.credentials.store(credential);
    }
  } catch (err) {
    console.warn("[biometricAuth] PasswordCredential storage skipped", err);
  }
}

/** Reject after `ms` so a hung native bridge call cannot freeze the UI. */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

/** Prompt biometrics / fetch saved credentials. */
export async function getBiometricCredentials(
  scope: BiometricScope,
  promptReason = "Sign in",
): Promise<{ email: string; password: string } | null> {
  try {
    if (isNativePlatform()) {
      try {
        await withTimeout(
          NativeBiometric.verifyIdentity({
            reason: promptReason,
            title: "Unlock EveryDriver",
            subtitle: promptReason,
            description: "Use biometrics to sign in",
          }),
          15000,
          "Face ID",
        );
        const creds = await withTimeout(
          NativeBiometric.getCredentials({ server: serverFor(scope) }),
          5000,
          "Keychain lookup",
        );
        if (creds?.username && creds?.password) {
          return { email: creds.username, password: creds.password };
        }
      } catch (err) {
        // OS biometrics unavailable / cancelled / timed out — fall through.
        console.warn("[biometricAuth] native verifyIdentity failed", err);
      }
      return readWrappedStore(scope);
    }

    if (isWrappedApp()) {
      // No OS biometric API in Despia/WebView — return the stored credential
      // immediately. The phone's own lock screen is the security gate.
      return readWrappedStore(scope);
    }

    if (typeof window !== "undefined" && "credentials" in navigator) {
      const credential = await navigator.credentials.get({
        password: true,
        mediation: "optional",
      } as CredentialRequestOptions);
      if (credential && "password" in (credential as any)) {
        const pc = credential as any;
        if (pc.id && pc.password) return { email: pc.id, password: pc.password };
      }
    }
    return null;
  } catch (err) {
    console.warn("[biometricAuth] getBiometricCredentials failed", err);
    return null;
  }
}

/** Forget stored credentials (sign out / disable). */
export async function clearBiometricCredentials(scope: BiometricScope): Promise<void> {
  try {
    if (isNativePlatform()) {
      await NativeBiometric.deleteCredentials({ server: serverFor(scope) }).catch(() => undefined);
    }
  } finally {
    clearWrappedStore(scope);
    localStorage.removeItem(enabledKey(scope));
  }
}
