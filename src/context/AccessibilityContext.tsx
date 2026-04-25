import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

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
  lg: 1.15,
  xl: 1.3,
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

function applyToDocument(s: AccessibilitySettings) {
  const root = document.documentElement;
  root.style.setProperty("--a11y-text-scale", String(TEXT_SCALE_VALUES[s.textScale]));
  root.classList.toggle("a11y-high-contrast", s.highContrast);
  root.classList.toggle("a11y-reduce-motion", s.reduceMotion);
  root.classList.toggle("a11y-large-tap", s.largeTapTargets);
  root.dataset.reduceMotion = s.reduceMotion ? "true" : "false";
}

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    if (typeof window === "undefined") return DEFAULTS;
    return readStored();
  });

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

  const value: AccessibilityContextValue = {
    ...settings,
    setTextScale: (s) => update("textScale", s),
    setHighContrast: (v) => update("highContrast", v),
    setReduceMotion: (v) => update("reduceMotion", v),
    setLargeTapTargets: (v) => update("largeTapTargets", v),
    reset: () => setSettings(DEFAULTS),
  };

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) {
    // Safe fallback so isolated previews don't crash
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
