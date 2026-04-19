import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

type Mode = "light" | "dark";
const STORAGE_KEY = "dsm-instructor-theme";

interface Ctx {
  mode: Mode;
  toggle: () => void;
  setMode: (m: Mode) => void;
}

const InstructorThemeCtx = createContext<Ctx | undefined>(undefined);

function applyMode(mode: Mode) {
  // Apply to every .instructor-portal root currently in the DOM.
  const roots = document.querySelectorAll(".instructor-portal");
  roots.forEach((el) => {
    el.classList.toggle("dsm-dark", mode === "dark");
  });
}

export function InstructorThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Mode>(() => {
    if (typeof window === "undefined") return "light";
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "dark" ? "dark" : "light";
  });

  // Apply on mount and whenever mode changes. Also re-apply on route changes
  // (the instructor portal root may not exist at provider mount time).
  useEffect(() => {
    applyMode(mode);
    localStorage.setItem(STORAGE_KEY, mode);

    // Watch for newly-mounted .instructor-portal nodes (route changes).
    const observer = new MutationObserver(() => applyMode(mode));
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [mode]);

  const setMode = useCallback((m: Mode) => setModeState(m), []);
  const toggle = useCallback(() => setModeState((m) => (m === "dark" ? "light" : "dark")), []);

  return (
    <InstructorThemeCtx.Provider value={{ mode, toggle, setMode }}>
      {children}
    </InstructorThemeCtx.Provider>
  );
}

export function useInstructorTheme() {
  const ctx = useContext(InstructorThemeCtx);
  if (!ctx) {
    // Safe fallback so components don't crash if used outside provider.
    return {
      mode: "light" as Mode,
      toggle: () => {},
      setMode: () => {},
    };
  }
  return ctx;
}
