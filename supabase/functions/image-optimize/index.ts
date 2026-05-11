// Image optimisation: resize + convert to WebP, upload to instructor-images bucket.
// Used by the website editor when an instructor uploads a hero/OG image.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { ImageMagick, initializeImageMagick, MagickFormat } from "https://deno.land/x/imagemagick_deno@0.0.31/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

let magickReady: Promise<void> | null = null;
async function ensureMagick() {
  if (!magickReady) {
    magickReady = initializeImageMagick(
      new URL("https://deno.land/x/imagemagick_deno@0.0.31/wasm/magick.wasm"),
    );
  }
  await magickReady;
}

const PRESETS: Record<string, { w: number; h?: number; quality: number }> = {
  hero: { w: 1600, quality: 82 },
  og: { w: 1200, h: 630, quality: 85 },
  thumb: { w: 600, quality: 80 },
  logo: { w: 600, quality: 90 },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const preset = (url.searchParams.get("preset") || "hero").toLowerCase();
    const folder = (url.searchParams.get("folder") || "uploads").replace(/[^a-z0-9/_-]/gi, "");
    const filenameParam = url.searchParams.get("filename") || `image-${Date.now()}`;
    const cfg = PRESETS[preset] || PRESETS.hero;

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseService = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userResp } = await userClient.auth.getUser();
    if (!userResp?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const buf = new Uint8Array(await req.arrayBuffer());
    if (!buf.byteLength || buf.byteLength > 15 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: "Invalid file size (max 15MB)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await ensureMagick();
    const out = await new Promise<Uint8Array>((resolve) => {
      ImageMagick.read(buf, (img) => {
        if (cfg.h) {
          img.resize({ width: cfg.w, height: cfg.h });
        } else {
          img.resize({ width: cfg.w, height: 0 });
        }
        img.quality = cfg.quality;
        img.write(MagickFormat.Webp, (data) => resolve(new Uint8Array(data)));
      });
    });

    const safeName = filenameParam.replace(/[^a-z0-9._-]/gi, "_").replace(/\.[^.]+$/, "");
    const path = `${folder}/${userResp.user.id}/${Date.now()}-${safeName}.webp`;

    const admin = createClient(supabaseUrl, supabaseService);
    const { error: uploadErr } = await admin.storage
      .from("instructor-images")
      .upload(path, out, {
        contentType: "image/webp",
        cacheControl: "31536000",
        upsert: false,
      });

    if (uploadErr) {
      return new Response(JSON.stringify({ error: uploadErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: pub } = admin.storage.from("instructor-images").getPublicUrl(path);

    return new Response(
      JSON.stringify({
        url: pub.publicUrl,
        path,
        bytes: out.byteLength,
        preset,
        format: "webp",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[image-optimize] error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
