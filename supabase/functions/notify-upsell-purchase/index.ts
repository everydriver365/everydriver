import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { sendBrandedEmail } from "../_shared/send-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UpsellNotificationRequest {
  pupilName: string; pupilEmail: string; pupilPhone: string;
  upsellName: string; upsellPrice: number;
  instructorId: string; pupilId: string; firstLessonDate?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const data: UpsellNotificationRequest = await req.json();
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: instructor } = await supabase
      .from("instructors").select("name, email").eq("id", data.instructorId).single();
    const instructorName = instructor?.name || "Unknown Instructor";
    const teamEmail = "team@everydriver.co.uk";

    const formatDate = (dateStr?: string) => {
      if (!dateStr) return "Not scheduled yet";
      return new Date(dateStr).toLocaleDateString("en-GB",
        { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    };

    const actionMsg = data.upsellName.toLowerCase().includes("earlier test")
      ? "Please begin monitoring DVSA for cancellations and earlier test date availability for this pupil."
      : "Please review this purchase and take any necessary action.";

    const result = await sendBrandedEmail({
      to: teamEmail,
      subject: `🎯 New Upsell Purchase: ${data.upsellName} - ${data.pupilName}`,
      heading: "🎯 New upsell purchase",
      intro: `${data.upsellName} — purchased by ${data.pupilName}.`,
      paragraphs: [`Action required: ${actionMsg}`],
      details: [
        { label: "Upsell", value: data.upsellName },
        { label: "Amount paid", value: `£${data.upsellPrice.toFixed(2)}` },
        { label: "Pupil", value: data.pupilName },
        { label: "Email", value: data.pupilEmail },
        { label: "Phone", value: data.pupilPhone },
        { label: "Instructor", value: instructorName },
        { label: "First lesson", value: formatDate(data.firstLessonDate) },
      ],
      idempotencyKey: `upsell-${data.pupilId}-${data.upsellName}`.replace(/\s+/g, "-"),
    }, supabase);

    return new Response(JSON.stringify({ success: true, result }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
});
