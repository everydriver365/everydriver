import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const UK_POSTCODE_REGEX = /\b([A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2})\b/i;

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function findNearbyInstructors(supabase: any, postcode: string) {
  try {
    // Geocode the visitor's postcode
    const geoRes = await fetch("https://api.postcodes.io/postcodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postcodes: [postcode.replace(/\s+/g, "").toUpperCase()] }),
    });
    if (!geoRes.ok) return null;
    const geoData = await geoRes.json();
    const result = geoData.result?.[0]?.result;
    if (!result) return null;

    const userLat = result.latitude;
    const userLng = result.longitude;
    const areaName = result.admin_district || null;

    // Fetch active instructors
    const { data: instructors, error: instructorsError } = await supabase
      .from("instructors")
      .select("name, home_postcode, hourly_rate, lat, lng, profile_image_url, special_skills, location_name, app_slug")
      .eq("is_active", true);

    if (instructorsError) {
      console.error("Instructor query error:", instructorsError.message);
      return { areaName, instructors: [] };
    }

    if (!instructors || instructors.length === 0) return { areaName, instructors: [] };

    // Geocode any instructors missing lat/lng
    const needsGeocoding = instructors.filter(i => (!i.lat || !i.lng) && i.home_postcode && i.home_postcode !== "N/A");
    if (needsGeocoding.length > 0) {
      const postcodes = needsGeocoding.map(i => i.home_postcode.replace(/\s+/g, "").toUpperCase());
      try {
        const bulkRes = await fetch("https://api.postcodes.io/postcodes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postcodes }),
        });
        if (bulkRes.ok) {
          const bulkData = await bulkRes.json();
          for (const item of (bulkData.result || [])) {
            if (item.result) {
              const inst = needsGeocoding.find(i => 
                i.home_postcode.replace(/\s+/g, "").toUpperCase() === item.query
              );
              if (inst) {
                inst.lat = item.result.latitude;
                inst.lng = item.result.longitude;
              }
            }
          }
        }
      } catch (e) {
        console.error("Bulk geocoding error:", e);
      }
    }

    // Find instructors within 15 miles
    const nearby = [];
    for (const inst of instructors) {
      if (!inst.lat || !inst.lng) continue;
      const dist = calculateDistance(userLat, userLng, inst.lat, inst.lng);
      if (dist <= 15) {
        nearby.push({
          name: inst.name,
          distance: Math.round(dist * 10) / 10,
          hourlyRate: inst.hourly_rate,
          transmission: "Manual/Automatic",
          area: inst.location_name || null,
          specialSkills: inst.special_skills || null,
          slug: inst.app_slug || null,
          profileImage: inst.profile_image_url || null,
        });
      }
    }

    // Sort by distance
    nearby.sort((a, b) => a.distance - b.distance);

    return { areaName, instructors: nearby.slice(0, 5) };
  } catch (e) {
    console.error("Instructor search error:", e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { session_id, message } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if a human admin has already replied since the visitor's message
    const { data: recentMessages } = await supabase
      .from("live_chat_messages")
      .select("sender_type, content")
      .eq("session_id", session_id)
      .order("created_at", { ascending: false })
      .limit(3);

    // If the most recent message is from admin (human), skip AI
    if (recentMessages && recentMessages.length > 0 && recentMessages[0].sender_type === "admin") {
      return new Response(JSON.stringify({ reply: null, reason: "human_replied" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if message contains a UK postcode
    const postcodeMatch = message.match(UK_POSTCODE_REGEX);
    let instructorContext = "";
    let cachedSearchResult: any = null;

    if (postcodeMatch) {
      cachedSearchResult = await findNearbyInstructors(supabase, postcodeMatch[1]);
      if (cachedSearchResult) {
        if (cachedSearchResult.instructors.length > 0) {
          const list = cachedSearchResult.instructors.map((i: any) =>
            `- ${i.name} (${i.transmission}, ${i.distance} miles away${i.hourlyRate ? `, £${i.hourlyRate}/hr` : ""})`
          ).join("\n");
          instructorContext = `\n\nINSTRUCTOR SEARCH RESULTS for postcode "${postcodeMatch[1]}"${cachedSearchResult.areaName ? ` (${cachedSearchResult.areaName})` : ""}:\n${list}\n\nPresent these results helpfully to the visitor. Include names, distance, transmission type, and hourly rate. Suggest they visit the courses page to book.`;
        } else {
          instructorContext = `\n\nINSTRUCTOR SEARCH: No instructors found within 15 miles of "${postcodeMatch[1]}"${cachedSearchResult.areaName ? ` (${cachedSearchResult.areaName})` : ""}. Let the visitor know we don't currently have instructors in that area but they can check back or try a different postcode. Suggest they browse the courses page.`;
        }
      }
    }

    // Get conversation history for context
    const { data: history } = await supabase
      .from("live_chat_messages")
      .select("sender_type, content")
      .eq("session_id", session_id)
      .order("created_at", { ascending: true })
      .limit(20);

    const conversationHistory = (history || []).map((m: any) => ({
      role: m.sender_type === "visitor" ? "user" : "assistant",
      content: m.content,
    }));

    const systemPrompt = `You are a friendly, helpful receptionist for EveryDriver (Drive365), an online platform that connects learner drivers with qualified driving instructors across the UK.

Key information:
- EveryDriver helps learners find local driving instructors
- Instructors offer manual and automatic lessons
- Learners can search by postcode to find instructors in their area
- Courses range from regular weekly lessons to intensive crash courses
- Pricing varies by instructor and location
- The platform offers online booking and secure payments
- Learners can read reviews and compare instructors
- The website URL for courses is /courses

Guidelines:
- Be warm, professional, and concise (2-3 sentences max)
- Answer questions about finding instructors, booking lessons, pricing, and how the platform works
- If they want to find an instructor, ask for their postcode so you can search
- If they have account issues, suggest they contact support
- Don't make up specific prices or instructor details — only use data provided in INSTRUCTOR SEARCH RESULTS
- If unsure, suggest they browse the website or contact support
- Use British English
- When sharing instructor results, format them nicely and encourage booking via the courses page${instructorContext}`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...conversationHistory,
          { role: "user", content: message },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI service unavailable" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const reply = aiData.choices?.[0]?.message?.content || "I'm sorry, I couldn't process that. Please try browsing our website or contacting support.";

    // Build stored content with optional instructor cards
    let storedContent = `🤖 ${reply}`;
    if (cachedSearchResult && cachedSearchResult.instructors.length > 0) {
      const cardsData = cachedSearchResult.instructors.map((i: any) => ({
        name: i.name,
        slug: i.slug,
        hourlyRate: i.hourlyRate,
        distance: i.distance,
        profileImage: i.profileImage,
        transmission: i.transmission,
      }));
      storedContent += `<!--CARDS:${JSON.stringify(cardsData)}-->`;
    }

    // Insert AI response as a chat message
    await supabase.from("live_chat_messages").insert({
      session_id,
      sender_type: "admin",
      content: storedContent,
    });

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-admin-receptionist error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
