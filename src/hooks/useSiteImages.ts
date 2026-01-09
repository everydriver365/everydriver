import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SiteImage {
  id: string;
  image_key: string;
  image_url: string;
  alt_text: string | null;
  description: string | null;
  category: string | null;
  is_active: boolean;
}

export function useSiteImages() {
  const [images, setImages] = useState<Map<string, SiteImage>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      const { data, error } = await supabase
        .from("site_images")
        .select("*")
        .eq("is_active", true);

      if (!error && data) {
        const imageMap = new Map<string, SiteImage>();
        data.forEach((img) => {
          imageMap.set(img.image_key, img);
        });
        setImages(imageMap);
      }
      setLoading(false);
    };

    fetchImages();
  }, []);

  const getImage = (key: string, fallback: string): string => {
    const img = images.get(key);
    return img?.image_url && img.image_url.length > 0 ? img.image_url : fallback;
  };

  const getAlt = (key: string, fallback: string): string => {
    const img = images.get(key);
    return img?.alt_text || fallback;
  };

  return { images, loading, getImage, getAlt };
}
