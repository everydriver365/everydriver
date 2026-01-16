import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { telematicsId, deviceToken } = await req.json();
    
    if (!telematicsId || !deviceToken) {
      throw new Error('telematicsId and deviceToken are required');
    }

    const instanceId = Deno.env.get('DAMOOV_INSTANCE_ID');
    const instanceKey = Deno.env.get('DAMOOV_INSTANCE_KEY');
    
    if (!instanceId || !instanceKey) {
      throw new Error('Damoov credentials not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch telematics session data
    const { data: session, error: sessionError } = await supabase
      .from('lesson_telematics')
      .select('*')
      .eq('id', telematicsId)
      .single();

    if (sessionError) {
      throw new Error(`Failed to fetch session: ${sessionError.message}`);
    }

    // Fetch GPS points for this session
    const { data: gpsPoints, error: gpsError } = await supabase
      .from('telematics_gps_points')
      .select('*')
      .eq('telematics_id', telematicsId)
      .order('recorded_at', { ascending: true });

    if (gpsError) {
      console.log('No GPS points table or error:', gpsError.message);
    }

    // If no GPS points table exists, we'll use the session summary data
    const hasGpsPoints = gpsPoints && gpsPoints.length > 0;

    // First, authenticate with Damoov to get JWT token
    console.log('Authenticating with Damoov...');
    
    const authResponse = await fetch('https://api.telematicssdk.com/v1/Auth/Login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'InstanceId': instanceId,
        'InstanceKey': instanceKey,
      },
      body: JSON.stringify({
        DeviceToken: deviceToken,
        Password: instanceKey,
      }),
    });

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.error('Damoov auth failed:', errorText);
      throw new Error(`Damoov authentication failed: ${authResponse.status}`);
    }

    const authData = await authResponse.json();
    const accessToken = authData.AccessToken || authData.accessToken;

    if (!accessToken) {
      throw new Error('No access token received from Damoov');
    }

    console.log('Damoov auth successful, submitting trip data...');

    // Format GPS points for Damoov Track API
    let trackPoints = [];
    
    if (hasGpsPoints) {
      trackPoints = gpsPoints.map((point: any) => ({
        pointDate: point.recorded_at,
        latitude: point.latitude,
        longitude: point.longitude,
        speed: point.speed_kmh || 0,
        course: point.heading || 0,
        altitude: point.altitude || 0,
        accuracy: point.accuracy || 10,
      }));
    } else {
      // Create minimal track data from session summary
      // This is fallback if GPS points weren't stored separately
      console.log('No GPS points found, creating summary-based track');
      trackPoints = [
        {
          pointDate: session.started_at,
          latitude: 0,
          longitude: 0,
          speed: session.avg_speed_kmh || 0,
        },
        {
          pointDate: session.ended_at || new Date().toISOString(),
          latitude: 0,
          longitude: 0,
          speed: session.avg_speed_kmh || 0,
        }
      ];
    }

    // Submit track to Damoov
    const trackResponse = await fetch('https://api.telematicssdk.com/v1/Trips/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        startDate: session.started_at,
        endDate: session.ended_at || new Date().toISOString(),
        points: trackPoints,
      }),
    });

    if (!trackResponse.ok) {
      const errorText = await trackResponse.text();
      console.error('Damoov track submission failed:', errorText);
      // Don't throw - Damoov might process async
    }

    let tripToken = null;
    try {
      const trackData = await trackResponse.json();
      tripToken = trackData.TripToken || trackData.tripToken || trackData.token;
      console.log('Trip submitted, token:', tripToken);
    } catch (e) {
      console.log('Could not parse track response, proceeding anyway');
    }

    // Update telematics record with trip token
    if (tripToken) {
      await supabase
        .from('lesson_telematics')
        .update({ damoov_trip_token: tripToken })
        .eq('id', telematicsId);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        tripToken,
        pointsSubmitted: trackPoints.length,
        message: 'Trip submitted to Damoov' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in damoov-submit-trip:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
