import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface NewsItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  imageUrl: string | null;
  category: string;
}

export function useDVSANews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNews() {
      try {
        setLoading(true);
        const { data, error } = await supabase.functions.invoke('fetch-dvsa-news');
        
        if (error) {
          console.error('Error fetching DVSA news:', error);
          setError(error.message);
          return;
        }

        if (data?.success && data?.items) {
          setNews(data.items);
        } else {
          setError(data?.error || 'Failed to fetch news');
        }
      } catch (err) {
        console.error('Error fetching DVSA news:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchNews();
  }, []);

  return { news, loading, error };
}
