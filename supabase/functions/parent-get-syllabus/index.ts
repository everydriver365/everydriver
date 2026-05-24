import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function cleanPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\s+/g, "").replace(/[^0-9+]/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "+44" + cleaned.substring(1);
  } else if (!cleaned.startsWith("+")) {
    cleaned = "+44" + cleaned;
  }
  return cleaned;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => null) as
      | { parent_phone?: string; pupil_id?: string }
      | null;
    const parentPhoneRaw = body?.parent_phone?.toString().trim();
    const pupilId = body?.pupil_id?.toString().trim();

    if (!parentPhoneRaw || !pupilId) {
      return new Response(
        JSON.stringify({ error: "parent_phone and pupil_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const cleanPhone = cleanPhoneNumber(parentPhoneRaw);
    const phoneWithoutCountry = cleanPhone.replace(/^\+44/, "0");

    // Verify the parent has a verified OTP on file (most recent, not expired)
    const { data: otp } = await supabase
      .from("parent_otp_codes")
      .select("verified, expires_at")
      .eq("phone", cleanPhone)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!otp || !otp.verified) {
      return new Response(
        JSON.stringify({ error: "Unauthorized — verify your phone again." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Confirm pupil belongs to this parent
    const { data: pupil } = await supabase
      .from("pupils")
      .select("id, parent_phone, parent_portal_enabled")
      .eq("id", pupilId)
      .maybeSingle();

    if (
      !pupil ||
      pupil.parent_portal_enabled === false ||
      (pupil.parent_phone !== cleanPhone && pupil.parent_phone !== phoneWithoutCountry)
    ) {
      return new Response(
        JSON.stringify({ error: "Pupil not linked to this parent." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Fetch syllabus data
    const [progressRes, updatesRes] = await Promise.all([
      supabase
        .from("pupil_syllabus_progress")
        .select("competency_id, level, instructor_notes, last_practiced, updated_at")
        .eq("pupil_id", pupilId),
      supabase
        .from("lesson_syllabus_updates")
        .select("id, lesson_history_id, competency_id, previous_level, new_level, comment, created_at")
        .eq("pupil_id", pupilId)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    const progress = progressRes.data || [];
    const updates = updatesRes.data || [];

    // Readiness: % of (sum of levels) / (27 competencies * 5)
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
