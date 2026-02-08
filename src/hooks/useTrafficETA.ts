import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TrafficETA {
  durationMinutes: number;
  durationText: string;
  trafficCondition: string | null;
  delayMinutes: number;
  isLoading: boolean;
  error: string | null;
}

// Basic UK postcode validation (e.g. SW1A 1AA, SO14 2BT, LE11 2RR)
const UK_POSTCODE_REGEX = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

function isValidUKPostcode(postcode: string): boolean {
  return UK_POSTCODE_REGEX.test(postcode.trim());
}

export function useTrafficETA(destinationPostcode: string | null): TrafficETA {
  const [durationMinutes, setDurationMinutes] = useState<number>(0);
  const [durationText, setDurationText] = useState<string>("");
  const [trafficCondition, setTrafficCondition] = useState<string | null>(null);
  const [delayMinutes, setDelayMinutes] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!destinationPostcode || !isValidUKPostcode(destinationPostcode)) {
      setDurationMinutes(0);
      setDurationText("");
      setTrafficCondition(null);
      setDelayMinutes(0);
      if (destinationPostcode && !isValidUKPostcode(destinationPostcode)) {
        setError("Invalid postcode format");
      }
      return;
    }

    let isCancelled = false;

    const fetchETA = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Get current position
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error("Geolocation not supported"));
            return;
          }
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000, // Cache for 1 minute
          });
        });

        if (isCancelled) return;

        const { latitude, longitude } = position.coords;

        // Call edge function for ETA
        const { data, error: fnError } = await supabase.functions.invoke("calculate-traffic-eta", {
          body: {
            origin_lat: latitude,
            origin_lng: longitude,
            destination_postcode: destinationPostcode,
          },
        });

        if (isCancelled) return;

        if (fnError) {
          throw new Error(fnError.message);
        }

        if (data?.duration_minutes) {
          setDurationMinutes(data.duration_minutes);
          setDurationText(data.duration_text || `${data.duration_minutes} min`);
          setTrafficCondition(data.traffic_condition || null);
          setDelayMinutes(data.delay_minutes || 0);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error("Error fetching traffic ETA:", err);
          setError(err instanceof Error ? err.message : "Failed to get ETA");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchETA();

    // Refresh ETA every 3 minutes for traffic updates
    const interval = setInterval(fetchETA, 3 * 60 * 1000);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [destinationPostcode]);

  return { durationMinutes, durationText, trafficCondition, delayMinutes, isLoading, error };
}
