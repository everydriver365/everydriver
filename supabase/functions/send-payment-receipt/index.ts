import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendBrandedEmail } from "../_shared/send-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentReceiptRequest {
  pupilId: string;
  instructorId: string;
  amount: number;
  paymentMethod: string;
  transactionReference: string;
  receiptUrl?: string;
  type?: "payment" | "refund";
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { pupilId, instructorId, amount, paymentMethod, transactionReference, receiptUrl, type }: PaymentReceiptRequest = await req.json();
    const isRefund = type === "refund";

    if (!pupilId || !instructorId || !amount) {
      return new Response(JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: pupil } = await supabase
      .from("pupils").select("name, email, account_balance").eq("id", pupilId).single();
    if (!pupil) {
      return new Response(JSON.stringify({ error: "Pupil not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!pupil.email) {
      return new Response(JSON.stringify({ success: true, skipped: true, reason: "No email address" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: instructor } = await supabase
      .from("instructors").select("name, email, phone").eq("id", instructorId).single();
    if (!instructor) {
      return new Response(JSON.stringify({ error: "Instructor not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const paymentDate = new Date().toLocaleDateString("en-GB",
      { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const paymentTime = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    const newBalance = pupil.account_balance || 0;

    const directionWord = isRefund ? "to" : "from";
    const subjectLine = `${isRefund ? "Refund" : "Payment"} Receipt — £${Math.abs(amount).toFixed(2)} ${directionWord} ${pupil.name}`;

    const result = await sendBrandedEmail({
      to: pupil.email,
      subject: subjectLine,
      heading: isRefund ? "Refund receipt" : "Payment receipt",
      intro: `Hi ${pupil.name}, ${isRefund ? "we've processed a refund on your account." : "thanks for your payment."} Here's your receipt for your records.`,
      details: [
        { label: isRefund ? "Amount refunded" : "Amount paid", value: `${isRefund ? "−" : ""}£${Math.abs(amount).toFixed(2)}` },
        { label: "Date", value: paymentDate },
        { label: "Time", value: paymentTime },
        { label: "Payment method", value: paymentMethod },
        { label: "Reference", value: transactionReference },
        { label: "New balance", value: newBalance >= 0 ? `£${newBalance.toFixed(2)} credit` : `-£${Math.abs(newBalance).toFixed(2)} owed` },
        { label: "Instructor", value: instructor.name || "—" },
        ...(instructor.email ? [{ label: "Instructor email", value: instructor.email }] : []),
        ...(instructor.phone ? [{ label: "Instructor phone", value: instructor.phone }] : []),
      ],
      ctaLabel: receiptUrl ? "View full receipt" : null,
      ctaUrl: receiptUrl ?? null,
      footerNote: "This is an automated receipt for your records. Please keep this email as proof of payment.",
      idempotencyKey: `receipt-${transactionReference}`,
    }, supabase);

    return new Response(JSON.stringify({ success: result.enqueued > 0, result }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    console.error("Error sending payment receipt:", error);
    return new Response(JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
