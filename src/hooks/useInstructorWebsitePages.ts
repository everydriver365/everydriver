import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ContentBlock {
  type: "text" | "features" | "image" | "gallery";
  title?: string;
  content?: string;
  items?: string[];
  image_url?: string;
  images?: string[];
}

export interface WebsitePage {
  id: string;
  instructor_id: string;
  page_type: "home" | "about" | "services" | "reviews" | "contact";
  page_title: string;
  hero_heading: string | null;
  hero_subheading: string | null;
  hero_image_url: string | null;
  content_blocks: ContentBlock[];
  meta_title: string | null;
  meta_description: string | null;
  is_published: boolean;
  display_order: number;
}

export function useInstructorWebsitePages(instructorId: string | undefined) {
  const [pages, setPages] = useState<WebsitePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPages = async () => {
    if (!instructorId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("instructor_website_pages")
        .select("*")
        .eq("instructor_id", instructorId)
        .order("display_order");

      if (error) throw error;

      setPages(
        (data || []).map((p) => ({
          ...p,
          page_type: p.page_type as WebsitePage["page_type"],
          content_blocks: (p.content_blocks as unknown as ContentBlock[]) || [],
        }))
      );
    } catch (err) {
      console.error("Error fetching website pages:", err);
      setError("Failed to load website pages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, [instructorId]);

  const updatePage = async (pageId: string, updates: Partial<WebsitePage>) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dbUpdates: any = { ...updates };
      const { error } = await supabase
        .from("instructor_website_pages")
        .update(dbUpdates)
        .eq("id", pageId);

      if (error) throw error;

      setPages((prev) =>
        prev.map((p) => (p.id === pageId ? { ...p, ...updates } : p))
      );
      return { success: true };
    } catch (err) {
      console.error("Error updating page:", err);
      return { success: false, error: "Failed to update page" };
    }
  };

  return { pages, loading, error, refetch: fetchPages, updatePage };
}

export function useWebsitePage(slug: string | undefined, pageType: string) {
  const [page, setPage] = useState<WebsitePage | null>(null);
  const [instructor, setInstructor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;

    const fetchData = async () => {
      try {
        // First get the instructor
        // Don't require is_active for mini-website viewing - only for public directory listings
        const { data: instructorData, error: instructorError } = await supabase
          .from("public_instructors")
          .select("*")
          .eq("app_slug", slug)
          .maybeSingle();

        if (instructorError || !instructorData) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setInstructor(instructorData);

        // Then get the specific page. Don't 404 just because the row is
        // missing or unpublished — fall back to a synthesised default so the
        // mini-site keeps working while the instructor sets things up.
        const { data: pageData } = await supabase
          .from("instructor_website_pages")
          .select("*")
          .eq("instructor_id", instructorData.id)
          .eq("page_type", pageType)
          .maybeSingle();

        if (pageData) {
          setPage({
            ...pageData,
            page_type: pageData.page_type as WebsitePage["page_type"],
            content_blocks: (pageData.content_blocks as unknown as ContentBlock[]) || [],
          });
        } else {
          // Synthesised fallback — title-cased page type with empty content.
          const title = pageType.charAt(0).toUpperCase() + pageType.slice(1);
          setPage({
            id: `fallback-${pageType}`,
            instructor_id: instructorData.id,
            page_type: pageType as WebsitePage["page_type"],
            page_title: title,
            hero_heading: title,
            hero_subheading: null,
            hero_image_url: null,
            content_blocks: [],
            meta_title: null,
            meta_description: null,
            is_published: true,
            display_order: 0,
          });
        }
      } catch (error) {
        console.error("Error fetching page:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, pageType]);

  return { page, instructor, loading, notFound };
}
