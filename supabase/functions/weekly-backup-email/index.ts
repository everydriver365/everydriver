import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendBrandedEmail } from "../_shared/send-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InstructorData {
  id: string;
  name: string;
  email: string;
}

async function generateBackupStats(supabase: any, instructorId: string) {
  const [pupilsRes, lessonsRes, scheduleRes, paymentsRes, expensesRes] = await Promise.all([
    supabase.from("pupils").select("id, test_passed").eq("instructor_id", instructorId).is("deleted_at", null),
    supabase.from("lesson_history").select("id").eq("instructor_id", instructorId).is("deleted_at", null),
    supabase.from("scheduled_lessons").select("id").eq("instructor_id", instructorId).is("deleted_at", null),
    supabase.from("payment_history").select("amount").eq("instructor_id", instructorId).is("deleted_at", null),
    supabase.from("instructor_expenses").select("amount").eq("instructor_id", instructorId).is("deleted_at", null),
  ]);

  const pupils = pupilsRes.data || [];
  const lessons = lessonsRes.data || [];
  const schedule = scheduleRes.data || [];
  const payments = paymentsRes.data || [];
  const expenses = expensesRes.data || [];

  const totalRevenue = payments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
  const totalExpenses = expenses.reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0);
  const activePupils = pupils.filter((p: any) => !p.test_passed).length;
  const passedPupils = pupils.filter((p: any) => p.test_passed).length;

  return {
    totalPupils: pupils.length,
    activePupils,
    passedPupils,
    totalLessons: lessons.length,
    scheduledLessons: schedule.length,
    totalRevenue,
    totalExpenses,
    netProfit: totalRevenue - totalExpenses,
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: instructors, error: instructorsError } = await supabase
      .from("instructors")
      .select("id, name, email")
      .eq("is_active", true)
      .not("email", "is", null);

    if (instructorsError) throw instructorsError;

    const results: { instructor: string; success: boolean; error?: string }[] = [];
    const backupDate = new Date().toLocaleDateString("en-GB", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
    const dateKey = new Date().toISOString().slice(0, 10);

    for (const instructor of (instructors || []) as InstructorData[]) {
      if (!instructor.email) continue;

      try {
        const stats = await generateBackupStats(supabase, instructor.id);

        const result = await sendBrandedEmail({
          to: instructor.email,
          subject: `Your weekly data summary — ${backupDate}`,
          heading: "Weekly data summary",
          preview: `Stats for ${backupDate}`,
          intro: `Hello ${instructor.name},`,
          paragraphs: [
            `Here's your weekly data summary for ${backupDate}.`,
            "To download a full backup with CSV files, use the in-app data export.",
          ],
          details: [
            { label: "Total pupils", value: String(stats.totalPupils) },
            { label: "Active learners", value: String(stats.activePupils) },
            { label: "Passed pupils", value: String(stats.passedPupils) },
            { label: "Lessons completed", value: String(stats.totalLessons) },
            { label: "Scheduled lessons", value: String(stats.scheduledLessons) },
            { label: "Total revenue", value: `£${stats.totalRevenue.toFixed(2)}` },
            { label: "Total expenses", value: `£${stats.totalExpenses.toFixed(2)}` },
            { label: "Net profit", value: `£${stats.netProfit.toFixed(2)}` },
          ],
          ctaLabel: "Download full backup",
          ctaUrl: "https://everydriver.co/instructor/settings/data-export",
          footerNote: "Automated summary from EveryDriver.",
          idempotencyKey: `weekly-backup-${instructor.id}-${dateKey}`,
        }, supabase);

        results.push({ instructor: instructor.name, success: result.enqueued > 0, error: result.errors[0] });
      } catch (error: any) {
        console.error(`Failed to send backup to ${instructor.email}:`, error);
        results.push({ instructor: instructor.name, success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;

    return new Response(
      JSON.stringify({
        message: `Weekly backup complete. ${successCount}/${results.length} emails sent.`,
        results,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in weekly backup function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
