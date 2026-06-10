// Auto-invoice generation edge function.
// Modes:
//   { instructorId, pupilId, periodDays? }  -> single pupil
//   { mode: "cron" }                        -> bulk across all instructors with feature enabled
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function admin() {
  return createClient(SUPABASE_URL, SERVICE_KEY);
}

function pad4(n: number) {
  return n.toString().padStart(4, "0");
}

async function nextInvoiceNumber(supabase: ReturnType<typeof admin>, instructorId: string) {
  const year = new Date().getUTCFullYear();
  const prefix = `INV-${year}-`;
  const { data } = await supabase
    .from("invoices")
    .select("invoice_number")
    .eq("instructor_id", instructorId)
    .like("invoice_number", `${prefix}%`)
    .order("invoice_number", { ascending: false })
    .limit(1);
  let seq = 1;
  if (data && data.length) {
    const last = data[0].invoice_number as string;
    const tail = parseInt(last.slice(prefix.length), 10);
    if (!isNaN(tail)) seq = tail + 1;
  }
  return `${prefix}${pad4(seq)}`;
}

async function processOne(
  supabase: ReturnType<typeof admin>,
  instructorId: string,
  pupilId: string,
  periodDays = 7,
) {
  // Verify feature flag + load instructor profile
  const { data: instructor, error: instErr } = await supabase
    .from("instructors")
    .select("id, name, business_name, email, ai_auto_invoices_enabled, invoice_business_address, invoice_vat_number")
    .eq("id", instructorId)
    .maybeSingle();
  if (instErr) throw instErr;
  if (!instructor) return { skipped: true, reason: "instructor_not_found" };
  if (!instructor.ai_auto_invoices_enabled) {
    return { status: 403, skipped: true, reason: "feature_disabled" };
  }

  const { data: pupil } = await supabase
    .from("pupils")
    .select("id, name, email")
    .eq("id", pupilId)
    .maybeSingle();
  if (!pupil) return { skipped: true, reason: "pupil_not_found" };

  // Find completed lessons in window not already invoiced
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - periodDays);
  const sinceStr = since.toISOString().slice(0, 10);

  const { data: lessons, error: lessonsErr } = await supabase
    .from("scheduled_lessons")
    .select("id, lesson_date, start_time, duration_minutes, amount_due, price_per_hour, status")
    .eq("instructor_id", instructorId)
    .eq("pupil_id", pupilId)
    .gte("lesson_date", sinceStr)
    .in("status", ["completed", "confirmed"])
    .is("deleted_at", null);
  if (lessonsErr) throw lessonsErr;

  // Filter out lessons already on an invoice (scan instructor's invoices)
  const { data: existing } = await supabase
    .from("invoices")
    .select("items")
    .eq("instructor_id", instructorId)
    .eq("pupil_id", pupilId);
  const invoicedIds = new Set<string>();
  for (const inv of existing || []) {
    const items = (inv as any).items as any[] | null;
    if (Array.isArray(items)) {
      for (const li of items) if (li?.lesson_id) invoicedIds.add(li.lesson_id);
    }
  }

  const fresh = (lessons || []).filter((l) => !invoicedIds.has(l.id) && Number(l.amount_due ?? 0) > 0);
  if (fresh.length === 0) {
    return { skipped: true, reason: "no uninvoiced lessons" };
  }

  const lineItems = fresh.map((l) => ({
    lesson_id: l.id,
    date: l.lesson_date,
    duration_mins: l.duration_minutes,
    rate: Number(l.price_per_hour ?? 0),
    amount: Number(l.amount_due ?? 0),
  }));
  const total = lineItems.reduce((s, li) => s + Number(li.amount || 0), 0);

  const invoiceNumber = await nextInvoiceNumber(supabase, instructorId);
  const today = new Date().toISOString().slice(0, 10);

  const { data: invoiceRow, error: insertErr } = await supabase
    .from("invoices")
    .insert({
      instructor_id: instructorId,
      pupil_id: pupilId,
      invoice_number: invoiceNumber,
      invoice_date: today,
      due_date: today,
      status: "paid",
      items: lineItems,
      subtotal: total,
      total,
      currency: "GBP",
      auto_generated: true,
      source: "auto_invoice",
      paid_at: new Date().toISOString(),
      instructor_details: {
        name: instructor.business_name || instructor.name,
        address: instructor.invoice_business_address,
        vat_number: instructor.invoice_vat_number,
        email: instructor.email,
      },
      pupil_details: { name: pupil.name, email: pupil.email },
    })
    .select()
    .single();
  if (insertErr) throw insertErr;

  // Generate PDF
  let pdfUrl: string | null = null;
  try {
    const pdfRes = await fetch(`${SUPABASE_URL}/functions/v1/generate-pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE_KEY}` },
      body: JSON.stringify({
        report_type: "invoice",
        instructor_id: instructorId,
        data: {
          invoice_number: invoiceNumber,
          issue_date: today,
          instructor: {
            name: instructor.business_name || instructor.name,
            address: instructor.invoice_business_address,
            vat_number: instructor.invoice_vat_number,
            email: instructor.email,
          },
          pupil: { name: pupil.name, email: pupil.email },
          line_items: lineItems,
          total,
          currency: "GBP",
        },
      }),
    });
    const pdfJson = await pdfRes.json();
    if (pdfJson?.pdf_base64) {
      const bytes = Uint8Array.from(atob(pdfJson.pdf_base64), (c) => c.charCodeAt(0));
      const path = `${instructorId}/${invoiceNumber}.pdf`;
      const { error: upErr } = await supabase.storage
        .from("invoice-pdfs")
        .upload(path, bytes, { contentType: "application/pdf", upsert: true });
      if (!upErr) {
        pdfUrl = path;
        await supabase.from("invoices").update({ pdf_url: path }).eq("id", invoiceRow.id);
      } else {
        console.error("upload error", upErr);
      }
    }
  } catch (e) {
    console.error("PDF generation failed", e);
  }

  // Email pupil
  if (pupil.email) {
    try {
      let downloadUrl: string | null = null;
      if (pdfUrl) {
        const { data: signed } = await supabase.storage
          .from("invoice-pdfs")
          .createSignedUrl(pdfUrl, 60 * 60 * 24 * 30);
        downloadUrl = signed?.signedUrl ?? null;
      }
      await fetch(`${SUPABASE_URL}/functions/v1/send-transactional-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE_KEY}` },
        body: JSON.stringify({
          templateName: "auto-invoice",
          recipientEmail: pupil.email,
          idempotencyKey: `auto-invoice-${invoiceRow.id}`,
          templateData: {
            pupilName: pupil.name,
            invoiceNumber,
            totalAmount: total.toFixed(2),
            issueDate: today,
            downloadUrl,
            instructorName: instructor.business_name || instructor.name,
          },
        }),
      });
    } catch (e) {
      console.error("email send failed", e);
    }
  }

  return { ok: true, invoiceId: invoiceRow.id, invoiceNumber, total, lessons: fresh.length };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = admin();
    const body = await req.json().catch(() => ({}));

    if (body?.mode === "cron") {
      const { data: instructors } = await supabase
        .from("instructors")
        .select("id")
        .eq("ai_auto_invoices_enabled", true)
        .eq("is_network_placeholder", false);

      const results: any[] = [];
      for (const inst of instructors || []) {
        const { data: pupils } = await supabase
          .from("pupils")
          .select("id")
          .eq("instructor_id", inst.id);
        for (const p of pupils || []) {
          try {
            const r = await processOne(supabase, inst.id, p.id, 7);
            results.push({ instructorId: inst.id, pupilId: p.id, ...r });
          } catch (e) {
            results.push({ instructorId: inst.id, pupilId: p.id, error: String(e) });
          }
        }
      }
      return new Response(JSON.stringify({ ok: true, processed: results.length, results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { instructorId, pupilId, periodDays } = body || {};
    if (!instructorId || !pupilId) {
      return new Response(JSON.stringify({ error: "instructorId and pupilId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const result = await processOne(supabase, instructorId, pupilId, periodDays ?? 7);
    const status = (result as any).status ?? 200;
    return new Response(JSON.stringify(result), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
