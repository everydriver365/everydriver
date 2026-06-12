// Force Vite dev server restart
declare const __BUILD_TIME__: string;

// Boot probe FIRST — before any other import side effects — so we can catch
// errors thrown during module evaluation inside the Despia/WKWebView wrapper.
import { installBootProbe, bootProbeLog, markBootProbeMounted } from "./lib/bootProbe";
installBootProbe();

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "leaflet/dist/leaflet.css";
import "./i18n";
import { ThemeProvider } from "./context/ThemeContext";
import { InstructorThemeProvider } from "./context/InstructorThemeContext";
import { AppErrorBoundary } from "@/components/common/AppErrorBoundary";
import { WhitelabelTheme } from "@/components/WhitelabelTheme";
import { detectNativeWrapper } from "@/hooks/useIsNativeWrapper";
import { installQueryBudget } from "@/lib/queryBudget";
import { enforceRememberMeOnBoot } from "@/lib/sessionPersistence";
import { installBundleRefresh } from "@/lib/bundleRefresh";

bootProbeLog("imports resolved");

// Honour the "Remember me" choice before any auth-gated UI mounts.
void enforceRememberMeOnBoot();

const __isWrapper = typeof window !== "undefined" && detectNativeWrapper();

// When the app is loaded inside a native wrapper (Despia / Capacitor / WebView)
// unregister any service workers AND clear Cache Storage FIRST — before any
// bundle-refresh logic runs — so cached assets from a previous browser/PWA
// visit don't pin the wrapper to a stale bundle or hijack page navigations.
// Native push and asset delivery are handled by the wrapper itself.
if (__isWrapper) {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister().catch(() => {}));
    }).catch(() => {});
  }
  if ("caches" in window) {
    caches.keys().then((keys) => {
      keys.forEach((k) => caches.delete(k).catch(() => {}));
    }).catch(() => {});
  }
  try {
    (window as unknown as { __BUILD_TIME__?: string }).__BUILD_TIME__ =
      typeof __BUILD_TIME__ === "string" ? __BUILD_TIME__ : undefined;
    // eslint-disable-next-line no-console
    console.info("[build]", (window as unknown as { __BUILD_TIME__?: string }).__BUILD_TIME__);
  } catch {
    /* ignore */
  }
}

// Wire cache-busting only in browsers / PWAs. Despia auto-pulls the latest
// published bundle on cold start, so the in-app hash-check + hard-reload loop
// is both redundant and unsafe inside the WebView (likely cause of the
// TestFlight white screen after splash).
if (!__isWrapper) {
  installBundleRefresh();
}

if (import.meta.env.DEV) {
  installQueryBudget();
}

// Configure native status bar to match the page background instead of black.
if (typeof window !== "undefined" && detectNativeWrapper()) {
  import("@capacitor/status-bar")
    .then(({ StatusBar, Style }) => {
      StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
      StatusBar.setBackgroundColor({ color: "#F4F7F6" }).catch(() => {});
      // Light background → dark content (Style.Dark = dark text/icons)
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    })
    .catch(() => {});
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <InstructorThemeProvider>
      <AppErrorBoundary>
        <WhitelabelTheme />
        <App />
      </AppErrorBoundary>
    </InstructorThemeProvider>
  </ThemeProvider>
);

// Signal a successful React mount so the boot probe can auto-hide.
// Wrapped in rAF so we run after the first paint, not just after createRoot returns.
if (typeof requestAnimationFrame !== "undefined") {
  requestAnimationFrame(() => markBootProbeMounted());
} else {
  setTimeout(() => markBootProbeMounted(), 0);
}

