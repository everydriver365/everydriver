import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TWENTYI_API_KEY = Deno.env.get('TWENTYI_API_KEY');
const TWENTYI_BASE_URL = 'https://api.20i.com';

interface DomainSearchResult {
  domain: string;
  available: boolean;
  premium: boolean;
  price?: number;
  currency?: string;
  period?: number;
}

interface HostingPackage {
  id: string;
  name: string;
  type: string;
  price: number;
  currency: string;
  features: string[];
}

// Helper function to make 20i API requests
async function make20iRequest(
  endpoint: string, 
  method = 'GET', 
  body?: unknown
): Promise<{ data?: unknown; error?: string; status: number }> {
  if (!TWENTYI_API_KEY) {
    return { error: 'API credentials not configured', status: 500 };
  }

  const url = `${TWENTYI_BASE_URL}${endpoint}`;
  console.log(`Making 20i API request: ${method} ${url}`);

  try {
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${TWENTYI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const responseText = await response.text();
    
    console.log(`20i API response status: ${response.status}`);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = responseText;
    }

    if (!response.ok) {
      console.error('20i API error:', data);
      return { 
        error: typeof data === 'object' ? (data.message || data.error || 'API request failed') : 'API request failed',
        status: response.status 
      };
    }

    return { data, status: response.status };
  } catch (error: unknown) {
    console.error('20i API request error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Network error';
    return { error: errorMessage, status: 500 };
  }
}

// Search for domain availability
async function searchDomain(domain: string): Promise<DomainSearchResult> {
  const { data, error, status } = await make20iRequest(`/domain/${encodeURIComponent(domain)}`);
  
  if (error) {
    console.log(`Domain search failed for ${domain}, returning as unavailable`);
    return {
      domain,
      available: false,
      premium: false,
    };
  }

  const result = data as { available?: boolean; premium?: boolean; price?: number };
  
  return {
    domain,
    available: result?.available ?? false,
    premium: result?.premium ?? false,
    price: result?.price,
    currency: 'GBP',
    period: 1,
  };
}

// Check multiple domains at once
async function checkMultipleDomains(baseName: string, tlds?: string[]): Promise<DomainSearchResult[]> {
  const defaultTlds = ['co.uk', 'com', 'uk', 'org', 'net', 'info', 'biz', 'me'];
  const tldsToCheck = tlds || defaultTlds;
  
  // Clean the base name - remove any existing TLD
  const cleanBaseName = baseName.replace(/\.[a-z.]+$/i, '').toLowerCase().trim();
  
  console.log(`Checking domains for base: ${cleanBaseName} with TLDs: ${tldsToCheck.join(', ')}`);
  
  const results: DomainSearchResult[] = [];
  
  // Check domains in parallel (limit to 5 concurrent requests)
  const batchSize = 5;
  for (let i = 0; i < tldsToCheck.length; i += batchSize) {
    const batch = tldsToCheck.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(tld => {
        const fullDomain = `${cleanBaseName}.${tld}`;
        return searchDomain(fullDomain);
      })
    );
    results.push(...batchResults);
  }
  
  return results;
}

// Get available TLDs and pricing
async function getTLDPricing(): Promise<{ tlds: { tld: string; price: number; currency: string }[] }> {
  const { data, error } = await make20iRequest('/domain-pricing');
  
  if (error || !data) {
    // Return default pricing if API fails
    return {
      tlds: [
        { tld: 'co.uk', price: 9.99, currency: 'GBP' },
        { tld: 'com', price: 12.99, currency: 'GBP' },
        { tld: 'uk', price: 5.99, currency: 'GBP' },
        { tld: 'org', price: 14.99, currency: 'GBP' },
        { tld: 'net', price: 14.99, currency: 'GBP' },
        { tld: 'info', price: 4.99, currency: 'GBP' },
        { tld: 'biz', price: 14.99, currency: 'GBP' },
        { tld: 'me', price: 19.99, currency: 'GBP' },
      ]
    };
  }
  
  return { tlds: data as { tld: string; price: number; currency: string }[] };
}

// Get hosting packages
async function getHostingPackages(): Promise<HostingPackage[]> {
  const { data, error } = await make20iRequest('/package-types');
  
  if (error || !data) {
    // Return default packages if API fails
    return [
      {
        id: 'starter',
        name: 'Starter Hosting',
        type: 'shared',
        price: 4.99,
        currency: 'GBP',
        features: ['5GB Storage', '50GB Bandwidth', '1 Website', 'Free SSL', 'Email Hosting']
      },
      {
        id: 'business',
        name: 'Business Hosting',
        type: 'shared',
        price: 9.99,
        currency: 'GBP',
        features: ['25GB Storage', '250GB Bandwidth', '10 Websites', 'Free SSL', 'Email Hosting', 'Daily Backups']
      },
      {
        id: 'professional',
        name: 'Professional Hosting',
        type: 'shared',
        price: 19.99,
        currency: 'GBP',
        features: ['Unlimited Storage', 'Unlimited Bandwidth', 'Unlimited Websites', 'Free SSL', 'Email Hosting', 'Daily Backups', 'Priority Support']
      },
    ];
  }
  
  return data as HostingPackage[];
}

// Register a domain
async function registerDomain(
  domain: string, 
  period: number,
  contactDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    postcode?: string;
    country?: string;
  }
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  const { data, error } = await make20iRequest('/domain', 'POST', {
    name: domain,
    period,
    contact: {
      organisation: '',
      name: `${contactDetails.firstName} ${contactDetails.lastName}`,
      address: contactDetails.address || '',
      telephone: contactDetails.phone || '',
      email: contactDetails.email,
      cc: contactDetails.country || 'GB',
      pc: contactDetails.postcode || '',
      sp: '',
      city: contactDetails.city || '',
    }
  });
  
  if (error) {
    return { success: false, error };
  }
  
  const result = data as { id?: string; order_id?: string };
  return { 
    success: true, 
    orderId: result?.id || result?.order_id 
  };
}

// Provision hosting package
async function provisionHosting(
  packageId: string,
  domainName: string,
  label?: string
): Promise<{ success: boolean; packageRef?: string; error?: string }> {
  const { data, error } = await make20iRequest('/package', 'POST', {
    type: packageId,
    domain_name: domainName,
    label: label || domainName,
  });
  
  if (error) {
    return { success: false, error };
  }
  
  const result = data as { id?: string; reference?: string };
  return { 
    success: true, 
    packageRef: result?.id || result?.reference 
  };
}

// Get reseller account info
async function getAccountInfo(): Promise<{ balance?: number; currency?: string; error?: string }> {
  const { data, error } = await make20iRequest('/reseller');
  
  if (error) {
    return { error };
  }
  
  const result = data as { balance?: number; currency?: string };
  return { 
    balance: result?.balance, 
    currency: result?.currency || 'GBP' 
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();
    console.log(`20i API action: ${action}`, params);

    let result;

    switch (action) {
      case 'search':
        if (!params.domain) {
          throw new Error('Domain name is required');
        }
        result = await searchDomain(params.domain);
        break;

      case 'check-multiple':
        if (!params.domain) {
          throw new Error('Domain name is required');
        }
        result = await checkMultipleDomains(params.domain, params.tlds);
        break;

      case 'get-pricing':
        result = await getTLDPricing();
        break;

      case 'get-hosting-packages':
        result = await getHostingPackages();
        break;

      case 'register-domain':
        if (!params.domain || !params.contact) {
          throw new Error('Domain and contact details are required');
        }
        result = await registerDomain(params.domain, params.period || 1, params.contact);
        break;

      case 'provision-hosting':
        if (!params.packageId || !params.domain) {
          throw new Error('Package ID and domain are required');
        }
        result = await provisionHosting(params.packageId, params.domain, params.label);
        break;

      case 'get-account-info':
        result = await getAccountInfo();
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in 20i API function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
