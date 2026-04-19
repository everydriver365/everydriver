// Force Vite dev server restart
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "leaflet/dist/leaflet.css";
import "./i18n";
import { ThemeProvider } from "./context/ThemeContext";
import { InstructorThemeProvider } from "./context/InstructorThemeContext";
import { AppErrorBoundary } from "@/components/common/AppErrorBoundary";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <InstructorThemeProvider>
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </InstructorThemeProvider>
  </ThemeProvider>
);
