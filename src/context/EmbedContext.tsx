import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface EmbedContextValue {
  embed: boolean;
  /**
   * Navigate to a booking/checkout URL.
   * - In embed mode: breaks out of the iframe to the top window (or new tab fallback)
   *   so Square/Klarna/Clearpay/GoCardless hosted checkouts run first-party.
   * - Otherwise: standard SPA navigation.
   */
  bookNavigate: (href: string) => void;
}

const EmbedContext = createContext<EmbedContextValue | null>(null);

export function EmbedProvider({ embed, children }: { embed: boolean; children: ReactNode }) {
  const navigate = useNavigate();
  const value = useMemo<EmbedContextValue>(() => ({
    embed,
    bookNavigate: (href: string) => {
      if (!embed) { navigate(href); return; }
      const abs = new URL(href, window.location.origin).toString();
      try {
        if (window.top && window.top !== window.self) {
          window.top.location.href = abs;
          return;
        }
      } catch {
        // Cross-origin top access blocked — fall through to new tab.
      }
      window.open(abs, "_blank", "noopener,noreferrer");
    },
  }), [embed, navigate]);
  return <EmbedContext.Provider value={value}>{children}</EmbedContext.Provider>;
}

/**
 * Always-safe hook. Returns the provider value if present, otherwise a
 * non-embed default backed by react-router's navigate. Hooks are always
 * called in the same order regardless of provider presence.
 */
export function useEmbed(): EmbedContextValue {
  const ctx = useContext(EmbedContext);
  const navigate = useNavigate();
  if (ctx) return ctx;
  return { embed: false, bookNavigate: (href: string) => navigate(href) };
}
