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
    // This can be called as a webhook from Damoov OR manually from the app
    const body = await req.json();
    
    const { 
      deviceToken,
      telematicsId,
      crashTimestamp,
      latitude,
      longitude,
      severity,
      // Damoov webhook format fields
      DeviceToken,
      CrashTimestamp,
      Latitude,
      Longitude,
      Severity,
    } = body;

    // Normalize fields (handle both camelCase and PascalCase)
    const normalizedDeviceToken = deviceToken || DeviceToken;
    const normalizedTimestamp = crashTimestamp || CrashTimestamp || new Date().toISOString();
    const normalizedLat = latitude || Latitude;
    const normalizedLng = longitude || Longitude;
    const normalizedSeverity = severity || Severity || 'unknown';

    console.log('Crash alert received:', {
      deviceToken: normalizedDeviceToken,
      timestamp: normalizedTimestamp,
      location: { lat: normalizedLat, lng: normalizedLng },
      severity: normalizedSeverity,
    });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find the pupil by device token
    let pupil = null;
    if (normalizedDeviceToken) {
      const { data } = await supabase
        .from('pupils')
        .select('id, name, instructor_id, phone')
        .eq('damoov_device_token', normalizedDeviceToken)
        .single();
      pupil = data;
    }

    // Find the most recent active telematics session
    let sessionId = telematicsId;
    if (!sessionId && pupil) {
      const { data: recentSession } = await supabase
        .from('lesson_telematics')
        .select('id')
        .eq('pupil_id', pupil.id)
        .is('ended_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .single();
      
      sessionId = recentSession?.id;
    }

    // Update the telematics session with crash data
    if (sessionId) {
      await supabase
        .from('lesson_telematics')
        .update({
          damoov_crash_detected: true,
          damoov_crash_timestamp: normalizedTimestamp,
        })
        .eq('id', sessionId);

      console.log('Updated telematics session with crash data');
    }

    // Log the crash as a driving event
    if (sessionId) {
      await supabase
        .from('driving_behavior_events')
        .insert({
          telematics_id: sessionId,
          event_type: 'crash_detected',
          severity: normalizedSeverity === 'high' ? 'critical' : 'warning',
          latitude: normalizedLat,
          longitude: normalizedLng,
          recorded_at: normalizedTimestamp,
          notes: `Crash detected by Damoov. Severity: ${normalizedSeverity}`,
          sensor_source: 'damoov',
        });

      console.log('Logged crash event');
    }

    // Get instructor details for notification
    let instructorPhone = null;
    let instructorName = null;
    
    if (pupil?.instructor_id) {
      const { data: instructor } = await supabase
        .from('instructors')
        .select('name, phone')
        .eq('id', pupil.instructor_id)
        .single();
      
      instructorPhone = instructor?.phone;
      instructorName = instructor?.name;
    }

    // Send SMS notification to instructor (if Twilio is configured)
    const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhone = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (twilioSid && twilioToken && twilioPhone && instructorPhone) {
      try {
        const message = `🚨 CRASH ALERT: A potential crash was detected during ${pupil?.name || 'a pupil'}'s lesson at ${new Date(normalizedTimestamp).toLocaleTimeString()}. Please check on your pupil immediately.`;
        
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
        
        await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + btoa(`${twilioSid}:${twilioToken}`),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: instructorPhone,
            From: twilioPhone,
            Body: message,
          }),
        });

        console.log('SMS alert sent to instructor');
      } catch (smsError) {
        console.error('Failed to send SMS:', smsError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Crash alert processed',
        sessionUpdated: !!sessionId,
        instructorNotified: !!(instructorPhone && twilioSid),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in damoov-crash-alert:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
