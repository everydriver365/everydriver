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

// Helper function to encode API key to base64
function encodeToBase64(str: string): string {
  return btoa(str);
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

  // 20i API requires base64 encoded bearer token
  const encodedToken = encodeToBase64(TWENTYI_API_KEY);

  try {
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${encodedToken}`,
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

// Search for domain availability using the correct 20i endpoint
async function searchDomain(domain: string): Promise<DomainSearchResult> {
  const { data, error, status } = await make20iRequest(`/domain-search/${encodeURIComponent(domain)}`);
  
  if (error) {
    console.log(`Domain search failed for ${domain}: ${error}`);
    return {
      domain,
      available: false,
      premium: false,
    };
  }

  // 20i returns an array of results for the domain search
  const results = data as Array<{ name?: string; available?: boolean; premium?: boolean; price?: number }>;
  const match = Array.isArray(results) ? results.find(r => r.name === domain || r.name?.toLowerCase() === domain.toLowerCase()) : null;
  
  return {
    domain,
    available: match?.available ?? false,
    premium: match?.premium ?? false,
    price: match?.price,
    currency: 'GBP',
    period: 1,
  };
}

// Check multiple domains using individual domain checks for accuracy
async function checkMultipleDomains(baseName: string, tlds?: string[]): Promise<DomainSearchResult[]> {
  // Clean the base name - remove any existing TLD
  const cleanBaseName = baseName.replace(/\.[a-z.]+$/i, '').toLowerCase().trim();
  
  console.log(`Searching domains for: ${cleanBaseName}`);
  
  // Define TLDs to check - prioritize UK TLDs
  const tldsToCheck = tlds || ['co.uk', 'uk', 'com', 'org.uk', 'me.uk', 'net', 'org'];
  
  // Check each domain individually using the single domain endpoint for accuracy
  const results: DomainSearchResult[] = [];
  
  for (const tld of tldsToCheck) {
    const fullDomain = `${cleanBaseName}.${tld}`;
    
    try {
      // Use the specific domain check endpoint for more accurate results
      const { data, error } = await make20iRequest(`/domain/${encodeURIComponent(fullDomain)}/availability`);
      
      if (error) {
        // Fall back to the search endpoint for this TLD
        const searchResult = await searchDomain(fullDomain);
        results.push(searchResult);
        continue;
      }
      
      const availData = data as { 
        available?: boolean; 
        can?: string;
        premium?: boolean; 
        price?: number;
        register?: number;
      };
      
      // 20i uses multiple indicators for availability
      const isAvailable = availData?.available === true || availData?.can === 'register';
      
      results.push({
        domain: fullDomain,
        available: isAvailable,
        premium: availData?.premium ?? false,
        price: availData?.price ?? availData?.register,
        currency: 'GBP',
        period: 1,
      });
    } catch (e) {
      console.error(`Error checking ${fullDomain}:`, e);
      // Add as unavailable if check fails
      results.push({
        domain: fullDomain,
        available: false,
        premium: false,
        currency: 'GBP',
        period: 1,
      });
    }
  }
  
  // If individual checks all failed, fall back to bulk search endpoint
  if (results.every(r => !r.available)) {
    console.log('Individual checks returned no available domains, trying bulk search...');
    const { data, error } = await make20iRequest(`/domain-search/${encodeURIComponent(cleanBaseName)}`);
    
    if (!error && data && Array.isArray(data)) {
      const bulkResults = data as Array<{ 
        name?: string; 
        can?: string; 
        available?: boolean; 
        premium?: boolean; 
        price?: number;
        register?: number;
      }>;
      
      return bulkResults
        .filter(r => r.name && typeof r.name === 'string')
        .slice(0, 10) // Limit to 10 results
        .map(r => {
          let domainName = r.name || '';
          
          // If the result is just a TLD (starts with .), prepend the base name
          if (domainName.startsWith('.')) {
            domainName = cleanBaseName + domainName;
          } else if (!domainName.includes('.')) {
            domainName = cleanBaseName + '.' + domainName;
          }
          
          const isAvailable = r.can === 'register' || r.available === true;
          
          return {
            domain: domainName,
            available: isAvailable,
            premium: r.premium ?? false,
            price: r.price ?? r.register,
            currency: 'GBP',
            period: 1,
          };
        });
    }
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

// Provision hosting package using 20i reseller API
async function provisionHosting(
  packageId: string,
  domainName: string,
  label?: string
): Promise<{ success: boolean; packageRef?: string; error?: string }> {
  // 20i uses /reseller/*/addWeb endpoint for provisioning hosting
  // The * is automatically replaced with the authenticated reseller's ID
  const { data, error } = await make20iRequest('/reseller/*/addWeb', 'POST', {
    type: packageId,
    domain_name: domainName,
    label: label || domainName,
  });
  
  if (error) {
    return { success: false, error };
  }
  
  // Response contains the new package ID
  const result = data as { result?: string | number; id?: string; reference?: string };
  return { 
    success: true, 
    packageRef: String(result?.result || result?.id || result?.reference || '')
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
