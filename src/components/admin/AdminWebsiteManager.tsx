import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ExternalLink, Globe, Loader2, PencilRuler, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MiniWebsiteFullEditor } from "./MiniWebsiteFullEditor";
import { toast } from "sonner";

interface MiniWebsite {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  app_slug: string | null;
  website_theme: string | null;
  website_font: string | null;
  website_header_style: string | null;
  website_header_bg?: string | null;
  custom_domain: string | null;
  custom_domain_verified: boolean | null;
  is_active: boolean;
  created_at: string;
  brand_colour: string | null;
  secondary_colour: string | null;
  website_button_color: string | null;
  website_footer_bg: string | null;
  website_text_color?: string | null;
  website_heading_color?: string | null;
  website_menu_text_color?: string | null;
  hero_overlay_color?: string | null;
  hero_overlay_opacity?: number | null;
  hero_show_logo?: boolean | null;
  logo_url: string | null;
  hero_image_url: string | null;
  bio: string | null;
  mini_website_domain_id: string | null;
}

interface DomainOrder {
  id: string;
  domain_name: string;
  status: string;
  mini_website_linked: boolean;
}

interface AdminWebsiteManagerProps {
  instructorId: string;
  instructorSlug: string;
  instructorName: string;
}

export function AdminWebsiteManager({ instructorId, instructorSlug, instructorName }: AdminWebsiteManagerProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [website, setWebsite] = useState<MiniWebsite | null>(null);
  const [domains, setDomains] = useState<DomainOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageTypes, setPageTypes] = useState<string[]>([]);

  const fetchPageHealth = async () => {
    const { data } = await supabase
      .from("instructor_website_pages")
      .select("page_type, is_published")
      .eq("instructor_id", instructorId);
    setPageTypes(((data || []) as { page_type: string; is_published: boolean }[]).filter(p => p.is_published).map(p => p.page_type));
  };


  const baseUrl = useMemo(() => window.location.origin, []);

  const fetchWebsite = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("instructors")
        .select(
          "id, name, email, phone, app_slug, website_theme, website_font, website_header_style, website_header_bg, custom_domain, custom_domain_verified, is_active, created_at, brand_colour, secondary_colour, website_button_color, website_footer_bg, website_text_color, website_heading_color, website_menu_text_color, hero_overlay_color, hero_overlay_opacity, hero_show_logo, logo_url, hero_image_url, bio, mini_website_domain_id"
        )
        .eq("id", instructorId)
        .single();

      if (error) throw error;
      setWebsite(data as MiniWebsite);
    } catch (e) {
      console.error("Failed to load instructor website:", e);
      toast.error("Failed to load mini website details");
    } finally {
      setLoading(false);
    }
  };

  const fetchDomains = async () => {
    try {
      const { data, error } = await supabase
        .from("domain_orders")
        .select("id, domain_name, status, mini_website_linked")
        .in("status", ["active", "completed"])
        .order("domain_name");
      if (error) throw error;
      setDomains((data || []) as DomainOrder[]);
    } catch (e) {
      console.error("Failed to load domains:", e);
    }
  };

  useEffect(() => {
    // Preload data so opening is instant.
    fetchWebsite();
    fetchDomains();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instructorId]);

  const handleOpenEditor = async () => {
    if (!website) {
      await fetchWebsite();
    }
    setIsEditorOpen(true);
  };

  const handleSaveComplete = async () => {
    // Refresh data but keep editor open
    await fetchWebsite();
    await fetchDomains();
  };

  if (isEditorOpen && website) {
    return (
      <MiniWebsiteFullEditor
        website={website}
        domains={domains}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveComplete}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Mini Website - {instructorName}
        </h3>
        <a
          href={`${baseUrl}/i/${instructorSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          View Site <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      <div className="flex items-center gap-2">
        <Button type="button" onClick={handleOpenEditor} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PencilRuler className="h-4 w-4 mr-2" />}
          Open full-screen editor
        </Button>
        {!website && !loading && (
          <Button type="button" variant="outline" onClick={fetchWebsite}>
            Reload
          </Button>
        )}
      </div>
    </div>
  );
}
