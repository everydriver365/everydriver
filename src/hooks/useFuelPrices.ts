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

  const fetchPrices = useCallback(async () => {
    if (!instructorId) {
      setStations([]);
      setCheapest(null);
      setNearest(null);
      setLoading(false);
      return;
    }

    // Check cache first
    const cached = getCachedPrices(instructorId, fuelType);
    if (cached) {
      setStations(cached.stations);
      setCheapest(cached.cheapest);
      setNearest(cached.nearest);
      setLocation(cached.location);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("get-fuel-prices", {
        body: { instructorId, fuelType },
      });

      if (fnError) throw fnError;

      const fetchedStations = data?.stations || [];

      // Edge function may return 200 with an embedded error (e.g. no postcode set)
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
      setCachedPrices(instructorId, fetchedStations, fetchedCheapest, fetchedNearest, fetchedLocation, fuelType);
    } catch (err) {
      console.error("Error fetching fuel prices:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch fuel prices");
      setStations([]);
      setCheapest(null);
      setNearest(null);
    } finally {
      setLoading(false);
    }
  }, [instructorId, fuelType]);

  // Fetch on mount and when instructorId or fuelType changes
  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  // Refresh every 30 minutes
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
  };
}
