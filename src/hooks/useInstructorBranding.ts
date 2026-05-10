import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  resolveInstructorBranding,
  type BrandingDescriptor,
  type BrandingSource,
} from "@/lib/resolveInstructorBranding";

export interface InstructorBranding {
  id: string;
  app_slug: string;
  business_name: string | null;
  name: string | null;
  logo_url: string | null;
  brand_colour: string | null;
  secondary_colour: string | null;
  phone: string | null;
  email: string | null;
  location_name: string | null;
  home_postcode: string | null;
  custom_domain: string | null;
  custom_domain_verified: boolean | null;
  website_theme: string | null;
  website_font: string | null;
  website_header_style: string | null;
  website_header_bg: string | null;
  website_button_color: string | null;
  website_footer_bg: string | null;
  website_text_color: string | null;
  website_heading_color: string | null;
  website_menu_text_color: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  linkedin_url: string | null;
  personal_website_url: string | null;
}

interface State {
  loading: boolean;
  instructor: InstructorBranding | null;
  source: BrandingSource;
  descriptor: BrandingDescriptor;
  error: string | null;
}

const SELECT_COLUMNS =
  "id, app_slug, business_name, name, logo_url, brand_colour, secondary_colour, phone, email, location_name, home_postcode, custom_domain, custom_domain_verified, website_theme, website_font, website_header_style, website_header_bg, website_button_color, website_footer_bg, website_text_color, website_heading_color, website_menu_text_color, facebook_url, instagram_url, twitter_url, linkedin_url, personal_website_url";

const cache = new Map<string, InstructorBranding | null>();

function cacheKey(d: BrandingDescriptor): string {
  if (d.source === "custom-domain" && d.customDomain) return `host:${d.customDomain}`;
  if (d.slug) return `slug:${d.slug}`;
  return "none";
}

async function fetchBranding(d: BrandingDescriptor): Promise<InstructorBranding | null> {
  if (d.source === "custom-domain" && d.customDomain) {
    const { data } = await supabase
      .from("public_instructors")
      .select(SELECT_COLUMNS)
      .eq("custom_domain", d.customDomain)
      .eq("custom_domain_verified", true)
      .maybeSingle();
    return (data as InstructorBranding | null) ?? null;
  }
  if (d.slug) {
    const { data } = await supabase
      .from("public_instructors")
      .select(SELECT_COLUMNS)
      .eq("app_slug", d.slug)
      .maybeSingle();
    return (data as InstructorBranding | null) ?? null;
  }
  return null;
}

/**
 * Resolve the instructor that owns the current page (by hostname or
 * `/i/{slug}` path) and return their branding row from
 * `public_instructors`. Cached by slug/host across the session.
 *
 * Pass `slugOverride` to force a specific slug (used by admin previews
 * and the `:slug` route params where the URL is the source of truth).
 */
export function useInstructorBranding(slugOverride?: string): State {
  const { pathname } = useLocation();
  const descriptor = slugOverride
    ? ({
        source: "path" as const,
        slug: slugOverride,
        customDomain: null,
        host: typeof window !== "undefined" ? window.location.hostname : "",
      })
    : resolveInstructorBranding(undefined, pathname);

  const key = cacheKey(descriptor);
  const cached = cache.get(key);

  const [state, setState] = useState<State>(() => ({
    loading: cached === undefined,
    instructor: cached ?? null,
    source: descriptor.source,
    descriptor,
    error: null,
  }));

  useEffect(() => {
    let cancelled = false;
    const k = cacheKey(descriptor);
    const hit = cache.get(k);
    if (hit !== undefined) {
      setState({
        loading: false,
        instructor: hit,
        source: descriptor.source,
        descriptor,
        error: null,
      });
      return;
    }
    setState((s) => ({ ...s, loading: true, descriptor, source: descriptor.source }));
    fetchBranding(descriptor)
      .then((row) => {
        cache.set(k, row);
        if (!cancelled) {
          setState({
            loading: false,
            instructor: row,
            source: descriptor.source,
            descriptor,
            error: null,
          });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setState({
            loading: false,
            instructor: null,
            source: descriptor.source,
            descriptor,
            error: err?.message ?? "Failed to load branding",
          });
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return state;
}
