import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { format } from "https://esm.sh/date-fns@3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { instructor_id, date } = await req.json();
    if (!instructor_id) throw new Error("instructor_id required");

    const targetDate = date || format(new Date(), "yyyy-MM-dd");

    // Get instructor info
    const { data: instructor } = await supabase
      .from("instructors")
      .select("name, phone, hourly_rate")
      .eq("id", instructor_id)
      .maybeSingle();

    // Get lessons for the day with pupil details
    const { data: lessons, error } = await supabase
      .from("scheduled_lessons")
      .select(`
        id, start_time, duration_minutes, status, lesson_type, notes,
        pupils!inner(name, phone, email, pickup_address, postcode, account_balance)
      `)
      .eq("instructor_id", instructor_id)
      .eq("lesson_date", targetDate)
      .neq("status", "cancelled")
      .order("start_time", { ascending: true });

    if (error) throw error;

    // Get payment history for the day to determine payment method breakdown
    const { data: payments } = await supabase
      .from("payment_history")
      .select("amount, payment_method")
      .eq("instructor_id", instructor_id)
      .gte("payment_date", targetDate)
      .lt("payment_date", targetDate + "T23:59:59");

    const cashTotal = (payments || []).filter(p => p.payment_method?.toLowerCase() === "cash").reduce((s, p) => s + (p.amount || 0), 0);
    const cardTotal = (payments || []).filter(p => p.payment_method?.toLowerCase() !== "cash").reduce((s, p) => s + (p.amount || 0), 0);

    const manifest = {
      date: targetDate,
      instructor: instructor?.name || "Unknown",
      totalLessons: lessons?.length || 0,
      lessons: (lessons || []).map((l, i) => ({
        order: i + 1,
        time: l.start_time,
        duration: l.duration_minutes || 60,
        pupilName: l.pupils?.name || "Unknown",
        phone: l.pupils?.phone || "",
        email: l.pupils?.email || "",
        pickupAddress: l.pupils?.pickup_address || "",
        postcode: l.pupils?.postcode || "",
        lessonType: l.lesson_type || "standard",
        status: l.status,
        balance: l.pupils?.account_balance || 0,
        notes: l.notes || "",
      })),
      summary: {
        totalHours: (lessons || []).reduce((s, l) => s + (l.duration_minutes || 60), 0) / 60,
        completed: (lessons || []).filter(l => l.status === "completed").length,
        upcoming: (lessons || []).filter(l => l.status === "scheduled").length,
        cashTotal,
        cardTotal,
        estimatedEarnings: Math.round(((lessons || []).reduce((s, l) => s + (l.duration_minutes || 60), 0) / 60) * (instructor?.hourly_rate || 35)),
      },
    };

    return new Response(JSON.stringify(manifest), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Daily manifest error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
