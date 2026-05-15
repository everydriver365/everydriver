import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PromoMessage {
  id: string;
  message: string;
  link_url: string | null;
  link_text: string | null;
}

function resolvePromoLink(linkUrl: string): { href: string; external: boolean } {
  if (typeof window === "undefined") {
    return { href: linkUrl, external: /^https?:\/\//i.test(linkUrl) };
  }

  try {
    const parsed = new URL(linkUrl, window.location.origin);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    const isCurrentHost = parsed.origin === window.location.origin;
    const isLegacyTestSwapLink = host === "everydriver.co.uk" && parsed.pathname === "/test-swap";

    if (isCurrentHost || isLegacyTestSwapLink) {
      return { href: `${parsed.pathname}${parsed.search}${parsed.hash}`, external: false };
    }

    return { href: parsed.href, external: true };
  } catch {
    return { href: linkUrl, external: /^https?:\/\//i.test(linkUrl) };
  }
}

export function PromoBanner() {
  const [promo, setPromo] = useState<PromoMessage | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const promoLink = promo?.link_url ? resolvePromoLink(promo.link_url) : null;

  useEffect(() => {
    async function fetchPromo() {
      const { data, error } = await supabase
        .from("promotional_messages")
        .select("id, message, link_url, link_text")
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .limit(1)
        .single();

      if (!error && data) {
        setPromo(data);
      }
    }
    fetchPromo();
  }, []);

  if (!promo || !isVisible) return null;

  return (
    <div className="bg-[hsl(var(--promo-banner))] text-[hsl(var(--promo-banner-foreground))]">
      <div className="container py-2 flex items-center justify-center gap-3 text-sm">
        <span className="text-center font-medium">{promo.message}</span>
        {promoLink && promo.link_text && (
          promoLink.external ? (
            <a
              href={promoLink.href}
              className="inline-flex items-center font-semibold hover:underline whitespace-nowrap"
            >
              {promo.link_text}
              <ChevronRight className="h-4 w-4" />
            </a>
          ) : (
            <Link 
              to={promoLink.href} 
              className="inline-flex items-center font-semibold hover:underline whitespace-nowrap"
            >
              {promo.link_text}
              <ChevronRight className="h-4 w-4" />
            </Link>
          )
        )}
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute right-4 p-1 hover:bg-white/20 rounded transition-colors hidden md:block"
          aria-label="Close promotion"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
