import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface RoutePoint {
  id: string;
  pupilName: string;
  postcode: string;
  lat: number;
  lng: number;
  startTime: string;
  order: number;
}

interface UseTodayRouteReturn {
  points: RoutePoint[];
  totalStops: number;
  estimatedDriveMinutes: number;
  isLoading: boolean;
  error: string | null;
}

// Cache for geocoded postcodes
const geocodeCache = new Map<string, { lat: number; lng: number }>();

// Geocode a UK postcode using Nominatim
async function geocodePostcode(postcode: string): Promise<{ lat: number; lng: number } | null> {
  // Check cache first
  if (geocodeCache.has(postcode)) {
    return geocodeCache.get(postcode)!;
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(postcode)}&country=UK&format=json&limit=1`,
      {
        headers: {
          "User-Agent": "EveryDriver/1.0",
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (data.length === 0) return null;

    const result = {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    };

    // Cache the result
    geocodeCache.set(postcode, result);
    return result;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

// Calculate approximate drive time between points (rough estimate)
function estimateDriveTime(points: RoutePoint[]): number {
  if (points.length < 2) return 0;

  let totalMinutes = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];

    // Haversine formula for distance
    const R = 6371; // km
    const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
    const dLon = ((p2.lng - p1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((p1.lat * Math.PI) / 180) *
        Math.cos((p2.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // Assume average speed of 25 km/h in urban areas
    totalMinutes += (distance / 25) * 60;
  }

  return Math.round(totalMinutes);
}

export function useTodayRoute(instructorId: string | null | undefined): UseTodayRouteReturn {
  const [points, setPoints] = useState<RoutePoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!instructorId) {
      setPoints([]);
      return;
    }

    const fetchRoute = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const today = format(new Date(), "yyyy-MM-dd");

        const { data: lessons, error: queryError } = await supabase
          .from("scheduled_lessons")
          .select(`
            id,
            start_time,
            pickup_postcode,
            pickup_location,
            pupil:pupils(id, name, postcode)
          `)
          .eq("instructor_id", instructorId)
          .eq("lesson_date", today)
          .neq("status", "cancelled")
          .order("start_time", { ascending: true });

        if (queryError) throw queryError;

        if (!lessons || lessons.length === 0) {
          setPoints([]);
          setIsLoading(false);
          return;
        }

        // Geocode all pickup postcodes in parallel
        const geocodePromises = lessons.map(async (lesson, index) => {
          const postcode = lesson.pickup_postcode || (lesson.pupil as any)?.postcode;
          if (!postcode) return null;

          const coords = await geocodePostcode(postcode);
          if (!coords) return null;

          return {
            id: lesson.id,
            pupilName: (lesson.pupil as any)?.name || "Unknown",
            postcode,
            lat: coords.lat,
            lng: coords.lng,
            startTime: lesson.start_time,
            order: index,
          };
        });

        const results = await Promise.all(geocodePromises);
        const validPoints = results.filter((p): p is RoutePoint => p !== null);

        setPoints(validPoints);
      } catch (err) {
        console.error("Error fetching today's route:", err);
        setError("Failed to load route");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoute();
  }, [instructorId]);

  return {
    points,
    totalStops: points.length,
    estimatedDriveMinutes: estimateDriveTime(points),
    isLoading,
    error,
  };
}
