import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useHeroVideo() {
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [posterUrl, setPosterUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHeroVideo = async () => {
      setLoading(true);
      
      // Fetch hero video from site_images
      const { data: videoData } = await supabase
        .from("site_images")
        .select("image_url")
        .eq("image_key", "hero_video_mobile")
        .maybeSingle();

      // Fetch hero video poster from site_images
      const { data: posterData } = await supabase
        .from("site_images")
        .select("image_url")
        .eq("image_key", "hero_video_poster")
        .maybeSingle();

      setVideoUrl(videoData?.image_url || "");
      setPosterUrl(posterData?.image_url || "");
      setLoading(false);
    };

    fetchHeroVideo();
  }, []);

  return { videoUrl, posterUrl, loading };
}
