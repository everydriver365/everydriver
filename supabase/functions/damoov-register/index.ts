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
    const { pupilId } = await req.json();
    
    if (!pupilId) {
      throw new Error('pupilId is required');
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

    // Check if pupil already has a device token
    const { data: pupil, error: pupilError } = await supabase
      .from('pupils')
      .select('id, name, damoov_device_token')
      .eq('id', pupilId)
      .single();

    if (pupilError) {
      throw new Error(`Failed to fetch pupil: ${pupilError.message}`);
    }

    if (pupil.damoov_device_token) {
      console.log('Pupil already registered with Damoov:', pupil.damoov_device_token);
      return new Response(
        JSON.stringify({ 
          success: true, 
          deviceToken: pupil.damoov_device_token,
          message: 'Already registered' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Register new user with Damoov
    console.log('Registering new pupil with Damoov...');
    
    const registrationResponse = await fetch('https://api.telematicssdk.com/v1/Registration/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'InstanceId': instanceId,
        'InstanceKey': instanceKey,
      },
      body: JSON.stringify({
        // Optional: include pupil identifier for reference
        firstName: pupil.name?.split(' ')[0] || 'Learner',
        lastName: pupil.name?.split(' ').slice(1).join(' ') || '',
      }),
    });

    if (!registrationResponse.ok) {
      const errorText = await registrationResponse.text();
      console.error('Damoov registration failed:', errorText);
      throw new Error(`Damoov registration failed: ${registrationResponse.status}`);
    }

    const registrationData = await registrationResponse.json();
    const deviceToken = registrationData.DeviceToken || registrationData.deviceToken;

    if (!deviceToken) {
      throw new Error('No device token received from Damoov');
    }

    console.log('Damoov registration successful, deviceToken:', deviceToken);

    // Store the device token in the pupil record
    const { error: updateError } = await supabase
      .from('pupils')
      .update({ damoov_device_token: deviceToken })
      .eq('id', pupilId);

    if (updateError) {
      console.error('Failed to store device token:', updateError);
      throw new Error(`Failed to store device token: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        deviceToken,
        message: 'Registration successful' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in damoov-register:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
