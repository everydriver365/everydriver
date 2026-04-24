import { useEffect, useState } from "react";

/**
 * Detects when the app is running inside a native wrapper (Despia, Capacitor,
 * or any other WebView shell) rather than a regular browser.
 *
 * Inside a native wrapper we want to:
 *  - skip Web Push / service worker registration (native push is used instead)
 *  - hide PWA "Add to Home Screen" prompts
 *  - swap `window.close()` for in-app navigation
 *  - warn users about background-execution limits (e.g. lesson GPS recording)
 */

declare global {
  interface Window {
    Despia?: unknown;
    Capacitor?: unknown;
    ReactNativeWebView?: unknown;
  }
}

export function detectNativeWrapper(): boolean {
  if (typeof window === "undefined") return false;

  // Explicit injected globals from common wrappers
  if (window.Despia || window.Capacitor || window.ReactNativeWebView) return true;

  const ua = navigator.userAgent || "";

  // Despia identifies itself in the UA string
  if (/Despia/i.test(ua)) return true;

  // Generic WebView heuristics
  // iOS WKWebView: missing "Safari" token while still being on iOS
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  if (isIOS && !/Safari/i.test(ua)) return true;

  // Android WebView identifies itself with "; wv)"
  if (/; wv\)/i.test(ua)) return true;

  return false;
}

export function useIsNativeWrapper(): boolean {
  const [isWrapper, setIsWrapper] = useState<boolean>(() => detectNativeWrapper());

  useEffect(() => {
    // Re-check after mount in case wrapper injects globals asynchronously
    const t = setTimeout(() => setIsWrapper(detectNativeWrapper()), 100);
    return () => clearTimeout(t);
  }, []);

  return isWrapper;
}
