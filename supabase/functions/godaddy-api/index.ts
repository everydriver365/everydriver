import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GODADDY_API_KEY = Deno.env.get('GODADDY_API_KEY');
const GODADDY_API_SECRET = Deno.env.get('GODADDY_API_SECRET');
const GODADDY_BASE_URL = 'https://api.godaddy.com/v1';

interface DomainSearchRequest {
  action: 'search' | 'check' | 'purchase' | 'get-tlds' | 'get-pricing';
  domain?: string;
  tlds?: string[];
  period?: number;
}

interface DomainResult {
  available: boolean;
  price?: number;
  currency?: string;
  period?: number;
}

async function makeGoDaddyRequest(endpoint: string, method = 'GET', body?: unknown) {
  const headers: HeadersInit = {
    'Authorization': `sso-key ${GODADDY_API_KEY}:${GODADDY_API_SECRET}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  console.log(`GoDaddy API Request: ${method} ${GODADDY_BASE_URL}${endpoint}`);
  
  const response = await fetch(`${GODADDY_BASE_URL}${endpoint}`, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`GoDaddy API Error: ${response.status} - ${errorText}`);
    throw new Error(`GoDaddy API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

async function searchDomains(domain: string): Promise<DomainResult> {
  const result = await makeGoDaddyRequest(`/domains/available?domain=${encodeURIComponent(domain)}&checkType=FAST`);
  return result;
}

async function checkMultipleDomains(domain: string, tlds: string[] = ['com', 'co.uk', 'uk', 'net', 'org', 'io']) {
  const domainName = domain.split('.')[0];
  const domains = tlds.map(tld => `${domainName}.${tld}`);
  
  const results = await Promise.all(
    domains.map(async (d) => {
      try {
        const result = await makeGoDaddyRequest(`/domains/available?domain=${encodeURIComponent(d)}&checkType=FAST`);
        return {
          domain: d,
          available: result.available,
          price: result.price,
          currency: result.currency || 'GBP',
          period: result.period || 1,
        };
      } catch (error) {
        console.error(`Error checking ${d}:`, error);
        return {
          domain: d,
          available: false,
          error: true,
        };
      }
    })
  );
  
  return results;
}

async function getTLDs() {
  const result = await makeGoDaddyRequest('/domains/tlds');
  const popularTlds = ['com', 'co.uk', 'uk', 'net', 'org', 'io', 'dev', 'app', 'online', 'site', 'website'];
  const filtered = result.filter((tld: { name: string }) => popularTlds.includes(tld.name));
  return filtered;
}

async function getDomainPricing() {
  return {
    domains: [
      { tld: 'com', price: 12.99, renewal: 15.99, currency: 'GBP' },
      { tld: 'co.uk', price: 9.99, renewal: 12.99, currency: 'GBP' },
      { tld: 'uk', price: 7.99, renewal: 9.99, currency: 'GBP' },
      { tld: 'net', price: 14.99, renewal: 17.99, currency: 'GBP' },
      { tld: 'org', price: 13.99, renewal: 16.99, currency: 'GBP' },
      { tld: 'io', price: 39.99, renewal: 44.99, currency: 'GBP' },
    ],
    hosting: [
      { name: 'Starter', price: 4.99, period: 'month', features: ['1 Website', '30GB Storage', 'Free SSL'] },
      { name: 'Economy', price: 7.99, period: 'month', features: ['1 Website', '100GB Storage', 'Free SSL', 'Free Domain'] },
      { name: 'Deluxe', price: 9.99, period: 'month', features: ['Unlimited Websites', 'Unlimited Storage', 'Free SSL', 'Free Domain'] },
      { name: 'Ultimate', price: 14.99, period: 'month', features: ['Unlimited Websites', 'Unlimited Storage', 'Free SSL', 'Free Domain', 'Premium DNS', 'Priority Support'] },
    ],
  };
}

async function purchaseDomain(domain: string, period: number, authHeader: string) {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  );

  // Get current user
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  if (userError || !user) {
    throw new Error('User not authenticated');
  }

  // Get instructor ID
  const { data: instructor, error: instructorError } = await supabaseClient
    .from('instructors')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (instructorError || !instructor) {
    throw new Error('Instructor profile not found');
  }

  const domainParts = domain.split('.');
  const tld = domainParts.slice(1).join('.');

  // Use raw SQL via RPC or direct insert without type checking
  const orderData = {
    instructor_id: instructor.id,
    domain_name: domain,
    tld: tld,
    order_type: 'domain',
    status: 'pending',
    price_amount: 12.99,
    period_years: period,
  };

  console.log('Creating domain order:', orderData);

  // Insert using fetch to avoid type issues
  const insertResponse = await fetch(
    `${Deno.env.get('SUPABASE_URL')}/rest/v1/domain_orders`,
    {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'apikey': Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(orderData),
    }
  );

  if (!insertResponse.ok) {
    const errorText = await insertResponse.text();
    console.error('Error creating order:', errorText);
    throw new Error('Failed to create order');
  }

  const orders = await insertResponse.json();
  const order = Array.isArray(orders) ? orders[0] : orders;

  return {
    success: true,
    orderId: order?.id,
    message: 'Domain order created. Complete payment to finalize purchase.',
    domain,
    period,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!GODADDY_API_KEY || !GODADDY_API_SECRET) {
      console.error('GoDaddy API credentials not configured');
      return new Response(
        JSON.stringify({ error: 'GoDaddy API not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, domain, tlds, period }: DomainSearchRequest = await req.json();
    console.log(`Processing action: ${action}`, { domain, tlds, period });

    let result;

    switch (action) {
      case 'search':
        if (!domain) {
          throw new Error('Domain name is required for search');
        }
        result = await searchDomains(domain);
        break;

      case 'check':
        if (!domain) {
          throw new Error('Domain name is required for check');
        }
        result = await checkMultipleDomains(domain, tlds);
        break;

      case 'get-tlds':
        result = await getTLDs();
        break;

      case 'get-pricing':
        result = await getDomainPricing();
        break;

      case 'purchase':
        if (!domain) {
          throw new Error('Domain name is required for purchase');
        }
        
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
          throw new Error('Authentication required for purchase');
        }

        result = await purchaseDomain(domain, period || 1, authHeader);
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in godaddy-api function:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
