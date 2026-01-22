import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SpeedLimitResponse {
  speedLimit: number | null;
  roadType: string | null;
  confidence: 'high' | null;
  source: 'tomtom' | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("TOMTOM_API_KEY");
    const { lat, lon } = await req.json();

    if (!lat || !lon) {
      return new Response(
        JSON.stringify({ error: "lat and lon are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Fetching TomTom speed limit for ${lat}, ${lon}`);

    if (!apiKey) {
      console.error("TOMTOM_API_KEY not configured");
      return new Response(
        JSON.stringify({ 
          speedLimit: null,
          roadType: null,
          confidence: null,
          source: null
        } as SpeedLimitResponse),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let speedLimit: number | null = null;
    let roadName: string | null = null;

    try {
      // Use TomTom Snap to Roads API for accurate speed limits
      // Format: lon,lat (note: longitude first!)
      const snapToRoadsUrl = `https://api.tomtom.com/snap-to-roads/1/snap-to-roads?key=${apiKey}&points=${lon},${lat}&fields={route{properties{speedLimits{value,unit,type},roadName}}}`;
      
      console.log(`Calling Snap to Roads API...`);
      
      const snapResponse = await fetch(snapToRoadsUrl, {
        headers: { 'Accept': 'application/json' }
      });

      if (snapResponse.ok) {
        const snapData = await snapResponse.json();
        console.log(`Snap to Roads response:`, JSON.stringify(snapData));
        
        // Extract speed limit from response
        const route = snapData?.route;
        if (route && route.length > 0) {
          const properties = route[0]?.properties;
          
          // Get road name
          if (properties?.roadName) {
            roadName = properties.roadName;
          }
          
          // Get speed limit - look for the first valid speed limit
          const speedLimits = properties?.speedLimits;
          if (speedLimits && speedLimits.length > 0) {
            // Prefer 'posted' type over 'inferred'
            const postedLimit = speedLimits.find((sl: any) => sl.type === 'posted');
            const limitToUse = postedLimit || speedLimits[0];
            
            if (limitToUse?.value) {
              let limitValue = limitToUse.value;
              const unit = limitToUse.unit?.toLowerCase();
              
              // Convert to km/h if needed (TomTom can return mph or km/h)
              if (unit === 'mph' || unit === 'mi/h') {
                limitValue = Math.round(limitValue * 1.60934);
              } else if (unit === 'km/h' || unit === 'kph') {
                limitValue = Math.round(limitValue);
              } else {
                // Assume km/h if unit not specified
                limitValue = Math.round(limitValue);
              }
              
              speedLimit = limitValue;
              console.log(`Found speed limit: ${speedLimit} km/h (${limitToUse.type})`);
            }
          }
        }
      } else {
        console.error(`Snap to Roads API error: ${snapResponse.status} ${snapResponse.statusText}`);
        const errorText = await snapResponse.text();
        console.error(`Error details: ${errorText}`);
      }
    } catch (snapError) {
      console.error('Snap to Roads API error:', snapError);
    }

    // If Snap to Roads didn't work or didn't return road name, try Reverse Geocode for road name only
    if (!roadName) {
      try {
        const reverseUrl = `https://api.tomtom.com/search/2/reverseGeocode/${lat},${lon}.json?key=${apiKey}&returnSpeedLimit=true`;
        const reverseResponse = await fetch(reverseUrl, {
          headers: { 'Accept': 'application/json' }
        });

        if (reverseResponse.ok) {
          const reverseData = await reverseResponse.json();
          const address = reverseData.addresses?.[0]?.address;
          
          if (address) {
            roadName = address.streetName || address.street || address.freeformAddress?.split(',')[0] || null;
            
            // If we still don't have a speed limit, try to get it from reverse geocode
            if (!speedLimit && address.speedLimit) {
              const rawLimit = address.speedLimit;
              if (typeof rawLimit === 'string') {
                const match = rawLimit.match(/^([\d.]+)\s*(MPH|KPH)?$/i);
                if (match) {
                  const value = parseFloat(match[1]);
                  const unit = match[2]?.toUpperCase() || 'MPH';
                  speedLimit = unit === 'MPH' ? Math.round(value * 1.60934) : Math.round(value);
                }
              } else if (typeof rawLimit === 'number') {
                // Assume MPH for UK
                speedLimit = Math.round(rawLimit * 1.60934);
              }
            }
          }
        }
      } catch (reverseError) {
        console.error('Reverse Geocode error:', reverseError);
      }
    }

    console.log(`Final result: speedLimit=${speedLimit}, roadName=${roadName}`);

    return new Response(
      JSON.stringify({ 
        speedLimit,
        roadType: roadName,
        confidence: speedLimit ? 'high' : null,
        source: speedLimit ? 'tomtom' : null
      } as SpeedLimitResponse),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error fetching speed limit:", error);
    return new Response(
      JSON.stringify({ 
        speedLimit: null,
        roadType: null,
        confidence: null,
        source: null
      } as SpeedLimitResponse),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
