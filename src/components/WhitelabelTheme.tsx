import { useEffect } from "react";
import { getWhitelabelConfig } from "@/lib/whitelabel";

/**
 * Applies a per-whitelabel CSS token override at the document root.
 * Currently sets --primary / --ring to the Winchester brand blue (#08507f)
 * when on a whitelabel domain. This cascades to bg-primary, text-primary,
 * focus rings, etc., without touching individual components.
 */
const WHITELABEL_PRIMARY_HSL: Record<string, string> = {
  "winchesterdrivingschool.co.uk": "202 89% 26%", // #08507f
};

export function WhitelabelTheme() {
  useEffect(() => {
    const config = getWhitelabelConfig();
    if (!config) return;
    const hsl = WHITELABEL_PRIMARY_HSL[config.host];
    if (!hsl) return;

    const root = document.documentElement;
    const prevPrimary = root.style.getPropertyValue("--primary");
    const prevRing = root.style.getPropertyValue("--ring");
    root.style.setProperty("--primary", hsl);
    root.style.setProperty("--ring", hsl);

    return () => {
      if (prevPrimary) root.style.setProperty("--primary", prevPrimary);
      else root.style.removeProperty("--primary");
      if (prevRing) root.style.setProperty("--ring", prevRing);
      else root.style.removeProperty("--ring");
    };
  }, []);

  return null;
}
