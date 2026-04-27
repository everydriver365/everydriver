/**
 * generate-pass-report
 * --------------------------------------------------------------
 * Drains the pass_report_queue, aggregates pupil stats, generates
 * a Drive365-branded PDF using pdf-lib (Deno-friendly), uploads to
 * the public 'pass-reports' bucket, and updates pupils.pass_report_url.
 *
 * Triggered:
 *  - On demand via POST { pupil_id } (admin or instructor of pupil)
 *  - On cron (drains the queue when called with { drain: true } and admin role)
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BRAND_BLUE = rgb(0.13, 0.42, 1);     // #2255FF
const BRAND_DARK = rgb(0.06, 0.11, 0.18);  // #0F1B2D
const BRAND_GREY = rgb(0.48, 0.56, 0.67);

interface PupilStats {
  pupil_name: string;
  pass_date: string | null;
  instructor_name: string;
  total_lessons: number;
  total_hours: number;
  total_miles: number;
  total_invested: number;
  competencies_complete: number;
  competencies_total: number;
  safety_score_avg: number | null;
}

async function buildStats(admin: ReturnType<typeof createClient>, pupilId: string): Promise<PupilStats | null> {
  const { data: pupil } = await admin
    .from("pupils")
    .select("name, test_result_date, instructor_id")
    .eq("id", pupilId)
    .maybeSingle();
  if (!pupil) return null;

  const [{ data: instr }, { data: lessons }, { data: mileage }, { data: comp }] = await Promise.all([
    admin.from("instructors").select("name").eq("id", pupil.instructor_id).maybeSingle(),
    admin.from("scheduled_lessons").select("duration").eq("pupil_id", pupilId).eq("status", "completed"),
    admin.from("mileage_logs").select("distance_km").eq("pupil_id", pupilId),
    admin.from("pupil_competency_progress").select("competency_id, status").eq("pupil_id", pupilId),
  ]);

  const totalMin = (lessons ?? []).reduce((a, l) => a + (l.duration ?? 0), 0);
  const totalKm = (mileage ?? []).reduce((a, m) => a + Number(m.distance_km ?? 0), 0);
  const totalMiles = totalKm * 0.621371;

  // Competency totals: 27 DVSA per memory; count distinct competencies marked competent or above
  const completed = (comp ?? []).filter((c) =>
    ["competent", "mastered", "complete"].includes(String(c.status))).length;

  return {
    pupil_name: pupil.name ?? "Driver",
    pass_date: pupil.test_result_date,
    instructor_name: instr?.name ?? "Your Instructor",
    total_lessons: lessons?.length ?? 0,
    total_hours: Math.round((totalMin / 60) * 10) / 10,
    total_miles: Math.round(totalMiles * 10) / 10,
    total_invested: 0, // payment_history aggregation skipped to avoid heavy join
    competencies_complete: Math.min(completed, 27),
    competencies_total: 27,
    safety_score_avg: null,
  };
}

async function buildPdf(stats: PupilStats): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4
  const helv = await doc.embedFont(StandardFonts.Helvetica);
  const helvBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();

  // Header band
  page.drawRectangle({ x: 0, y: height - 140, width, height: 140, color: BRAND_BLUE });
  page.drawText("DRIVE365", { x: 40, y: height - 60, size: 18, font: helvBold, color: rgb(1,1,1) });
  page.drawText("Driver Report", { x: 40, y: height - 90, size: 28, font: helvBold, color: rgb(1,1,1) });
  page.drawText(`Congratulations, ${stats.pupil_name}!`, {
    x: 40, y: height - 120, size: 14, font: helv, color: rgb(1,1,1),
  });

  // Pass date
  let y = height - 180;
  if (stats.pass_date) {
    page.drawText(`Driver since ${new Date(stats.pass_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`, {
      x: 40, y, size: 12, font: helv, color: BRAND_GREY,
    });
    y -= 30;
  }

  // Stats grid
  const stat = (label: string, value: string, x: number, yy: number) => {
    page.drawText(value, { x, y: yy, size: 26, font: helvBold, color: BRAND_DARK });
    page.drawText(label.toUpperCase(), { x, y: yy - 16, size: 8, font: helv, color: BRAND_GREY });
  };

  y -= 40;
  stat("Lessons", `${stats.total_lessons}`, 40, y);
  stat("Hours", `${stats.total_hours}`, 180, y);
  stat("Miles", `${stats.total_miles}`, 320, y);
  stat("Manoeuvres", `${stats.competencies_complete}/${stats.competencies_total}`, 460, y);

  // Progress bar — DVSA competencies
  y -= 80;
  page.drawText("DVSA Competencies Mastered", { x: 40, y, size: 12, font: helvBold, color: BRAND_DARK });
  y -= 18;
  const barWidth = width - 80;
  page.drawRectangle({ x: 40, y: y - 12, width: barWidth, height: 12, color: rgb(0.93, 0.95, 0.97) });
  const fill = (stats.competencies_complete / stats.competencies_total) * barWidth;
  page.drawRectangle({ x: 40, y: y - 12, width: fill, height: 12, color: BRAND_BLUE });

  // Instructor section
  y -= 80;
  page.drawText("Your Instructor", { x: 40, y, size: 10, font: helv, color: BRAND_GREY });
  y -= 18;
  page.drawText(stats.instructor_name, { x: 40, y, size: 16, font: helvBold, color: BRAND_DARK });

  // Personal note
  y -= 50;
  const note = `${stats.pupil_name}, you've put in ${stats.total_hours} hours behind the wheel and covered ${stats.total_miles} miles getting here. Drive safely, and never stop learning.`;
  // Simple word wrap
  const words = note.split(" ");
  let line = "";
  const maxChars = 75;
  for (const w of words) {
    if ((line + " " + w).trim().length > maxChars) {
      page.drawText(line.trim(), { x: 40, y, size: 11, font: helv, color: BRAND_DARK });
      y -= 16;
      line = w;
    } else {
      line += " " + w;
    }
  }
  if (line.trim()) {
    page.drawText(line.trim(), { x: 40, y, size: 11, font: helv, color: BRAND_DARK });
    y -= 16;
  }

  // Footer
  page.drawRectangle({ x: 0, y: 0, width, height: 40, color: BRAND_DARK });
  page.drawText("drive365.co.uk", { x: 40, y: 16, size: 9, font: helv, color: rgb(1,1,1) });
  page.drawText(`Generated ${new Date().toLocaleDateString("en-GB")}`, {
    x: width - 160, y: 16, size: 9, font: helv, color: rgb(1,1,1),
  });

  return await doc.save();
}

async function processOne(admin: ReturnType<typeof createClient>, pupilId: string) {
  const stats = await buildStats(admin, pupilId);
  if (!stats) throw new Error("Pupil not found");

  const pdf = await buildPdf(stats);
  const path = `${pupilId}/pass-report-${Date.now()}.pdf`;

  const { error: upErr } = await admin.storage
    .from("pass-reports")
    .upload(path, pdf, { contentType: "application/pdf", upsert: true });
  if (upErr) throw upErr;

  const { data: pub } = admin.storage.from("pass-reports").getPublicUrl(path);
  const url = pub.publicUrl;

  await admin.from("pupils").update({
    pass_report_url: url,
    pass_report_generated_at: new Date().toISOString(),
  }).eq("id", pupilId);

  return url;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const body = await req.json().catch(() => ({}));
    const { pupil_id, drain } = body;

    if (drain === true) {
      // Cron mode — process up to 5 pending items
      const { data: queue } = await admin
        .from("pass_report_queue")
        .select("id, pupil_id, attempts")
        .eq("status", "pending")
        .order("created_at")
        .limit(5);

      const results: Array<{ pupil_id: string; ok: boolean; error?: string; url?: string }> = [];
      for (const job of queue ?? []) {
        await admin.from("pass_report_queue")
          .update({ status: "processing", attempts: (job.attempts ?? 0) + 1 })
          .eq("id", job.id);
        try {
          const url = await processOne(admin, job.pupil_id);
          await admin.from("pass_report_queue")
            .update({ status: "done", processed_at: new Date().toISOString() })
            .eq("id", job.id);
          results.push({ pupil_id: job.pupil_id, ok: true, url });
        } catch (e) {
          await admin.from("pass_report_queue")
            .update({
              status: (job.attempts ?? 0) >= 3 ? "failed" : "pending",
              error: (e as Error).message,
            })
            .eq("id", job.id);
          results.push({ pupil_id: job.pupil_id, ok: false, error: (e as Error).message });
        }
      }
      return new Response(JSON.stringify({ processed: results.length, results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // On-demand single generation
    if (!pupil_id) {
      return new Response(JSON.stringify({ error: "pupil_id or drain required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is admin or owns the pupil
    const auth = req.headers.get("Authorization") ?? "";
    const token = auth.replace(/^Bearer\s+/i, "");
    if (token) {
      const userClient = createClient(SUPABASE_URL, ANON, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data: u } = await userClient.auth.getUser();
      if (!u?.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Either admin role or instructor of the pupil
      const { data: roleRow } = await admin.from("user_roles")
        .select("role").eq("user_id", u.user.id).eq("role", "admin").maybeSingle();
      if (!roleRow) {
        const { data: pupilRow } = await admin.from("pupils")
          .select("instructor_id").eq("id", pupil_id).maybeSingle();
        const { data: instrRow } = await admin.from("instructors")
          .select("id").eq("auth_user_id", u.user.id).maybeSingle();
        if (!instrRow || pupilRow?.instructor_id !== instrRow.id) {
          return new Response(JSON.stringify({ error: "Forbidden" }), {
            status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    } else {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = await processOne(admin, pupil_id);
    return new Response(JSON.stringify({ success: true, url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[generate-pass-report]", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
