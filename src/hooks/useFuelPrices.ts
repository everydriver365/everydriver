import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface FuelStation {
  name: string;
  brand: string;
  address: string;
  postcode: string;
  lat: number;
  lng: number;
  distance_km: number;
  distance_miles: number;
  prices: {
    E10?: number;
    E5?: number;
    B7?: number;
    SDV?: number;
  };
  updated_at: string;
}

interface UseFuelPricesResult {
  stations: FuelStation[];
  cheapest: FuelStation | null;
  nearest: FuelStation | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  location: string | null;
  fuelType: string;
  setFuelType: (type: string) => void;
  useDeviceLocation: boolean;
  setUseDeviceLocation: (v: boolean) => void;
  locating: boolean;
}

const CACHE_KEY = "fuel_prices_cache";
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

interface CachedFuelPrices {
  stations: FuelStation[];
  cheapest: FuelStation | null;
  nearest: FuelStation | null;
  timestamp: number;
  instructorId: string;
  location: string | null;
  fuelType: string;
}

function getCachedPrices(instructorId: string, fuelType: string): CachedFuelPrices | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const parsed: CachedFuelPrices = JSON.parse(cached);
    if (parsed.instructorId !== instructorId) return null;
    if (parsed.fuelType !== fuelType) return null;
    if (Date.now() - parsed.timestamp > CACHE_DURATION_MS) return null;
    
    return parsed;
  } catch {
    return null;
  }
}

function setCachedPrices(
  instructorId: string,
  stations: FuelStation[],
  cheapest: FuelStation | null,
  nearest: FuelStation | null,
  location: string | null,
  fuelType: string
): void {
  try {
    const cache: CachedFuelPrices = {
      stations,
      cheapest,
      nearest,
      timestamp: Date.now(),
      instructorId,
      location,
      fuelType,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage errors
  }
}

export function useFuelPrices(instructorId: string | undefined): UseFuelPricesResult {
  const [stations, setStations] = useState<FuelStation[]>([]);
  const [cheapest, setCheapest] = useState<FuelStation | null>(null);
  const [nearest, setNearest] = useState<FuelStation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [fuelType, setFuelType] = useState<string>("E10");
  const [useDeviceLocation, setUseDeviceLocation] = useState<boolean>(() => {
    try { return localStorage.getItem("fuel_use_device_location") === "1"; } catch { return false; }
  });
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    try { localStorage.setItem("fuel_use_device_location", useDeviceLocation ? "1" : "0"); } catch {}
  }, [useDeviceLocation]);

  const getDeviceCoords = (): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (typeof navigator === "undefined" || !navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  };

  const fetchPrices = useCallback(async () => {
    if (!instructorId) {
      setStations([]);
      setCheapest(null);
      setNearest(null);
      setLoading(false);
      return;
    }

    // Skip cache when using device location (location may change)
    if (!useDeviceLocation) {
      const cached = getCachedPrices(instructorId, fuelType);
      if (cached) {
        setStations(cached.stations);
        setCheapest(cached.cheapest);
        setNearest(cached.nearest);
        setLocation(cached.location);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      let userLat: number | undefined;
      let userLng: number | undefined;
      if (useDeviceLocation) {
        setLocating(true);
        const coords = await getDeviceCoords();
        setLocating(false);
        if (!coords) {
          setError("Couldn't get your location. Check permissions and try again.");
          setLoading(false);
          return;
        }
        userLat = coords.lat;
        userLng = coords.lng;
      }

      const { data, error: fnError } = await supabase.functions.invoke("get-fuel-prices", {
        body: { instructorId, fuelType, userLat, userLng },
      });

      if (fnError) throw fnError;

      const fetchedStations = data?.stations || [];

      if (data?.error && fetchedStations.length === 0) {
        setStations([]);
        setCheapest(null);
        setNearest(null);
        setLocation(null);
        setError(data.error);
        return;
      }

      const fetchedCheapest = data?.cheapest || null;
      const fetchedNearest = data?.nearest || null;
      const fetchedLocation = data?.location || null;

      setStations(fetchedStations);
      setCheapest(fetchedCheapest);
      setNearest(fetchedNearest);
      setLocation(fetchedLocation);
      if (!useDeviceLocation) {
        setCachedPrices(instructorId, fetchedStations, fetchedCheapest, fetchedNearest, fetchedLocation, fuelType);
      }
    } catch (err) {
      console.error("Error fetching fuel prices:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch fuel prices");
      setStations([]);
      setCheapest(null);
      setNearest(null);
    } finally {
      setLoading(false);
    }
  }, [instructorId, fuelType, useDeviceLocation]);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  useEffect(() => {
    if (!instructorId) return;
    const interval = setInterval(() => {
      localStorage.removeItem(CACHE_KEY);
      fetchPrices();
    }, CACHE_DURATION_MS);
    return () => clearInterval(interval);
  }, [instructorId, fetchPrices]);

  return {
    stations,
    cheapest,
    nearest,
    loading,
    error,
    refetch: fetchPrices,
    location,
    fuelType,
    setFuelType,
    useDeviceLocation,
    setUseDeviceLocation,
    locating,
  };
}
