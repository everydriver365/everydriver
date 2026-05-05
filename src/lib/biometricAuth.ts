/**
 * Unified biometric authentication helper.
 *
 * - On native (Capacitor / TestFlight iOS, Android): uses capacitor-native-biometric
 *   to store credentials in the iOS Keychain / Android Keystore, gated behind Face ID /
 *   Touch ID / fingerprint.
 * - On web: falls back to the Credential Management API (PasswordCredential) so
 *   browsers/iOS Keychain can offer autofill.
 *
 * One helper, multiple "scopes" (instructor, pupil, admin, school) so each portal
 * stores its own credential under a stable server identifier.
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

export const isNativePlatform = () => Capacitor.isNativePlatform();

/** Returns true if the device can perform biometric auth (Face ID / Touch ID / fingerprint). */
export async function isBiometricAvailable(scope: BiometricScope): Promise<boolean> {
  try {
    if (isNativePlatform()) {
      const result = await NativeBiometric.isAvailable();
      return !!result.isAvailable;
    }
    // Web: only show the button if we previously stored credentials via PasswordCredential.
    if (typeof window !== "undefined" && "credentials" in navigator && "PasswordCredential" in window) {
      return localStorage.getItem(enabledKey(scope)) === "true";
    }
    return false;
  } catch {
    return false;
  }
}

/** Returns a friendly label for the available biometry. */
export async function getBiometryLabel(): Promise<string> {
  try {
    if (!isNativePlatform()) return "Face ID / Touch ID";
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
        return "Biometrics";
    }
  } catch {
    return "Biometrics";
  }
}

/** Persist credentials behind biometric protection (call this on a successful password login). */
export async function saveBiometricCredentials(
  scope: BiometricScope,
  email: string,
  password: string,
): Promise<void> {
  try {
    if (isNativePlatform()) {
      await NativeBiometric.setCredentials({
        username: email,
        password,
        server: serverFor(scope),
      });
      localStorage.setItem(enabledKey(scope), "true");
      return;
    }
    if (typeof window !== "undefined" && "credentials" in navigator && "PasswordCredential" in window) {
      const PasswordCredentialClass = (window as any).PasswordCredential;
      const credential = new PasswordCredentialClass({
        id: email,
        password,
        name: `EveryDriver ${scope}`,
      });
      await navigator.credentials.store(credential);
      localStorage.setItem(enabledKey(scope), "true");
    }
  } catch (err) {
    console.warn("[biometricAuth] saveBiometricCredentials failed", err);
  }
}

/** Prompt biometrics and return saved credentials. Returns null if cancelled / unavailable. */
export async function getBiometricCredentials(
  scope: BiometricScope,
  promptReason = "Sign in",
): Promise<{ email: string; password: string } | null> {
  try {
    if (isNativePlatform()) {
      await NativeBiometric.verifyIdentity({
        reason: promptReason,
        title: "Unlock EveryDriver",
        subtitle: promptReason,
        description: "Use biometrics to sign in",
      });
      const creds = await NativeBiometric.getCredentials({ server: serverFor(scope) });
      if (!creds?.username || !creds?.password) return null;
      return { email: creds.username, password: creds.password };
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

/** Forget stored biometric credentials (e.g. on logout / disable). */
export async function clearBiometricCredentials(scope: BiometricScope): Promise<void> {
  try {
    if (isNativePlatform()) {
      await NativeBiometric.deleteCredentials({ server: serverFor(scope) }).catch(() => undefined);
    }
  } finally {
    localStorage.removeItem(enabledKey(scope));
  }
}
