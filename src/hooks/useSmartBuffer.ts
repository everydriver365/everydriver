import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SmartBufferSettings {
  enabled: boolean;
  mode: string; // "flat" | "travel_time" | "travel_time_plus"
  paddingMinutes: number;
  flatBufferMinutes: number;
}

interface SmartBufferResult {
  bufferMinutes: number;
  isLoading: boolean;
  source: "flat" | "travel" | "fallback";
}

export function useSmartBufferSettings(instructorId: string) {
  const [settings, setSettings] = useState<SmartBufferSettings>({
    enabled: false,
    mode: "flat",
    paddingMinutes: 5,
    flatBufferMinutes: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!instructorId) return;
    (async () => {
      try {
        const { data } = await supabase
          .from("instructors")
          .select("buffer_minutes, smart_buffer_enabled, smart_buffer_mode, smart_buffer_padding_minutes")
          .eq("id", instructorId)
          .single();
        if (data) {
          const d = data as any;
          setSettings({
            enabled: d.smart_buffer_enabled ?? false,
            mode: d.smart_buffer_mode ?? "flat",
            paddingMinutes: d.smart_buffer_padding_minutes ?? 5,
            flatBufferMinutes: d.buffer_minutes ?? 0,
          });
        }
      } catch (e) {
        console.error("Error fetching smart buffer settings:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [instructorId]);

  return { settings, loading };
}

/**
 * Calculate the required buffer minutes between two postcodes,
 * respecting the instructor's smart buffer settings.
 */
export async function getSmartBufferMinutes(
  settings: SmartBufferSettings,
  fromPostcode: string | null | undefined,
  toPostcode: string | null | undefined
): Promise<SmartBufferResult> {
  // If smart buffer is disabled or mode is flat, use flat buffer
  if (!settings.enabled || settings.mode === "flat") {
    return {
      bufferMinutes: settings.flatBufferMinutes,
      isLoading: false,
      source: "flat",
    };
  }

  // Need both postcodes for travel calculation
  if (!fromPostcode || !toPostcode) {
    return {
      bufferMinutes: settings.flatBufferMinutes,
      isLoading: false,
      source: "fallback",
    };
  }

  try {
    const paddingMinutes = settings.mode === "travel_time_plus" ? settings.paddingMinutes : 0;

    const { data, error } = await supabase.functions.invoke("check-travel-buffer", {
      body: {
        from_postcode: fromPostcode,
        to_postcode: toPostcode,
        padding_minutes: paddingMinutes,
      },
    });

    if (error || !data?.travel_minutes) {
      // Fallback to flat buffer on error
      return {
        bufferMinutes: settings.flatBufferMinutes,
        isLoading: false,
        source: "fallback",
      };
    }

    return {
      bufferMinutes: data.required_minutes ?? data.travel_minutes,
      isLoading: false,
      source: "travel",
    };
  } catch {
    return {
      bufferMinutes: settings.flatBufferMinutes,
      isLoading: false,
      source: "fallback",
    };
  }
}
