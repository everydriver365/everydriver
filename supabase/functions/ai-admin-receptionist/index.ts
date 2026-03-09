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
    if (!geoRes.ok) {
      console.error("Geocoding failed:", geoRes.status);
      return null;
    }
    const geoData = await geoRes.json();
    console.log("Geocoding response:", JSON.stringify(geoData.result?.[0]));
    const result = geoData.result?.[0]?.result;
    if (!result) {
      console.error("No geocoding result for postcode:", postcode);
      return null;
    }

    const userLat = result.latitude;
    const userLng = result.longitude;
    const areaName = result.admin_district || null;
    console.log(`User location: ${userLat}, ${userLng} (${areaName})`);

    // Fetch active instructors
    const { data: instructors, error: instructorsError } = await supabase
      .from("instructors")
      .select("id, name, home_postcode, home_address, hourly_rate, lat, lng, profile_image_url, special_skills, location_name, app_slug, car_type, car_make, car_model, brand_colour, bio, school_skim_amount, transmission_type")
      .eq("is_active", true);

    if (instructorsError) {
      console.error("Instructor query error:", instructorsError.message);
      return { areaName, instructors: [], courses: [] };
    }

    console.log(`Found ${instructors?.length || 0} active instructors. User coords: ${userLat}, ${userLng}`);
    if (instructors) {
      for (const inst of instructors) {
        console.log(`Instructor: ${inst.name}, postcode: ${inst.home_postcode}, lat: ${inst.lat}, lng: ${inst.lng}`);
      }
    }

    if (!instructors || instructors.length === 0) return { areaName, instructors: [], courses: [] };

    // Geocode instructors missing lat/lng
    const needsGeocoding = instructors.filter((i: any) => !i.lat && i.home_postcode);
    if (needsGeocoding.length > 0) {
      try {
        const postcodes = needsGeocoding.map((i: any) => i.home_postcode.replace(/\s+/g, "").toUpperCase());
        const bulkRes = await fetch("https://api.postcodes.io/postcodes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postcodes }),
        });
        if (bulkRes.ok) {
          const bulkData = await bulkRes.json();
          for (const item of (bulkData.result || [])) {
            if (item.result) {
              const inst = needsGeocoding.find((i: any) => 
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
    const nearby: any[] = [];
    for (const inst of instructors) {
      const instLat = inst.lat ? Number(inst.lat) : null;
      const instLng = inst.lng ? Number(inst.lng) : null;
      if (!instLat || !instLng) {
        console.log(`Skipping ${inst.name} - no lat/lng (raw: ${inst.lat}, ${inst.lng})`);
        continue;
      }
      const dist = calculateDistance(userLat, userLng, instLat, instLng);
      console.log(`Distance to ${inst.name}: ${dist.toFixed(2)} miles (lat: ${instLat}, lng: ${instLng})`);
      if (dist <= 15) {
        nearby.push({
          id: inst.id,
          name: inst.name,
          distance: Math.round(dist * 10) / 10,
          hourlyRate: inst.hourly_rate,
          transmission: inst.transmission_type || "Manual",
          area: inst.location_name || null,
          specialSkills: inst.special_skills || null,
          slug: inst.app_slug || null,
          profileImage: inst.profile_image_url || null,
          carType: inst.car_type || inst.transmission_type || "Manual",
          carMake: inst.car_make || null,
          carModel: inst.car_model || null,
          brandColour: inst.brand_colour || null,
          homePostcode: inst.home_postcode || null,
          homeAddress: inst.home_address || null,
          bio: inst.bio || null,
          schoolSkimAmount: inst.school_skim_amount || 0,
        });
      }
    }
    console.log(`Found ${nearby.length} nearby instructors`);

    // Sort by distance
    nearby.sort((a: any, b: any) => a.distance - b.distance);
    const topInstructors = nearby.slice(0, 5);

    // Fetch courses for nearby instructors
    let courses: any[] = [];
    if (topInstructors.length > 0) {
      const instructorIds = topInstructors.map((i: any) => i.id);
      const { data: instructorCourses } = await supabase
        .from("instructor_courses")
        .select("course_name, course_hours, discounted_price, instructor_id, is_active")
        .in("instructor_id", instructorIds)
        .eq("is_active", true);

      // Fetch course templates for is_popular/is_intensive flags
      const { data: templates } = await supabase
        .from("course_templates")
        .select("course_hours, course_name, is_popular, is_intensive, features")
        .eq("is_active", true);

      if (instructorCourses && instructorCourses.length > 0) {
        for (const ic of instructorCourses) {
          const inst = topInstructors.find((i: any) => i.id === ic.instructor_id);
          const template = templates?.find((t: any) => t.course_hours === ic.course_hours);
          courses.push({
            courseName: ic.course_name,
            courseHours: ic.course_hours,
            price: ic.discounted_price || (inst?.hourlyRate ? inst.hourlyRate * ic.course_hours : null),
            discountedPrice: ic.discounted_price || null,
            instructorName: inst?.name || "Instructor",
            instructorSlug: inst?.slug || null,
            instructorId: inst?.id || null,
            instructorProfileImage: inst?.profileImage || null,
            instructorCarType: inst?.carType || "Manual",
            instructorCarMake: inst?.carMake || null,
            instructorCarModel: inst?.carModel || null,
            instructorBrandColour: inst?.brandColour || null,
            instructorPostcode: inst?.homePostcode || null,
            instructorAddress: inst?.homeAddress || null,
            instructorBio: inst?.bio || null,
            instructorHourlyRate: inst?.hourlyRate || null,
            instructorSchoolSkim: inst?.schoolSkimAmount || 0,
            distance: inst?.distance || null,
            isIntensive: template?.is_intensive || false,
            isPopular: template?.is_popular || false,
            features: template?.features || null,
          });
        }
        // Sort: popular first, then by hours
        courses.sort((a: any, b: any) => {
          if (a.isPopular !== b.isPopular) return a.isPopular ? -1 : 1;
          return a.courseHours - b.courseHours;
        });
        // Limit to 6 courses
        courses = courses.slice(0, 6);
      }
    }

    return { areaName, instructors: topInstructors, courses };
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

    // If the most recent message is from a HUMAN admin (not AI bot), skip AI
    const isHumanAdminReply = recentMessages && recentMessages.length > 0 && 
      recentMessages[0].sender_type === "admin" && 
      !recentMessages[0].content.startsWith("🤖");
    if (isHumanAdminReply) {
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
        if (cachedSearchResult.courses.length > 0) {
          const courseList = cachedSearchResult.courses.map((c: any) =>
            `- ${c.courseName} (${c.courseHours} hours${c.price ? `, £${c.price}` : ""}) with ${c.instructorName}${c.isIntensive ? " [Intensive]" : ""}${c.isPopular ? " [Popular]" : ""}`
          ).join("\n");
          instructorContext = `\n\nCOURSE SEARCH RESULTS for postcode "${postcodeMatch[1]}"${cachedSearchResult.areaName ? ` (${cachedSearchResult.areaName})` : ""}:\n${courseList}\n\nPresent these courses warmly to the visitor. Mention course names, hours, pricing, and the instructor offering them. The visitor will see clickable course cards below your message — do NOT tell them to visit another page or provide any links. Just summarise available courses nearby.`;
        } else if (cachedSearchResult.instructors.length > 0) {
          instructorContext = `\n\nFound instructors near "${postcodeMatch[1]}" but no specific courses listed yet. Let the visitor know instructors are available in their area and suggest they get in touch for course details.`;
        } else {
          instructorContext = `\n\nCOURSE SEARCH: No instructors or courses found within 15 miles of "${postcodeMatch[1]}"${cachedSearchResult.areaName ? ` (${cachedSearchResult.areaName})` : ""}. Let the visitor know we don't currently have coverage in that area yet and suggest they try a different postcode or check back soon.`;
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
- EveryDriver helps learners find local driving instructors and book courses
- Instructors offer manual and automatic lessons
- Learners can search by postcode to find available courses near them
- Courses range from regular weekly lessons to intensive crash courses
- Pricing varies by instructor, location, and course type
- Learners can view available courses, compare options, and book directly from the chat

Guidelines:
- Be warm, professional, and concise (2-3 sentences max)
- Answer questions about finding instructors, booking lessons, pricing, and how the platform works
- If they want to find an instructor, ask for their postcode so you can search
- If they have account issues, suggest they contact support
- Don't make up specific prices or instructor details — only use data provided in INSTRUCTOR SEARCH RESULTS
- If unsure, suggest they contact support
- Use British English
- When presenting instructor search results, do NOT include links to /courses or tell the user to visit another page. Clickable instructor cards will appear automatically below your message. Just summarise the results naturally and conversationally${instructorContext}`;

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

    // Build stored content with optional course cards
    let storedContent = `🤖 ${reply}`;
    if (cachedSearchResult && cachedSearchResult.courses && cachedSearchResult.courses.length > 0) {
      storedContent += `<!--COURSES:${JSON.stringify(cachedSearchResult.courses)}-->`;
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
