import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface PlatformOAuthConfig {
  authorizeUrl: string;
  tokenUrl: string;
  clientIdEnv: string;
  clientSecretEnv: string;
  scopes: string;
}

const platformConfigs: Record<string, PlatformOAuthConfig> = {
  xero: {
    authorizeUrl: 'https://login.xero.com/identity/connect/authorize',
    tokenUrl: 'https://identity.xero.com/connect/token',
    clientIdEnv: 'XERO_CLIENT_ID',
    clientSecretEnv: 'XERO_CLIENT_SECRET',
    scopes: 'openid profile email accounting.transactions accounting.contacts offline_access',
  },
  quickbooks: {
    authorizeUrl: 'https://appcenter.intuit.com/connect/oauth2',
    tokenUrl: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
    clientIdEnv: 'QBO_CLIENT_ID',
    clientSecretEnv: 'QBO_CLIENT_SECRET',
    scopes: 'com.intuit.quickbooks.accounting',
  },
  freeagent: {
    authorizeUrl: 'https://api.freeagent.com/v2/approve_app',
    tokenUrl: 'https://api.freeagent.com/v2/token_endpoint',
    clientIdEnv: 'FREEAGENT_CLIENT_ID',
    clientSecretEnv: 'FREEAGENT_CLIENT_SECRET',
    scopes: '',
  },
  sage: {
    authorizeUrl: 'https://www.sageone.com/oauth2/auth/central',
    tokenUrl: 'https://oauth.accounting.sage.com/token',
    clientIdEnv: 'SAGE_CLIENT_ID',
    clientSecretEnv: 'SAGE_CLIENT_SECRET',
    scopes: 'full_access',
  },
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, platform, code, redirect_uri, instructor_id, state } = body;

    const config = platformConfigs[platform];
    if (!config) {
      return new Response(JSON.stringify({ error: 'Unsupported platform' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const clientId = Deno.env.get(config.clientIdEnv);
    const clientSecret = Deno.env.get(config.clientSecretEnv);

    if (!clientId || !clientSecret) {
      return new Response(JSON.stringify({ 
        error: 'not_configured',
        message: `${platform} API credentials not configured. Please contact support.` 
      }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'authorize') {
      // Build OAuth authorization URL
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri,
        state: state || instructor_id,
      });
      if (config.scopes) params.set('scope', config.scopes);

      const authorizeUrl = `${config.authorizeUrl}?${params.toString()}`;
      return new Response(JSON.stringify({ url: authorizeUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'callback') {
      // Exchange authorization code for tokens
      const tokenParams = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri,
      });

      // Some platforms want client creds in body, others in header
      const authHeader = btoa(`${clientId}:${clientSecret}`);
      
      const tokenRes = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${authHeader}`,
        },
        body: tokenParams.toString(),
      });

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        console.error(`Token exchange failed for ${platform}:`, errText);
        return new Response(JSON.stringify({ error: 'Token exchange failed', details: errText.slice(0, 500) }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const tokens = await tokenRes.json();
      console.log(`Token exchange successful for ${platform}`);

      // Get tenant/company info for Xero and QuickBooks
      let tenantId = null;
      let companyName = null;

      if (platform === 'xero') {
        try {
          const connectionsRes = await fetch('https://api.xero.com/connections', {
            headers: { 'Authorization': `Bearer ${tokens.access_token}` },
          });
          if (connectionsRes.ok) {
            const connections = await connectionsRes.json();
            if (connections.length > 0) {
              tenantId = connections[0].tenantId;
              companyName = connections[0].tenantName;
            }
          }
        } catch (e) { console.error('Failed to get Xero tenant:', e); }
      }

      if (platform === 'quickbooks' && tokens.realmId) {
        tenantId = tokens.realmId;
      }

      // Store connection in database
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      );

      const expiresAt = tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null;

      const { error: dbError } = await supabase
        .from('instructor_accounting_connections')
        .upsert({
          instructor_id,
          platform,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || null,
          token_expires_at: expiresAt,
          tenant_id: tenantId,
          company_name: companyName,
          connected_at: new Date().toISOString(),
        }, { onConflict: 'instructor_id,platform' });

      if (dbError) {
        console.error('Failed to store connection:', dbError);
        return new Response(JSON.stringify({ error: 'Failed to save connection' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        platform,
        company_name: companyName,
        tenant_id: tenantId,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'disconnect') {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      );

      const { error } = await supabase
        .from('instructor_accounting_connections')
        .delete()
        .eq('instructor_id', instructor_id)
        .eq('platform', platform);

      if (error) {
        return new Response(JSON.stringify({ error: 'Failed to disconnect' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'refresh') {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      );

      const { data: connection } = await supabase
        .from('instructor_accounting_connections')
        .select('*')
        .eq('instructor_id', instructor_id)
        .eq('platform', platform)
        .single();

      if (!connection?.refresh_token) {
        return new Response(JSON.stringify({ error: 'No refresh token available' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const authHeader = btoa(`${clientId}:${clientSecret}`);
      const tokenRes = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${authHeader}`,
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: connection.refresh_token,
        }).toString(),
      });

      if (!tokenRes.ok) {
        return new Response(JSON.stringify({ error: 'Token refresh failed' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const tokens = await tokenRes.json();
      const expiresAt = tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null;

      await supabase
        .from('instructor_accounting_connections')
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || connection.refresh_token,
          token_expires_at: expiresAt,
        })
        .eq('id', connection.id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Accounting OAuth error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
