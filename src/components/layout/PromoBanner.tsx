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

export function PromoBanner() {
  const [promo, setPromo] = useState<PromoMessage | null>(null);
  const [isVisible, setIsVisible] = useState(true);

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
        {promo.link_url && promo.link_text && (
          <Link 
            to={promo.link_url} 
            className="inline-flex items-center font-semibold hover:underline whitespace-nowrap"
          >
            {promo.link_text}
            <ChevronRight className="h-4 w-4" />
          </Link>
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
