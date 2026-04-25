import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from "react";

export type TextScale = "sm" | "md" | "lg" | "xl";

export interface AccessibilitySettings {
  textScale: TextScale;
  highContrast: boolean;
  reduceMotion: boolean;
  largeTapTargets: boolean;
}

const DEFAULTS: AccessibilitySettings = {
  textScale: "md",
  highContrast: false,
  reduceMotion: false,
  largeTapTargets: false,
};

const STORAGE_KEY = "dsm:accessibility:v1";

export const TEXT_SCALE_VALUES: Record<TextScale, number> = {
  sm: 0.9,
  md: 1,
  lg: 1.18,
  xl: 1.35,
};

export const TEXT_SCALE_LABELS: Record<TextScale, string> = {
  sm: "Small",
  md: "Default",
  lg: "Large",
  xl: "Extra Large",
};

interface AccessibilityContextValue extends AccessibilitySettings {
  setTextScale: (s: TextScale) => void;
  setHighContrast: (v: boolean) => void;
  setReduceMotion: (v: boolean) => void;
  setLargeTapTargets: (v: boolean) => void;
  reset: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

function readStored(): AccessibilitySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

/**
 * Apply accessibility state to <html>. We use a single CSS variable for the
 * text scale plus class hooks for the boolean toggles. The actual styling
 * lives in index.css, scoped to `.a11y-scope` (the instructor app shell).
 */
function applyToDocument(s: AccessibilitySettings) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--a11y-text-scale", String(TEXT_SCALE_VALUES[s.textScale]));
  root.classList.toggle("a11y-high-contrast", s.highContrast);
  root.classList.toggle("a11y-reduce-motion", s.reduceMotion);
  root.classList.toggle("a11y-large-tap", s.largeTapTargets);
  root.dataset.textScale = s.textScale;
  root.dataset.reduceMotion = s.reduceMotion ? "true" : "false";
}

// Apply immediately on module load so the very first paint reflects settings
if (typeof window !== "undefined") {
  applyToDocument(readStored());
}

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(() =>
    typeof window === "undefined" ? DEFAULTS : readStored()
  );

  useEffect(() => {
    applyToDocument(settings);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* ignore */
    }
  }, [settings]);

  const update = useCallback(
    <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) =>
      setSettings((prev) => ({ ...prev, [key]: value })),
    []
  );

  const value = useMemo<AccessibilityContextValue>(
    () => ({
      ...settings,
      setTextScale: (s) => update("textScale", s),
      setHighContrast: (v) => update("highContrast", v),
      setReduceMotion: (v) => update("reduceMotion", v),
      setLargeTapTargets: (v) => update("largeTapTargets", v),
      reset: () => setSettings(DEFAULTS),
    }),
    [settings, update]
  );

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) {
    return {
      ...DEFAULTS,
      setTextScale: () => {},
      setHighContrast: () => {},
      setReduceMotion: () => {},
      setLargeTapTargets: () => {},
      reset: () => {},
    } as AccessibilityContextValue;
  }
  return ctx;
}
