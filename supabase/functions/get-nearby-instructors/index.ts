import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { instructorId } = await req.json();
    if (!instructorId) {
      return new Response(JSON.stringify({ error: "instructorId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get the calling instructor's GPS position
    const { data: myDevice } = await supabase
      .from("gps_devices")
      .select("last_latitude, last_longitude")
      .eq("instructor_id", instructorId)
      .eq("is_active", true)
      .not("last_latitude", "is", null)
      .order("last_seen_at", { ascending: false })
      .limit(1)
      .single();

    if (!myDevice?.last_latitude || !myDevice?.last_longitude) {
      return new Response(
        JSON.stringify({ friends: [], myPosition: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get accepted friends
    const { data: friendships } = await supabase
      .from("instructor_friends")
      .select("requester_id, recipient_id")
      .or(`requester_id.eq.${instructorId},recipient_id.eq.${instructorId}`)
      .eq("status", "accepted");

    if (!friendships || friendships.length === 0) {
      return new Response(
        JSON.stringify({
          friends: [],
          myPosition: { lat: myDevice.last_latitude, lng: myDevice.last_longitude },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const friendIds = friendships.map((f) =>
      f.requester_id === instructorId ? f.recipient_id : f.requester_id
    );

    // Get friend details + GPS in one go
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const { data: friendDevices } = await supabase
      .from("gps_devices")
      .select("instructor_id, last_latitude, last_longitude, last_heading, last_speed_kmh, last_seen_at")
      .in("instructor_id", friendIds)
      .eq("is_active", true)
      .not("last_latitude", "is", null)
      .gte("last_seen_at", thirtyMinsAgo);

    const { data: instructors } = await supabase
      .from("instructors")
      .select("id, name, profile_image_url")
      .in("id", friendIds);

    const instructorMap = new Map(
      (instructors || []).map((i) => [i.id, i])
    );

    const friends = (friendDevices || []).map((d) => {
      const inst = instructorMap.get(d.instructor_id);
      return {
        id: d.instructor_id,
        name: inst?.name || "Unknown",
        profileImageUrl: inst?.profile_image_url || null,
        lat: d.last_latitude,
        lng: d.last_longitude,
        heading: d.last_heading,
        speedKmh: d.last_speed_kmh,
        lastSeenAt: d.last_seen_at,
        distanceKm: haversineKm(
          myDevice.last_latitude,
          myDevice.last_longitude,
          d.last_latitude!,
          d.last_longitude!
        ),
      };
    });

    friends.sort((a, b) => a.distanceKm - b.distanceKm);

    return new Response(
      JSON.stringify({
        friends,
        myPosition: { lat: myDevice.last_latitude, lng: myDevice.last_longitude },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
