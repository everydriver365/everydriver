import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SiteSetting {
  id: string;
  setting_key: string;
  setting_value: string | null;
  setting_type: string;
  label: string;
  description: string | null;
  display_order: number;
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .order("display_order");

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error("Error fetching site settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSetting = (key: string): string => {
    const setting = settings.find(s => s.setting_key === key);
    return setting?.setting_value || "";
  };

  const getSettingsMap = (): Record<string, string> => {
    return settings.reduce((acc, s) => {
      acc[s.setting_key] = s.setting_value || "";
      return acc;
    }, {} as Record<string, string>);
  };

  return { settings, loading, getSetting, getSettingsMap, refetch: fetchSettings };
}
