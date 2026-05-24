import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // JWT-based identity (parents are now real Supabase users).
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: userResp, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userResp?.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const user = userResp.user;

    const body = await req.json().catch(() => null) as { pupil_id?: string } | null;
    const pupilId = body?.pupil_id?.toString().trim();
    if (!pupilId) {
      return new Response(
        JSON.stringify({ error: "pupil_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Resolve parents.id for this auth user.
    const { data: parentRow } = await supabaseAdmin
      .from("parents")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (!parentRow) {
      return new Response(
        JSON.stringify({ error: "Parent profile not found" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Confirm pupil belongs to this parent.
    const { data: pupil } = await supabaseAdmin
      .from("pupils")
      .select("id, parent_user_id, parent_portal_enabled")
      .eq("id", pupilId)
      .maybeSingle();

    if (
      !pupil ||
      pupil.parent_portal_enabled === false ||
      (pupil as any).parent_user_id !== parentRow.id
    ) {
      return new Response(
        JSON.stringify({ error: "Pupil not linked to this parent." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Fetch syllabus data.
    const [progressRes, updatesRes] = await Promise.all([
      supabaseAdmin
        .from("pupil_syllabus_progress")
        .select("competency_id, level, instructor_notes, last_practiced, updated_at")
        .eq("pupil_id", pupilId),
      supabaseAdmin
        .from("lesson_syllabus_updates")
        .select("id, lesson_history_id, competency_id, previous_level, new_level, comment, created_at")
        .eq("pupil_id", pupilId)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    const progress = progressRes.data || [];
    const updates = updatesRes.data || [];

    const TOTAL_COMPETENCIES = 27;
    const earned = progress.reduce((s: number, p: any) => s + (p.level || 0), 0);
    const readiness = Math.round((earned / (TOTAL_COMPETENCIES * 5)) * 100);

    return new Response(
      JSON.stringify({ progress, updates, readiness }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("parent-get-syllabus error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
