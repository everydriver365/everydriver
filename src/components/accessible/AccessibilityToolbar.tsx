import { useEffect, useState } from "react";
import { Type, Contrast } from "lucide-react";

type TextSize = "default" | "large" | "xlarge";

const STORAGE_KEY = "acc-prefs-v1";

interface Prefs {
  textSize: TextSize;
  highContrast: boolean;
}

function loadPrefs(): Prefs {
  if (typeof window === "undefined") return { textSize: "default", highContrast: false };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { textSize: "default", highContrast: false };
    return JSON.parse(raw);
  } catch {
    return { textSize: "default", highContrast: false };
  }
}

export function applyAccessiblePrefs(prefs: Prefs) {
  const root = document.querySelector(".accessible-portal");
  if (!root) return;
  root.classList.remove("text-default", "text-large", "text-xlarge", "high-contrast");
  root.classList.add(`text-${prefs.textSize}`);
  if (prefs.highContrast) root.classList.add("high-contrast");
}

export function AccessibilityToolbar() {
  const [prefs, setPrefs] = useState<Prefs>({ textSize: "default", highContrast: false });

  useEffect(() => {
    const p = loadPrefs();
    setPrefs(p);
    applyAccessiblePrefs(p);
  }, []);

  const update = (next: Prefs) => {
    setPrefs(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    applyAccessiblePrefs(next);
  };

  const cycleSize = () => {
    const order: TextSize[] = ["default", "large", "xlarge"];
    const i = order.indexOf(prefs.textSize);
    update({ ...prefs, textSize: order[(i + 1) % order.length] });
  };

  const sizeLabel = prefs.textSize === "default" ? "A" : prefs.textSize === "large" ? "A+" : "A++";

  return (
    <div className="acc-toolbar" role="toolbar" aria-label="Accessibility preferences">
      <button
        type="button"
        onClick={cycleSize}
        className="acc-toolbar-btn"
        aria-label={`Text size: ${sizeLabel}. Click to change.`}
      >
        <Type aria-hidden="true" className="h-4 w-4" />
        <span className="font-bold">{sizeLabel}</span>
      </button>
      <button
        type="button"
        onClick={() => update({ ...prefs, highContrast: !prefs.highContrast })}
        className="acc-toolbar-btn"
        aria-pressed={prefs.highContrast}
        aria-label="Toggle high contrast"
      >
        <Contrast aria-hidden="true" className="h-4 w-4" />
        <span>{prefs.highContrast ? "Standard contrast" : "High contrast"}</span>
      </button>
    </div>
  );
}
