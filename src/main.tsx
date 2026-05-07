// Force Vite dev server restart
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "leaflet/dist/leaflet.css";
import "./i18n";
import { ThemeProvider } from "./context/ThemeContext";
import { InstructorThemeProvider } from "./context/InstructorThemeContext";
import { AppErrorBoundary } from "@/components/common/AppErrorBoundary";
import { detectNativeWrapper } from "@/hooks/useIsNativeWrapper";
import { installQueryBudget } from "@/lib/queryBudget";
import { enforceRememberMeOnBoot } from "@/lib/sessionPersistence";

// Honour the "Remember me" choice before any auth-gated UI mounts.
void enforceRememberMeOnBoot();

if (import.meta.env.DEV) {
  installQueryBudget();
}

// When the app is loaded inside a native wrapper (Despia / Capacitor / WebView)
// unregister any service workers so cached assets and Web Push handlers from a
// previous browser visit don't interfere with the wrapped app. Native push and
// asset delivery are handled by the wrapper itself.
if (typeof window !== "undefined" && detectNativeWrapper()) {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister().catch(() => {}));
    }).catch(() => {});
  }
}

// Configure native status bar to match the page background instead of black.
if (typeof window !== "undefined" && detectNativeWrapper()) {
  import("@capacitor/status-bar")
    .then(({ StatusBar, Style }) => {
      StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
      StatusBar.setBackgroundColor({ color: "#EEF1F5" }).catch(() => {});
      StatusBar.setStyle({ style: Style.Light }).catch(() => {});
    })
    .catch(() => {});
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <InstructorThemeProvider>
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </InstructorThemeProvider>
  </ThemeProvider>
);

