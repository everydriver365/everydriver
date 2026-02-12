import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function authenticateGeotab() {
  const database = Deno.env.get("GEOTAB_DATABASE");
  const username = Deno.env.get("GEOTAB_USERNAME");
  const password = Deno.env.get("GEOTAB_PASSWORD");

  if (!database || !username || !password) {
    throw new Error("Geotab credentials not configured");
  }

  const res = await fetch("https://my.geotab.com/apiv1", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      method: "Authenticate",
      params: { database, userName: username, password },
    }),
  });

  const data = await res.json();
  if (data.error) throw new Error(`Geotab auth failed: ${data.error.message}`);

  const { credentials, path } = data.result;
  return {
    sessionId: credentials.sessionId,
    serverUrl: `https://${path}/apiv1`,
    database,
    userName: username,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify the requesting user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the instructor ID for this user
    const { data: instructor } = await supabase
      .from("instructors")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    const url = new URL(req.url);
    const mediaId = url.searchParams.get("mediaId");

    if (!mediaId) {
      return new Response(JSON.stringify({ error: "mediaId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the media belongs to this instructor
    const { data: media } = await supabase
      .from("dashcam_media")
      .select("*")
      .eq("id", mediaId)
      .maybeSingle();

    if (!media) {
      return new Response(JSON.stringify({ error: "Media not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (instructor && media.instructor_id !== instructor.id) {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Authenticate with Geotab and download the media file
    const session = await authenticateGeotab();

    const downloadRes = await fetch(session.serverUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        method: "Get",
        params: {
          typeName: "MediaFile",
          search: { id: media.geotab_media_file_id },
          credentials: {
            sessionId: session.sessionId,
            database: session.database,
            userName: session.userName,
          },
        },
      }),
    });

    const downloadData = await downloadRes.json();
    if (downloadData.error) {
      throw new Error(`Download failed: ${downloadData.error.message}`);
    }

    const mediaFile = downloadData.result?.[0];
    if (!mediaFile) {
      return new Response(JSON.stringify({ error: "Media file not found in Geotab" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If the media file has a downloadUrl, redirect to it
    if (mediaFile.downloadUrl) {
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          Location: mediaFile.downloadUrl,
        },
      });
    }

    // If we have binary data, stream it back
    if (mediaFile.data) {
      const binaryData = Uint8Array.from(atob(mediaFile.data), (c) => c.charCodeAt(0));
      const contentType = media.media_type === "video" ? "video/mp4" : "image/jpeg";

      return new Response(binaryData, {
        headers: {
          ...corsHeaders,
          "Content-Type": contentType,
          "Content-Disposition": `inline; filename="${media.file_name || "dashcam-clip"}"`,
        },
      });
    }

    // Construct a direct download URL as fallback
    const directUrl = `${session.serverUrl.replace("/apiv1", "")}/apiv1/DownloadMediaFile?` +
      `database=${session.database}&sessionId=${session.sessionId}&mediaFileId=${media.geotab_media_file_id}`;

    return new Response(JSON.stringify({ downloadUrl: directUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("geotab-media-download error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
