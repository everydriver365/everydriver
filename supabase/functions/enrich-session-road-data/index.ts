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
  speed_limit_kmh: number | null;
  road_name: string | null;
  recorded_at: string;
}

interface TomTomSnapResult {
  speedLimit?: number;
  roadName?: string;
}

interface SpeedingEvent {
  telematics_id: string;
  latitude: number;
  longitude: number;
  speed_kmh: number;
  speed_limit_kmh: number;
  speed_delta: number;
  road_name: string | null;
  severity: 'low' | 'medium' | 'high';
}

// Sample points evenly from the array
function samplePoints<T>(points: T[], maxSamples: number): T[] {
  if (points.length <= maxSamples) return points;
  
  const result: T[] = [];
  const step = (points.length - 1) / (maxSamples - 1);
  
  for (let i = 0; i < maxSamples; i++) {
    const index = Math.round(i * step);
    result.push(points[index]);
  }
  
  return result;
}

// Call TomTom Snap to Roads API with batch support
async function snapToRoadBatch(
  points: { lat: number; lon: number }[], 
  apiKey: string
): Promise<Map<string, TomTomSnapResult>> {
  const results = new Map<string, TomTomSnapResult>();
  
  // TomTom Snap to Roads supports up to 100 points per request
  const batchSize = 100;
  
  for (let i = 0; i < points.length; i += batchSize) {
    const batch = points.slice(i, i + batchSize);
    const pointsStr = batch.map(p => `${p.lat},${p.lon}`).join(':');
    
    try {
      const url = `https://api.tomtom.com/snap-to-roads/1/snap-to-roads?key=${apiKey}&points=${pointsStr}&fields={speedLimits,names}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      if (!response.ok) {
        console.error(`TomTom batch API error: ${response.status}`);
        continue;
      }

      const data = await response.json();
      
      if (data.snappedPoints && data.snappedPoints.length > 0) {
        for (let j = 0; j < data.snappedPoints.length; j++) {
          const snapped = data.snappedPoints[j];
          const originalPoint = batch[j];
          const cacheKey = `${originalPoint.lat.toFixed(4)},${originalPoint.lon.toFixed(4)}`;
          
          let speedLimit: number | undefined;
          let roadName: string | undefined;

          // Extract speed limit
          if (snapped.speedLimits && snapped.speedLimits.length > 0) {
            for (const limit of snapped.speedLimits) {
              if (limit.type === 'posted' || limit.type === 'legal') {
                speedLimit = limit.value;
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

          results.set(cacheKey, { speedLimit, roadName });
        }
      }
      
      // Rate limiting between batches
      if (i + batchSize < points.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } catch (error) {
      console.error('TomTom batch snap error:', error);
    }
  }
  
  return results;
}

// Detect speeding events from enriched points
function detectSpeedingEvents(
  telematicsId: string,
  points: GPSPoint[]
): SpeedingEvent[] {
  const events: SpeedingEvent[] = [];
  let lastSpeedingPoint: GPSPoint | null = null;
  
  for (const point of points) {
    if (
      point.speed_kmh !== null && 
      point.speed_limit_kmh !== null && 
      point.speed_kmh > point.speed_limit_kmh + 5
    ) {
      const speedDelta = point.speed_kmh - point.speed_limit_kmh;
      
      // Only create event if significantly different from last speeding point
      // (avoid duplicate alerts for continuous speeding)
      if (
        !lastSpeedingPoint || 
        lastSpeedingPoint.road_name !== point.road_name ||
        Math.abs((lastSpeedingPoint.speed_kmh || 0) - point.speed_kmh) > 10
      ) {
        events.push({
          telematics_id: telematicsId,
          latitude: point.latitude,
          longitude: point.longitude,
          speed_kmh: point.speed_kmh,
          speed_limit_kmh: point.speed_limit_kmh,
          speed_delta: speedDelta,
          road_name: point.road_name,
          severity: speedDelta > 20 ? 'high' : speedDelta > 10 ? 'medium' : 'low',
        });
        lastSpeedingPoint = point;
      }
    } else {
      lastSpeedingPoint = null;
    }
  }
  
  return events;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { telematicsId, generateAlerts = true } = await req.json();
    
    if (!telematicsId) {
      throw new Error('telematicsId is required');
    }

    const tomtomKey = Deno.env.get('TOMTOM_API_KEY');
    if (!tomtomKey) {
      console.warn('TOMTOM_API_KEY not configured, skipping enrichment');
      return new Response(
        JSON.stringify({ success: true, enriched: 0, alerts: 0, message: 'No API key configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all GPS points for the session
    const { data: allPoints, error: fetchError } = await supabase
      .from('telematics_gps_points')
      .select('id, latitude, longitude, speed_kmh, speed_limit_kmh, road_name, recorded_at')
      .eq('telematics_id', telematicsId)
      .order('recorded_at', { ascending: true });

    if (fetchError) {
      throw new Error(`Failed to fetch GPS points: ${fetchError.message}`);
    }

    if (!allPoints || allPoints.length === 0) {
      return new Response(
        JSON.stringify({ success: true, enriched: 0, alerts: 0, message: 'No GPS points to enrich' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Enrichment] Processing ${allPoints.length} GPS points for session ${telematicsId}`);

    // Find points that need enrichment (no road name or speed limit)
    const pointsToEnrich = allPoints.filter(
      p => !p.road_name || p.speed_limit_kmh === null
    );
    
    console.log(`[Enrichment] ${pointsToEnrich.length} points need enrichment`);

    let enrichedCount = 0;

    if (pointsToEnrich.length > 0) {
      // Sample unique locations for API calls (max 200 unique points)
      const uniqueLocations = new Map<string, { lat: number; lon: number }>();
      for (const point of pointsToEnrich) {
        const key = `${point.latitude.toFixed(4)},${point.longitude.toFixed(4)}`;
        if (!uniqueLocations.has(key)) {
          uniqueLocations.set(key, { lat: point.latitude, lon: point.longitude });
        }
      }
      
      const locationsArray = Array.from(uniqueLocations.values());
      const sampledLocations = samplePoints(locationsArray, 200);
      
      console.log(`[Enrichment] Calling TomTom for ${sampledLocations.length} unique locations`);

      // Batch call TomTom
      const enrichmentCache = await snapToRoadBatch(sampledLocations, tomtomKey);
      
      console.log(`[Enrichment] Received ${enrichmentCache.size} road lookups`);

      // Update points with enrichment data
      const updates: { id: string; road_name: string | null; speed_limit_kmh: number | null }[] = [];

      for (const point of pointsToEnrich) {
        const cacheKey = `${point.latitude.toFixed(4)},${point.longitude.toFixed(4)}`;
        const enrichment = enrichmentCache.get(cacheKey);
        
        if (enrichment && (enrichment.roadName || enrichment.speedLimit)) {
          updates.push({
            id: point.id,
            road_name: enrichment.roadName || point.road_name,
            speed_limit_kmh: enrichment.speedLimit || point.speed_limit_kmh,
          });
          
          // Update local copy for alert detection
          point.road_name = enrichment.roadName || point.road_name;
          point.speed_limit_kmh = enrichment.speedLimit ?? point.speed_limit_kmh;
        }
      }

      // Batch update database
      if (updates.length > 0) {
        console.log(`[Enrichment] Updating ${updates.length} points in database`);
        
        for (let i = 0; i < updates.length; i += 50) {
          const batch = updates.slice(i, i + 50);
          
          await Promise.all(
            batch.map(update => 
              supabase
                .from('telematics_gps_points')
                .update({
                  road_name: update.road_name,
                  speed_limit_kmh: update.speed_limit_kmh,
                })
                .eq('id', update.id)
            )
          );
        }
        
        enrichedCount = updates.length;
      }
    }

    // Generate speeding alerts from enriched data
    let alertsCreated = 0;
    
    if (generateAlerts) {
      // Re-fetch points with updated data
      const { data: enrichedPoints } = await supabase
        .from('telematics_gps_points')
        .select('id, latitude, longitude, speed_kmh, speed_limit_kmh, road_name, recorded_at')
        .eq('telematics_id', telematicsId)
        .order('recorded_at', { ascending: true });

      if (enrichedPoints && enrichedPoints.length > 0) {
        const speedingEvents = detectSpeedingEvents(telematicsId, enrichedPoints);
        
        if (speedingEvents.length > 0) {
          console.log(`[Enrichment] Detected ${speedingEvents.length} speeding events`);
          
          // Insert alerts (limit to 50 most significant)
          const topEvents = speedingEvents
            .sort((a, b) => b.speed_delta - a.speed_delta)
            .slice(0, 50);
          
          const alertInserts = topEvents.map(event => ({
            telematics_id: event.telematics_id,
            alert_type: 'speeding',
            severity: event.severity,
            speed_kmh: event.speed_kmh,
            speed_limit_kmh: event.speed_limit_kmh,
            speed_delta: event.speed_delta,
            latitude: event.latitude,
            longitude: event.longitude,
            road_name: event.road_name,
          }));

          const { error: alertError } = await supabase
            .from('telematics_alerts')
            .insert(alertInserts);

          if (alertError) {
            console.error('[Enrichment] Failed to insert alerts:', alertError);
          } else {
            alertsCreated = alertInserts.length;
          }
        }
      }
    }

    console.log(`[Enrichment] Complete: ${enrichedCount} enriched, ${alertsCreated} alerts created`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        enriched: enrichedCount,
        alerts: alertsCreated,
        total: allPoints.length,
        message: `Enriched ${enrichedCount} points, created ${alertsCreated} alerts`
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
