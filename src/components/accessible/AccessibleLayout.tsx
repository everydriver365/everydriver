import { useEffect } from "react";
import { AccessibleHeader } from "./AccessibleHeader";
import { AccessibleFooter } from "./AccessibleFooter";
import { AccessibilityToolbar, applyAccessiblePrefs } from "./AccessibilityToolbar";

interface AccessibleLayoutProps {
  children: React.ReactNode;
}

export function AccessibleLayout({ children }: AccessibleLayoutProps) {
  useEffect(() => {
    // Re-apply persisted prefs on mount in case the toolbar mounts after
    try {
      const raw = localStorage.getItem("acc-prefs-v1");
      if (raw) applyAccessiblePrefs(JSON.parse(raw));
    } catch {}
  }, []);

  return (
    <div className="accessible-portal flex min-h-screen flex-col">
      <a href="#acc-main" className="acc-skip-link">Skip to content</a>
      <div className="acc-toolbar-bar">
        <div className="acc-container flex justify-end">
          <AccessibilityToolbar />
        </div>
      </div>
      <AccessibleHeader />
      <main id="acc-main" className="flex-1">{children}</main>
      <AccessibleFooter />
    </div>
  );
}
