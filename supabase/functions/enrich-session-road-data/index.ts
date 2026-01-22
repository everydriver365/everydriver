import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GPSPoint {
  id: string;
  latitude: number;
  longitude: number;
  speed_kmh: number | null;
  recorded_at: string;
}

interface TomTomSnapResult {
  speedLimit?: number;
  roadName?: string;
}

// Sample points evenly from the array
function samplePoints(points: GPSPoint[], maxSamples: number): GPSPoint[] {
  if (points.length <= maxSamples) return points;
  
  const result: GPSPoint[] = [];
  const step = (points.length - 1) / (maxSamples - 1);
  
  for (let i = 0; i < maxSamples; i++) {
    const index = Math.round(i * step);
    result.push(points[index]);
  }
  
  return result;
}

// Call TomTom Snap to Roads API
async function snapToRoad(lat: number, lon: number, apiKey: string): Promise<TomTomSnapResult> {
  try {
    const url = `https://api.tomtom.com/snap-to-roads/1/snap-to-roads?key=${apiKey}&points=${lat},${lon}&fields={speedLimits,names}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      console.error(`TomTom API error: ${response.status}`);
      return {};
    }

    const data = await response.json();
    
    if (!data.snappedPoints || data.snappedPoints.length === 0) {
      return {};
    }

    const snapped = data.snappedPoints[0];
    let speedLimit: number | undefined;
    let roadName: string | undefined;

    // Extract speed limit
    if (snapped.speedLimits && snapped.speedLimits.length > 0) {
      for (const limit of snapped.speedLimits) {
        if (limit.type === 'posted' || limit.type === 'legal') {
          speedLimit = limit.value;
          // Convert if needed
          if (limit.unit === 'mph' || limit.unit === 'mi/h') {
            speedLimit = Math.round(limit.value * 1.60934);
          }
          break;
        }
      }
    }

    // Extract road name
    if (snapped.names && snapped.names.length > 0) {
      roadName = snapped.names[0].name || snapped.names[0].value;
    }

    return { speedLimit, roadName };
  } catch (error) {
    console.error('TomTom snap error:', error);
    return {};
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { telematicsId } = await req.json();
    
    if (!telematicsId) {
      throw new Error('telematicsId is required');
    }

    const tomtomKey = Deno.env.get('TOMTOM_API_KEY');
    if (!tomtomKey) {
      console.warn('TOMTOM_API_KEY not configured, skipping enrichment');
      return new Response(
        JSON.stringify({ success: true, enriched: 0, message: 'No API key configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all GPS points for the session
    const { data: allPoints, error: fetchError } = await supabase
      .from('telematics_gps_points')
      .select('id, latitude, longitude, speed_kmh, recorded_at')
      .eq('telematics_id', telematicsId)
      .order('recorded_at', { ascending: true });

    if (fetchError) {
      throw new Error(`Failed to fetch GPS points: ${fetchError.message}`);
    }

    if (!allPoints || allPoints.length === 0) {
      return new Response(
        JSON.stringify({ success: true, enriched: 0, message: 'No GPS points to enrich' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Enriching ${allPoints.length} GPS points for session ${telematicsId}`);

    // Sample points to reduce API calls (max 50 unique lookups)
    const sampledPoints = samplePoints(allPoints, 50);
    console.log(`Sampled to ${sampledPoints.length} points for TomTom lookup`);

    // Create a map of enrichment data by approximate location
    const enrichmentCache = new Map<string, TomTomSnapResult>();
    
    // Process sampled points
    for (const point of sampledPoints) {
      // Round coordinates to 4 decimal places for caching (~11m precision)
      const cacheKey = `${point.latitude.toFixed(4)},${point.longitude.toFixed(4)}`;
      
      if (!enrichmentCache.has(cacheKey)) {
        const result = await snapToRoad(point.latitude, point.longitude, tomtomKey);
        enrichmentCache.set(cacheKey, result);
        
        // Rate limiting: small delay between calls
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`Cached ${enrichmentCache.size} unique road lookups`);

    // Update all points with nearest cached enrichment
    let enrichedCount = 0;
    const updates: { id: string; road_name: string | null; speed_limit_kmh: number | null }[] = [];

    for (const point of allPoints) {
      const cacheKey = `${point.latitude.toFixed(4)},${point.longitude.toFixed(4)}`;
      const enrichment = enrichmentCache.get(cacheKey);
      
      if (enrichment && (enrichment.roadName || enrichment.speedLimit)) {
        updates.push({
          id: point.id,
          road_name: enrichment.roadName || null,
          speed_limit_kmh: enrichment.speedLimit || null,
        });
        enrichedCount++;
      }
    }

    // Batch update points
    if (updates.length > 0) {
      // Update in batches of 100
      for (let i = 0; i < updates.length; i += 100) {
        const batch = updates.slice(i, i + 100);
        
        for (const update of batch) {
          await supabase
            .from('telematics_gps_points')
            .update({
              road_name: update.road_name,
              speed_limit_kmh: update.speed_limit_kmh,
            })
            .eq('id', update.id);
        }
      }
    }

    console.log(`Enriched ${enrichedCount} of ${allPoints.length} points`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        enriched: enrichedCount,
        total: allPoints.length,
        message: `Enriched ${enrichedCount} GPS points with road data`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in enrich-session-road-data:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
