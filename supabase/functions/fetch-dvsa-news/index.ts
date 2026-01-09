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
  pubDate: string;
  imageUrl: string | null;
  category: string;
}

function extractImageFromContent(content: string): string | null {
  // Try to find an image URL in the content
  const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch) {
    return imgMatch[1];
  }
  
  // Try to find media:content or enclosure
  const mediaMatch = content.match(/url=["']([^"']+\.(?:jpg|jpeg|png|gif|webp)[^"']*)["']/i);
  if (mediaMatch) {
    return mediaMatch[1];
  }
  
  return null;
}

function parseRSSFeed(xmlText: string): NewsItem[] {
  const items: NewsItem[] = [];
  
  // Parse items from the RSS/Atom feed
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
    const descMatch = itemContent.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>|<summary[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/summary>|<content[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/content>/i);
    let description = descMatch ? (descMatch[1] || descMatch[2] || descMatch[3] || '').trim() : '';
    
    // Clean HTML from description for display
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
    
    // Extract date
    const dateMatch = itemContent.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>|<published[^>]*>([\s\S]*?)<\/published>|<updated[^>]*>([\s\S]*?)<\/updated>/i);
    const pubDate = dateMatch ? (dateMatch[1] || dateMatch[2] || dateMatch[3] || '').trim() : '';
    
    // Extract category
    const categoryMatch = itemContent.match(/<category[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/category>/i);
    const category = categoryMatch ? categoryMatch[1].trim().replace(/<!\[CDATA\[|\]\]>/g, '') : 'Driving News';
    
    // Try to extract image from content or media
    let imageUrl = extractImageFromContent(itemContent);
    
    // Also check the full description for images
    if (!imageUrl) {
      imageUrl = extractImageFromContent(description);
    }
    
    // Check for media:thumbnail or media:content
    const mediaThumbnailMatch = itemContent.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i);
    if (mediaThumbnailMatch) {
      imageUrl = mediaThumbnailMatch[1];
    }
    
    const mediaContentMatch = itemContent.match(/<media:content[^>]+url=["']([^"']+)["']/i);
    if (!imageUrl && mediaContentMatch) {
      imageUrl = mediaContentMatch[1];
    }
    
    // Check for enclosure (common in RSS for images)
    const enclosureMatch = itemContent.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]*type=["']image/i);
    if (!imageUrl && enclosureMatch) {
      imageUrl = enclosureMatch[1];
    }
    
    items.push({
      title,
      link,
      description: cleanDescription,
      pubDate,
      imageUrl,
      category,
    });
  }
  
  return items;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching DVSA news from despatch.blog.gov.uk...');
    
    // Fetch the DVSA Despatch blog RSS feed
    const feedUrl = 'https://despatch.blog.gov.uk/feed/';
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DrivingSchoolApp/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch RSS feed: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch RSS feed: ${response.status}`);
    }

    const xmlText = await response.text();
    console.log(`Received ${xmlText.length} bytes from RSS feed`);
    
    const newsItems = parseRSSFeed(xmlText);
    console.log(`Parsed ${newsItems.length} news items`);
    
    // Return the top 5 items
    const topItems = newsItems.slice(0, 5);

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
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage,
      items: [],
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
