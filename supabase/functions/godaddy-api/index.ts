import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GODADDY_API_KEY = Deno.env.get('GODADDY_API_KEY');
const GODADDY_API_SECRET = Deno.env.get('GODADDY_API_SECRET');
// Use the production API for reseller accounts
const GODADDY_BASE_URL = 'https://api.godaddy.com/v1';

interface DomainSearchRequest {
  action: 'search' | 'check' | 'purchase' | 'get-tlds' | 'get-pricing' | 'create-shopper';
  domain?: string;
  tlds?: string[];
  period?: number;
  shopperInfo?: {
    email: string;
    firstName: string;
    lastName: string;
  };
}

interface DomainResult {
  available: boolean;
  domain?: string;
  price?: number;
  currency?: string;
  period?: number;
}

// Make a request to GoDaddy API with optional shopper ID for reseller transactions
async function makeGoDaddyRequest(
  endpoint: string, 
  method = 'GET', 
  body?: unknown,
  shopperId?: string
) {
  const headers: HeadersInit = {
    'Authorization': `sso-key ${GODADDY_API_KEY}:${GODADDY_API_SECRET}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Add X-Shopper-Id header for reseller transactions
  if (shopperId) {
    headers['X-Shopper-Id'] = shopperId;
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  console.log(`GoDaddy API Request: ${method} ${GODADDY_BASE_URL}${endpoint}`);
  if (shopperId) {
    console.log(`With X-Shopper-Id: ${shopperId}`);
  }
  
  const response = await fetch(`${GODADDY_BASE_URL}${endpoint}`, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`GoDaddy API Error: ${response.status} - ${errorText}`);
    throw new Error(`GoDaddy API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// Search for a single domain availability
async function searchDomains(domain: string): Promise<DomainResult> {
  const result = await makeGoDaddyRequest(
    `/domains/available?domain=${encodeURIComponent(domain)}&checkType=FAST`
  );
  return result;
}

// Check multiple domains at once using the bulk endpoint (more efficient)
async function checkMultipleDomains(domain: string, tlds: string[] = ['com', 'co.uk', 'uk', 'net', 'org', 'io']) {
  const domainName = domain.split('.')[0].toLowerCase().replace(/[^a-z0-9-]/g, '');
  const domains = tlds.map(tld => `${domainName}.${tld}`);
  
  try {
    // Use POST bulk availability check - more efficient and avoids rate limits
    const result = await makeGoDaddyRequest('/domains/available', 'POST', domains);
    
    // Handle the bulk response format
    if (Array.isArray(result)) {
      return result.map((item: { domain: string; available: boolean; price?: number; currency?: string; period?: number }) => ({
        domain: item.domain,
        available: item.available,
        price: item.price ? item.price / 1000000 : undefined, // GoDaddy returns price in micro-units
        currency: item.currency || 'GBP',
        period: item.period || 1,
      }));
    }
    
    // If single result returned
    return [{
      domain: result.domain,
      available: result.available,
      price: result.price ? result.price / 1000000 : undefined,
      currency: result.currency || 'GBP',
      period: result.period || 1,
    }];
  } catch (error) {
    console.error('Bulk check failed, falling back to individual checks:', error);
    
    // Fallback to individual checks with delay to avoid rate limits
    const results = [];
    for (const d of domains) {
      try {
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between requests
        const result = await makeGoDaddyRequest(
          `/domains/available?domain=${encodeURIComponent(d)}&checkType=FAST`
        );
        results.push({
          domain: result.domain || d,
          available: result.available,
          price: result.price ? result.price / 1000000 : undefined,
          currency: result.currency || 'GBP',
          period: result.period || 1,
        });
      } catch (err) {
        console.error(`Error checking ${d}:`, err);
        results.push({
          domain: d,
          available: false,
          error: true,
        });
      }
    }
    return results;
  }
}

// Get available TLDs
async function getTLDs() {
  try {
    const result = await makeGoDaddyRequest('/domains/tlds');
    const popularTlds = ['com', 'co.uk', 'uk', 'net', 'org', 'io', 'dev', 'app', 'online', 'site', 'website'];
    const filtered = result.filter((tld: { name: string }) => popularTlds.includes(tld.name));
    return filtered;
  } catch (error) {
    console.error('Failed to get TLDs:', error);
    // Return default list if API fails
    return [
      { name: 'com', type: 'GENERIC' },
      { name: 'co.uk', type: 'COUNTRY_CODE' },
      { name: 'uk', type: 'COUNTRY_CODE' },
      { name: 'net', type: 'GENERIC' },
      { name: 'org', type: 'GENERIC' },
      { name: 'io', type: 'GENERIC' },
    ];
  }
}

// Get domain pricing - uses the suggest endpoint to get accurate pricing
async function getDomainPricing() {
  try {
    // Try to get real pricing from GoDaddy
    const tlds = ['com', 'co.uk', 'uk', 'net', 'org', 'io'];
    const pricingPromises = tlds.map(async (tld) => {
      try {
        const result = await makeGoDaddyRequest(
          `/domains/available?domain=example.${tld}&checkType=FAST`
        );
        return {
          tld,
          price: result.price ? result.price / 1000000 : null,
          currency: result.currency || 'GBP',
        };
      } catch {
        return { tld, price: null, currency: 'GBP' };
      }
    });
    
    const pricing = await Promise.all(pricingPromises);
    
    // Default pricing if API doesn't return prices
    const defaultPricing: Record<string, { price: number; renewal: number }> = {
      'com': { price: 12.99, renewal: 17.99 },
      'co.uk': { price: 9.99, renewal: 12.99 },
      'uk': { price: 7.99, renewal: 9.99 },
      'net': { price: 14.99, renewal: 17.99 },
      'org': { price: 13.99, renewal: 16.99 },
      'io': { price: 39.99, renewal: 49.99 },
    };
    
    return {
      domains: pricing.map(p => ({
        tld: p.tld,
        price: p.price || defaultPricing[p.tld]?.price || 12.99,
        renewal: defaultPricing[p.tld]?.renewal || 17.99,
        currency: p.currency,
      })),
      hosting: [
        { name: 'Starter', price: 4.99, period: 'month', features: ['1 Website', '30GB Storage', 'Free SSL'] },
        { name: 'Economy', price: 7.99, period: 'month', features: ['1 Website', '100GB Storage', 'Free SSL', 'Free Domain'] },
        { name: 'Deluxe', price: 9.99, period: 'month', features: ['Unlimited Websites', 'Unlimited Storage', 'Free SSL', 'Free Domain'] },
        { name: 'Ultimate', price: 14.99, period: 'month', features: ['Unlimited Websites', 'Unlimited Storage', 'Free SSL', 'Free Domain', 'Premium DNS', 'Priority Support'] },
      ],
    };
  } catch (error) {
    console.error('Failed to get pricing:', error);
    // Return default pricing
    return {
      domains: [
        { tld: 'com', price: 12.99, renewal: 17.99, currency: 'GBP' },
        { tld: 'co.uk', price: 9.99, renewal: 12.99, currency: 'GBP' },
        { tld: 'uk', price: 7.99, renewal: 9.99, currency: 'GBP' },
        { tld: 'net', price: 14.99, renewal: 17.99, currency: 'GBP' },
        { tld: 'org', price: 13.99, renewal: 16.99, currency: 'GBP' },
        { tld: 'io', price: 39.99, renewal: 49.99, currency: 'GBP' },
      ],
      hosting: [
        { name: 'Starter', price: 4.99, period: 'month', features: ['1 Website', '30GB Storage', 'Free SSL'] },
        { name: 'Economy', price: 7.99, period: 'month', features: ['1 Website', '100GB Storage', 'Free SSL', 'Free Domain'] },
        { name: 'Deluxe', price: 9.99, period: 'month', features: ['Unlimited Websites', 'Unlimited Storage', 'Free SSL', 'Free Domain'] },
        { name: 'Ultimate', price: 14.99, period: 'month', features: ['Unlimited Websites', 'Unlimited Storage', 'Free SSL', 'Free Domain', 'Premium DNS', 'Priority Support'] },
      ],
    };
  }
}

// Create a GoDaddy subaccount (shopper) for the instructor
async function createShopper(email: string, firstName: string, lastName: string) {
  const shopperData = {
    email,
    externalId: crypto.randomUUID(),
    marketId: 'en-GB',
    nameFirst: firstName,
    nameLast: lastName,
  };
  
  const result = await makeGoDaddyRequest('/shoppers/subaccount', 'POST', shopperData);
  return result;
}

// Purchase a domain for a shopper
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

  // Get instructor details
  const { data: instructor, error: instructorError } = await supabaseClient
    .from('instructors')
    .select('id, name, email')
    .eq('auth_user_id', user.id)
    .single();

  if (instructorError || !instructor) {
    throw new Error('Instructor profile not found');
  }

  const domainParts = domain.split('.');
  const tld = domainParts.slice(1).join('.');

  // First, check domain availability and get the exact price
  let domainPrice = 12.99; // default
  try {
    const availabilityCheck = await makeGoDaddyRequest(
      `/domains/available?domain=${encodeURIComponent(domain)}&checkType=FULL`
    );
    if (!availabilityCheck.available) {
      throw new Error('Domain is no longer available');
    }
    if (availabilityCheck.price) {
      domainPrice = availabilityCheck.price / 1000000;
    }
  } catch (error) {
    console.error('Failed to verify domain availability:', error);
    throw new Error('Could not verify domain availability');
  }

  // Create order in database
  const orderData = {
    instructor_id: instructor.id,
    domain_name: domain,
    tld: tld,
    order_type: 'domain',
    status: 'pending',
    price_amount: domainPrice,
    period_years: period,
    currency: 'GBP',
  };

  console.log('Creating domain order:', orderData);

  const { data: order, error: orderError } = await supabaseClient
    .from('domain_orders')
    .insert(orderData)
    .select()
    .single();

  if (orderError) {
    console.error('Error creating order:', orderError);
    throw new Error('Failed to create order');
  }

  // TODO: In production, you would:
  // 1. Create a Stripe checkout session for the domain purchase
  // 2. On successful payment, call GoDaddy API to purchase the domain
  // 3. Update the order status to 'completed'
  
  // For now, we just create the order and return it
  return {
    success: true,
    orderId: order.id,
    message: 'Domain order created. Complete payment to finalize purchase.',
    domain,
    period,
    price: domainPrice,
    currency: 'GBP',
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
        JSON.stringify({ error: 'GoDaddy API not configured. Please add GODADDY_API_KEY and GODADDY_API_SECRET to your secrets.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, domain, tlds, period, shopperInfo }: DomainSearchRequest = await req.json();
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

      case 'create-shopper':
        if (!shopperInfo) {
          throw new Error('Shopper info is required');
        }
        result = await createShopper(shopperInfo.email, shopperInfo.firstName, shopperInfo.lastName);
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
