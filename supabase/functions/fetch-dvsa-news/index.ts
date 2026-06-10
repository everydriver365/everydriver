import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NewsItem {
  title: string;
  link: string;
  description: string;
  fullContent: string;
  pubDate: string;
  imageUrl: string | null;
  category: string;
  slug: string;
}

function extractImageFromContent(content: string): string | null {
  const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch) {
    return imgMatch[1];
  }
  const mediaMatch = content.match(/url=["']([^"']+\.(?:jpg|jpeg|png|gif|webp)[^"']*)["']/i);
  if (mediaMatch) {
    return mediaMatch[1];
  }
  return null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
}

function cleanHtmlToReadable(html: string): string {
  // Remove CDATA wrappers
  let clean = html.replace(/<!\[CDATA\[|\]\]>/g, '');
  
  // Remove script and style tags and their content
  clean = clean.replace(/<script[\s\S]*?<\/script>/gi, '');
  clean = clean.replace(/<style[\s\S]*?<\/style>/gi, '');
  
  // Keep paragraph structure by converting tags to markers
  clean = clean.replace(/<\/p>/gi, '\n\n');
  clean = clean.replace(/<br\s*\/?>/gi, '\n');
  clean = clean.replace(/<\/h[1-6]>/gi, '\n\n');
  clean = clean.replace(/<\/li>/gi, '\n');
  clean = clean.replace(/<li[^>]*>/gi, '• ');
  clean = clean.replace(/<\/ul>|<\/ol>/gi, '\n');
  
  // Remove all remaining HTML tags
  clean = clean.replace(/<[^>]+>/g, '');
  
  // Decode HTML entities
  clean = clean.replace(/&nbsp;/g, ' ');
  clean = clean.replace(/&amp;/g, '&');
  clean = clean.replace(/&lt;/g, '<');
  clean = clean.replace(/&gt;/g, '>');
  clean = clean.replace(/&quot;/g, '"');
  clean = clean.replace(/&#8217;/g, "'");
  clean = clean.replace(/&#8216;/g, "'");
  clean = clean.replace(/&#8220;/g, '"');
  clean = clean.replace(/&#8221;/g, '"');
  clean = clean.replace(/&#8211;/g, '–');
  clean = clean.replace(/&#8212;/g, '—');
  clean = clean.replace(/&#\d+;/g, '');
  
  // Clean up whitespace
  clean = clean.replace(/[ \t]+/g, ' ');
  clean = clean.replace(/\n{3,}/g, '\n\n');
  clean = clean.trim();
  
  return clean;
}

function parseRSSFeed(xmlText: string): NewsItem[] {
  const items: NewsItem[] = [];
  
  const itemMatches = xmlText.matchAll(/<item>([\s\S]*?)<\/item>|<entry>([\s\S]*?)<\/entry>/gi);
  
  for (const match of itemMatches) {
    const itemContent = match[1] || match[2];
    
    // Extract title
    const titleMatch = itemContent.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim().replace(/<!\[CDATA\[|\]\]>/g, '') : 'Untitled';
    
    // Extract link
    const linkMatch = itemContent.match(/<link[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>|<link[^>]+href=["']([^"']+)["']/i);
    const link = linkMatch ? (linkMatch[1] || linkMatch[2] || '').trim() : '';
    
    // Extract description/summary
    const descMatch = itemContent.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>|<summary[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/summary>/i);
    let description = descMatch ? (descMatch[1] || descMatch[2] || '').trim() : '';
    
    // Extract full content (content:encoded is typical in WordPress RSS)
    const contentMatch = itemContent.match(/<content:encoded[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/content:encoded>/i);
    const rawFullContent = contentMatch ? contentMatch[1].trim() : description;
    
    // Clean description for card display
    const cleanDescription = description
      .replace(/<!\[CDATA\[|\]\]>/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim()
      .substring(0, 200);
    
    // Clean full content to readable text
    const fullContent = cleanHtmlToReadable(rawFullContent);
    
    // Extract date
    const dateMatch = itemContent.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>|<published[^>]*>([\s\S]*?)<\/published>|<updated[^>]*>([\s\S]*?)<\/updated>/i);
    const pubDate = dateMatch ? (dateMatch[1] || dateMatch[2] || dateMatch[3] || '').trim() : '';
    
    // Extract category
    const categoryMatch = itemContent.match(/<category[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/category>/i);
    const category = categoryMatch ? categoryMatch[1].trim().replace(/<!\[CDATA\[|\]\]>/g, '') : 'Driving News';
    
    // Try to extract image
    let imageUrl = extractImageFromContent(itemContent);
    if (!imageUrl) {
      imageUrl = extractImageFromContent(description);
    }
    if (!imageUrl) {
      imageUrl = extractImageFromContent(rawFullContent);
    }
    
    const mediaThumbnailMatch = itemContent.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i);
    if (mediaThumbnailMatch) {
      imageUrl = mediaThumbnailMatch[1];
    }
    
    const mediaContentMatch = itemContent.match(/<media:content[^>]+url=["']([^"']+)["']/i);
    if (!imageUrl && mediaContentMatch) {
      imageUrl = mediaContentMatch[1];
    }
    
    const enclosureMatch = itemContent.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]*type=["']image/i);
    if (!imageUrl && enclosureMatch) {
      imageUrl = enclosureMatch[1];
    }
    
    items.push({
      title,
      link,
      description: cleanDescription,
      fullContent,
      pubDate,
      imageUrl,
      category,
      slug: slugify(title),
    });
  }
  
  return items;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching DVSA news from despatch.blog.gov.uk...');
    
    const feedUrl = 'https://despatch.blog.gov.uk/feed/';
    // Proxies used as fallback when gov.uk resets the connection from edge IPs.
    const proxied = [
      feedUrl,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}`,
      `https://r.jina.ai/${feedUrl}`,
    ];

    let response: Response | null = null;
    let lastErr: unknown = null;
    outer: for (const url of proxied) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const ctrl = new AbortController();
          const t = setTimeout(() => ctrl.abort(), 15000);
          const r = await fetch(url, {
            signal: ctrl.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; DrivingSchoolApp/1.0)',
              'Accept': 'application/rss+xml, application/xml, text/xml, */*',
            },
          });
          clearTimeout(t);
          if (r.ok) { response = r; break outer; }
          lastErr = new Error(`Fetch ${url} -> ${r.status}`);
        } catch (e) {
          lastErr = e;
        }
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
      }
    }

    if (!response || !response.ok) {
      throw lastErr instanceof Error ? lastErr : new Error('Failed to fetch RSS feed');
    }

    const xmlText = await response.text();
    console.log(`Received ${xmlText.length} bytes from RSS feed`);
    
    const newsItems = parseRSSFeed(xmlText);
    console.log(`Parsed ${newsItems.length} news items`);
    
    const topItems = newsItems.slice(0, 10);

    return new Response(JSON.stringify({ 
      success: true, 
      items: topItems,
      fetchedAt: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching DVSA news:', errorMessage);
    // Return 200 with fallback signal so the frontend can degrade gracefully
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      fallback: true,
      items: [],
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
