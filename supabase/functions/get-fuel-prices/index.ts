import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// UK Fuel Price API endpoints (CMA scheme - free, no API key required)
const FUEL_ENDPOINTS = [
  { brand: "Tesco", url: "https://www.tesco.com/fuel_prices/fuel_prices_data.json" },
  { brand: "Sainsbury's", url: "https://api.sainsburys.co.uk/v1/exports/latest/fuel_prices_data.json" },
  { brand: "Asda", url: "https://storelocator.asda.com/fuel_prices_data.json" },
  { brand: "Morrisons", url: "https://www.morrisons.com/fuel-prices/fuel.json" },
  { brand: "BP", url: "https://www.bp.com/en_gb/united-kingdom/home/fuelprices/fuel_prices_data.json" },
  { brand: "Esso", url: "https://fuelprices.esso.co.uk/latestdata.json" },
  { brand: "Shell", url: "https://www.shell.co.uk/fuel-prices-data.html" },
  { brand: "JET", url: "https://jetlocal.co.uk/fuel_prices_data.json" },
  { brand: "Motor Fuel Group", url: "https://fuel.motorfuelgroup.com/fuel_prices_data.json" },
  { brand: "Rontec", url: "https://www.rontec-servicestations.co.uk/fuel-prices/data/fuel_prices_data.json" },
  { brand: "SGN", url: "https://www.sgnretail.uk/files/data/SGN_daily_fuel_prices.json" },
  { brand: "Ascona", url: "https://fuelprices.asconagroup.co.uk/newfuel.json" },
];

interface FuelStation {
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

// Haversine distance calculation
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function kmToMiles(km: number): number {
  return km * 0.621371;
}

function normalisePostcode(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase();
}

function getOutcode(raw: string): string | null {
  const match = raw.trim().toUpperCase().match(/^([A-Z]{1,2}\d[A-Z\d]?)/);
  return match?.[1] || null;
}

function firstLocationName(value: unknown): string | null {
  if (Array.isArray(value)) return value.find((item) => typeof item === "string" && item.trim()) || null;
  return typeof value === "string" && value.trim() ? value : null;
}

// Parse different API response formats into our unified station format
function parseStations(data: any, brand: string, userLat: number, userLng: number, maxRadiusKm: number): FuelStation[] {
  const stations: FuelStation[] = [];
  
  try {
    // Most CMA APIs use "stations" or have stations at root level
    let stationList = data.stations || data.Stations || data.data || [];
    
    // Some APIs put data at the root level with different structures
    if (stationList.length === 0 && Array.isArray(data)) {
      stationList = data;
    }
    
    // Morrisons uses 'fuel' key
    if (stationList.length === 0 && data.fuel) {
      stationList = data.fuel;
    }
    
    for (const station of stationList) {
      try {
        // Handle various coordinate formats
        let lat = 0, lng = 0;
        
        if (station.location) {
          lat = parseFloat(station.location.latitude || station.location.lat || 0);
          lng = parseFloat(station.location.longitude || station.location.lng || station.location.lon || 0);
        } else {
          lat = parseFloat(station.lat || station.Lat || station.latitude || station.Latitude || 0);
          lng = parseFloat(station.lng || station.Lng || station.lon || station.Lon || station.longitude || station.Longitude || 0);
        }
        
        if (!lat || !lng) continue;
        
        const distance_km = haversineDistance(userLat, userLng, lat, lng);
        if (distance_km > maxRadiusKm) continue;
        
        // Parse prices (pence per litre)
        const prices: FuelStation["prices"] = {};
        const pricesData = station.prices || station.Prices || {};
        
        // Handle prices as an object (most common format: {"E10": 128.9, "B7": 136.9})
        if (typeof pricesData === "object" && !Array.isArray(pricesData)) {
          if (pricesData.E10) prices.E10 = parseFloat(pricesData.E10);
          if (pricesData.e10) prices.E10 = parseFloat(pricesData.e10);
          if (pricesData.E5) prices.E5 = parseFloat(pricesData.E5);
          if (pricesData.e5) prices.E5 = parseFloat(pricesData.e5);
          if (pricesData.B7) prices.B7 = parseFloat(pricesData.B7);
          if (pricesData.b7) prices.B7 = parseFloat(pricesData.b7);
          if (pricesData.SDV) prices.SDV = parseFloat(pricesData.SDV);
          if (pricesData.sdv) prices.SDV = parseFloat(pricesData.sdv);
        } 
        // Handle prices as an array (legacy format)
        else if (Array.isArray(pricesData)) {
          for (const price of pricesData) {
            const fuelType = (price.type || price.fuel_type || price.Type || price.fuelType || "").toUpperCase();
            const amount = parseFloat(price.price || price.Price || price.amount || 0);
            
            if (!amount || amount <= 0) continue;
            
            if (fuelType.includes("E10") || fuelType === "UNLEADED" || fuelType === "UNL") {
              prices.E10 = amount;
            } else if (fuelType.includes("E5") || fuelType.includes("SUPER") || fuelType === "SUP") {
              prices.E5 = amount;
            } else if (fuelType.includes("B7") || fuelType.includes("DIESEL") || fuelType === "DSL") {
              prices.B7 = amount;
            } else if (fuelType.includes("SDV") || fuelType.includes("PREMIUM")) {
              prices.SDV = amount;
            }
          }
        }
        
        // Skip if no usable prices
        if (!prices.E10 && !prices.E5 && !prices.B7) continue;
        
        // Handle address field - can be object or string
        let address = "";
        if (typeof station.address === "object" && station.address !== null) {
          address = [
            station.address.street_number,
            station.address.street, 
            station.address.city,
            station.address.town,
            station.address.county
          ].filter(Boolean).join(", ");
        } else {
          address = station.address || station.Address || station.site_address || "";
        }
        
        const postcode = station.postcode || station.Postcode || station.post_code || 
                        station.location?.postcode || station.address?.postcode || "";
        
        // Try to get proper name - many APIs use different field names
        // Skip ID-like fields (e.g. "gcncr7kkq0kk") 
        const rawName = station.site_name || station.siteName || station.SiteName || 
                       station.name || station.Name || station.brand_name || 
                       station.site_id || "";
        
        // Check if name looks like an ID (alphanumeric hash) and use brand + location instead
        const isIdLike = typeof rawName === "string" && 
                        /^[a-z0-9]{10,}$/i.test(rawName) && 
                        !rawName.includes(" ");
        
        let name: string;
        if (!rawName || isIdLike) {
          // Build a descriptive name from brand + address/postcode
          const locationHint = postcode || 
            (typeof address === "string" ? address.split(",")[0] : "") || 
            "";
          name = locationHint ? `${brand} ${locationHint}` : brand;
        } else {
          name = rawName;
        }
        
        stations.push({
          name: typeof name === "string" ? name : brand,
          brand,
          address: address || "",
          postcode: postcode || "",
          lat,
          lng,
          distance_km,
          distance_miles: kmToMiles(distance_km),
          prices,
          updated_at: data.last_updated || data.LastUpdated || data.updated || new Date().toISOString(),
        });
      } catch (stationError) {
        // Skip individual station parsing errors
        continue;
      }
    }
  } catch (parseError) {
    console.error(`Error parsing ${brand} data:`, parseError);
  }
  
  return stations;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { instructorId, fuelType = "E10", radiusKm = 15, userLat, userLng } = await req.json();

    if (!instructorId) {
      return new Response(
        JSON.stringify({ error: "instructorId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let lat: number | null = null;
    let lng: number | null = null;
    let locationName: string | null = null;

    // Prefer live device location when provided
    if (typeof userLat === "number" && typeof userLng === "number" &&
        Number.isFinite(userLat) && Number.isFinite(userLng)) {
      lat = userLat;
      lng = userLng;
      // Reverse geocode for friendly name (best effort)
      try {
        const r = await fetch(`https://api.postcodes.io/postcodes?lon=${lng}&lat=${lat}`);
        if (r.ok) {
          const j = await r.json();
          const first = Array.isArray(j.result) ? j.result[0] : null;
          if (first) {
            locationName = firstLocationName(first.admin_ward) ||
                           firstLocationName(first.admin_district) ||
                           firstLocationName(first.region) ||
                           first.postcode || "Current location";
          }
        }
      } catch { /* ignore */ }
      if (!locationName) locationName = "Current location";
    } else {
      // Fall back to instructor's home postcode
      const { data: instructor, error: instructorError } = await supabase
        .from("instructors")
        .select("home_postcode, lat, lng, location_name")
        .eq("id", instructorId)
        .single();

      if (instructorError || !instructor?.home_postcode) {
        return new Response(
          JSON.stringify({ stations: [], error: "No postcode configured" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      lat = instructor.lat;
      lng = instructor.lng;
      locationName = instructor.location_name;

      // If no cached coordinates, geocode the postcode. Fall back to outward code.
      if (!lat || !lng) {
        const cleanPostcode = normalisePostcode(instructor.home_postcode);
        const geocodeResponse = await fetch(`https://api.postcodes.io/postcodes/${cleanPostcode}`);

        if (geocodeResponse.ok) {
          const geocodeData = await geocodeResponse.json();
          if (geocodeData.result) {
            lat = geocodeData.result.latitude;
            lng = geocodeData.result.longitude;
            locationName = firstLocationName(geocodeData.result.admin_ward) ||
                          firstLocationName(geocodeData.result.admin_district) ||
                          firstLocationName(geocodeData.result.region);
          }
        }

        if (!lat || !lng) {
          const outcode = getOutcode(instructor.home_postcode);
          if (outcode) {
            const outcodeResponse = await fetch(`https://api.postcodes.io/outcodes/${outcode}`);
            if (outcodeResponse.ok) {
              const outcodeData = await outcodeResponse.json();
              if (outcodeData.result) {
                lat = outcodeData.result.latitude;
                lng = outcodeData.result.longitude;
                locationName = firstLocationName(outcodeData.result.admin_district) ||
                              firstLocationName(outcodeData.result.admin_county) ||
                              outcode;
              }
            }
          }
        }

        if (lat && lng) {
          await supabase
            .from("instructors")
            .update({ lat, lng, location_name: locationName })
            .eq("id", instructorId);
        }

        if (!lat || !lng) {
          return new Response(
            JSON.stringify({ stations: [], error: "Could not geocode postcode" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // Fetch fuel prices from all endpoints in parallel
    const fetchPromises = FUEL_ENDPOINTS.map(async (endpoint) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch(endpoint.url, {
          signal: controller.signal,
          headers: {
            "Accept": "application/json, text/plain, */*",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.log(`${endpoint.brand} returned ${response.status}`);
          return [];
        }
        
        const text = await response.text();
        
        // Try to parse as JSON
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          console.log(`${endpoint.brand} returned non-JSON response`);
          return [];
        }
        
        const stations = parseStations(data, endpoint.brand, lat, lng, radiusKm);
        console.log(`${endpoint.brand}: Found ${stations.length} stations within ${radiusKm}km`);
        return stations;
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : "unknown";
        console.log(`Error fetching ${endpoint.brand}: ${errMsg}`);
        return [];
      }
    });

    const allStationsArrays = await Promise.all(fetchPromises);
    let allStations = allStationsArrays.flat();

    // Sort by selected fuel type price
    const priceKey = fuelType as keyof FuelStation["prices"];
    allStations = allStations.filter(s => s.prices[priceKey]);
    allStations.sort((a, b) => {
      const priceA = a.prices[priceKey] || 999;
      const priceB = b.prices[priceKey] || 999;
      return priceA - priceB;
    });

    // Take top 10 cheapest stations
    const topStations = allStations.slice(0, 10);

    // Find cheapest and nearest
    const cheapest = topStations[0] || null;
    const nearest = [...allStations].sort((a, b) => a.distance_km - b.distance_km)[0] || null;

    return new Response(
      JSON.stringify({
        stations: topStations,
        cheapest,
        nearest,
        fuelType,
        location: locationName,
        totalFound: allStations.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error:", message);
    return new Response(
      JSON.stringify({ error: message, stations: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
