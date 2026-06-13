// Ryft invoice manager — replaces square-invoice-manage.
// Creates Ryft payment sessions for invoicing flows, persists them in `ryft_invoices`,
// and supports cancel/resend/sync_status actions.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LineItem {
  name: string;
  quantity: number;
  amount_cents: number; // unit price pence
}

interface CreateBody {
  action: "create";
  pupil_id?: string | null;
  recipient_email: string;
  recipient_name: string;
  line_items: LineItem[];
  service_fee_cents?: number;
  due_date: string;
  description?: string;
}

interface ActionBody {
  action: "cancel" | "resend" | "sync_status";
  invoice_row_id: string;
}

type Body = CreateBody | ActionBody;

function ok(d: unknown, s = 200) {
  return new Response(JSON.stringify(d), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
function err(m: string, s = 400) {
  return new Response(JSON.stringify({ error: m }), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function ryftBase(): string {
  const e = (Deno.env.get("RYFT_ENVIRONMENT") || "production").toLowerCase();
  return e === "production" || e === "live" || e === "prod"
    ? "https://api.ryftpay.com/v1"
    : "https://sandbox-api.ryftpay.com/v1";
}

async function ryftFetch(path: string, init: RequestInit = {}) {
  const secret = Deno.env.get("RYFT_SECRET_KEY")?.trim();
  if (!secret) throw new Error("RYFT_SECRET_KEY missing");
  const res = await fetch(`${ryftBase()}${path}`, {
    ...init,
    headers: {
      Authorization: secret,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch {}
  return { ok: res.ok, status: res.status, json, text };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return err("Not authenticated", 401);
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) return err("Not authenticated", 401);

    // Resolve instructor for the calling user
    const { data: instructorRow } = await admin
      .from("instructors")
      .select("id, name, ryft_account_id, ryft_payouts_enabled")
      .eq("auth_user_id", userData.user.id)
      .maybeSingle();

    if (!instructorRow) return err("Instructor not found", 404);

    const body = (await req.json()) as Body;

    if (body.action === "create") {
      if (!instructorRow.ryft_account_id || !instructorRow.ryft_payouts_enabled) {
        return err("Ryft payouts not enabled for this instructor", 400);
      }
      const subtotal = body.line_items.reduce(
        (acc, li) => acc + Math.max(0, li.amount_cents) * Math.max(1, li.quantity),
        0,
      );
      const serviceFee = Math.max(0, body.service_fee_cents ?? 0);
      const total = subtotal + serviceFee;
      if (total < 50) return err("Minimum invoice total is £0.50");

      const orderReference = `inv-${crypto.randomUUID().slice(0, 8)}`;

      // Insert invoice draft
      const { data: invRow, error: insErr } = await admin
        .from("ryft_invoices")
        .insert({
          issuer_type: "instructor",
          issuer_instructor_id: instructorRow.id,
          recipient_pupil_id: body.pupil_id ?? null,
          recipient_email: body.recipient_email,
          recipient_name: body.recipient_name,
          amount_pence: total,
          service_fee_pence: serviceFee,
          description: body.description ?? null,
          line_items: body.line_items,
          due_date: body.due_date,
          status: "draft",
          created_by: userData.user.id,
        })
        .select()
        .single();
      if (insErr || !invRow) return err(insErr?.message || "Failed to create invoice row", 500);

      // Create Ryft payment session
      const sessionPayload = {
        amount: total,
        currency: "GBP",
        customerDetails: {
          email: body.recipient_email,
          firstName: body.recipient_name.split(" ")[0],
          lastName: body.recipient_name.split(" ").slice(1).join(" ") || undefined,
        },
        metadata: {
          orderReference,
          invoiceRowId: invRow.id,
          instructorId: instructorRow.id,
          pupilId: body.pupil_id ?? "",
        },
        splits: serviceFee > 0
          ? [{ accountId: instructorRow.ryft_account_id, amount: subtotal, description: "Instructor payout" }]
          : undefined,
      };

      const r = await ryftFetch("/payment-sessions", { method: "POST", body: JSON.stringify(sessionPayload) });
      if (!r.ok) {
        await admin
          .from("ryft_invoices")
          .update({ status: "failed", last_error: r.text?.slice(0, 500) })
          .eq("id", invRow.id);
        return err(`Ryft session create failed: ${r.status}`, 502);
      }

      const sessionId = r.json?.id;
      const hostedUrl = r.json?.hostedCheckoutUrl || r.json?.checkoutUrl || null;

      await admin
        .from("ryft_invoices")
        .update({
          ryft_payment_session_id: sessionId,
          ryft_payment_link_url: hostedUrl,
          public_url: hostedUrl,
          status: "sent",
          sent_at: new Date().toISOString(),
        })
        .eq("id", invRow.id);

      return ok({ invoice_id: invRow.id, public_url: hostedUrl, session_id: sessionId });
    }

    if (body.action === "cancel") {
      const { data: row } = await admin
        .from("ryft_invoices")
        .select("*")
        .eq("id", body.invoice_row_id)
        .eq("issuer_instructor_id", instructorRow.id)
        .maybeSingle();
      if (!row) return err("Invoice not found", 404);
      await admin
        .from("ryft_invoices")
        .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
        .eq("id", row.id);
      return ok({ success: true });
    }

    if (body.action === "resend") {
      // Ryft hosted checkout link is persistent — just confirm and return current URL.
      const { data: row } = await admin
        .from("ryft_invoices")
        .select("public_url")
        .eq("id", body.invoice_row_id)
        .eq("issuer_instructor_id", instructorRow.id)
        .maybeSingle();
      if (!row) return err("Invoice not found", 404);
      return ok({ success: true, public_url: row.public_url });
    }

    if (body.action === "sync_status") {
      const { data: row } = await admin
        .from("ryft_invoices")
        .select("id, ryft_payment_session_id")
        .eq("id", body.invoice_row_id)
        .eq("issuer_instructor_id", instructorRow.id)
        .maybeSingle();
      if (!row?.ryft_payment_session_id) return err("Invoice not found", 404);
      const r = await ryftFetch(`/payment-sessions/${row.ryft_payment_session_id}`);
      if (!r.ok) return err("Sync failed", 502);
      const status = (r.json?.status || "").toLowerCase();
      const mapped =
        status === "approved" || status === "captured" ? "paid" :
        status === "cancelled" ? "cancelled" :
        status === "failed" ? "failed" : "sent";
      const update: Record<string, unknown> = { status: mapped, last_event_at: new Date().toISOString() };
      if (mapped === "paid") update.paid_at = new Date().toISOString();
      await admin.from("ryft_invoices").update(update).eq("id", row.id);
      return ok({ success: true, status: mapped });
    }

    return err("Unknown action");
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e), 500);
  }
});
