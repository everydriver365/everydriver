import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LineItem {
  name: string;
  quantity: number; // integer
  amount_cents: number; // unit price in cents
}

interface AcceptedPaymentMethods {
  card?: boolean;
  buy_now_pay_later?: boolean;
  bank_account?: boolean;
  square_gift_card?: boolean;
  cash_app_pay?: boolean;
}

interface CreateBody {
  action: "create";
  pupil_id?: string | null;
  recipient_email: string;
  recipient_name: string;
  line_items: LineItem[];
  service_fee_cents?: number;
  due_date: string; // YYYY-MM-DD
  description?: string;
  accepted_payment_methods?: AcceptedPaymentMethods;
  klarna_enabled?: boolean;
  location_id?: string | null;
}

interface ActionBody {
  action: "cancel" | "resend";
  invoice_row_id: string;
}

interface SyncStatusBody {
  action: "sync_status";
  invoice_row_id: string;
}

interface ListLocationsBody {
  action: "list_locations";
}

type Body = CreateBody | ActionBody | SyncStatusBody | ListLocationsBody;


function ok(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
function err(message: string, status = 400, extra?: unknown) {
  return new Response(JSON.stringify({ error: message, ...(extra ? { details: extra } : {}) }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function squareBaseUrl(): string {
  const env = (Deno.env.get("SQUARE_ENVIRONMENT") || "production").toLowerCase();
  const isProd = env === "production" || env === "prod" || env === "live";
  return isProd ? "https://connect.squareup.com" : "https://connect.squareupsandbox.com";
}

async function squareFetch(path: string, token: string, init: RequestInit = {}) {
  const res = await fetch(`${squareBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Square-Version": "2024-09-19",
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* ignore */ }
  return { ok: res.ok, status: res.status, json, text };
}

function isInsufficientScopes(json: any): boolean {
  const errors = json?.errors;
  if (!Array.isArray(errors)) return false;
  return errors.some((e: any) => e?.code === "INSUFFICIENT_SCOPES");
}

// Per-country allowlist of `accepted_payment_methods` keys that Square will
// actually honour on an invoice. Anything not in this set is silently dropped
// before the create call so Square never returns a BAD_REQUEST for an
// unsupported method (e.g. bank_account in GB, cash_app_pay outside US).
// Source: Square Invoices API country availability matrix.
const SQUARE_INVOICE_METHODS_BY_COUNTRY: Record<string, ReadonlyArray<keyof AcceptedPaymentMethods>> = {
  US: ["card", "square_gift_card", "bank_account", "buy_now_pay_later", "cash_app_pay"],
  CA: ["card", "square_gift_card"],
  GB: ["card", "buy_now_pay_later"],
  IE: ["card", "buy_now_pay_later"],
  AU: ["card", "buy_now_pay_later"],
  FR: ["card"],
  ES: ["card"],
  JP: ["card"],
};
const DEFAULT_SUPPORTED_METHODS: ReadonlyArray<keyof AcceptedPaymentMethods> = ["card"];

function sanitizeAcceptedPaymentMethods(
  requested: AcceptedPaymentMethods | undefined,
  countryCode: string | null | undefined,
): { apm: Record<string, boolean>; dropped: string[] } {
  const country = (countryCode || "").toUpperCase();
  const allowed = new Set(SQUARE_INVOICE_METHODS_BY_COUNTRY[country] ?? DEFAULT_SUPPORTED_METHODS);
  // Card is mandatory — Square requires at least one accepted method.
  const apm: Record<string, boolean> = {
    card: true,
    square_gift_card: false,
    bank_account: false,
    buy_now_pay_later: false,
    cash_app_pay: false,
  };
  const dropped: string[] = [];
  const keys: Array<keyof AcceptedPaymentMethods> = [
    "card",
    "square_gift_card",
    "bank_account",
    "buy_now_pay_later",
    "cash_app_pay",
  ];
  for (const k of keys) {
    const wanted = !!requested?.[k];
    if (!wanted) continue;
    if (allowed.has(k)) {
      apm[k] = true;
    } else {
      dropped.push(k);
    }
  }
  return { apm, dropped };
}


const RECONNECT_MSG =
  "Your Square connection is missing required permissions. Please disconnect and reconnect Square from the invoices page, then try again.";

// Find or create a Square customer by email
async function findOrCreateCustomer(
  token: string,
  email: string,
  name: string,
): Promise<{ id: string | null; insufficientScopes?: boolean; raw?: unknown }> {
  const parts = (name || "").trim().split(/\s+/);
  const given = parts[0] || "Customer";
  const family = parts.slice(1).join(" ") || undefined;

  // Search
  const search = await squareFetch("/v2/customers/search", token, {
    method: "POST",
    body: JSON.stringify({ query: { filter: { email_address: { exact: email } } } }),
  });
  if (search.ok && search.json?.customers?.[0]?.id) return { id: search.json.customers[0].id };
  if (!search.ok && isInsufficientScopes(search.json)) {
    return { id: null, insufficientScopes: true, raw: search.json };
  }

  // Create
  const create = await squareFetch("/v2/customers", token, {
    method: "POST",
    body: JSON.stringify({
      idempotency_key: crypto.randomUUID(),
      given_name: given,
      family_name: family,
      email_address: email,
    }),
  });
  if (create.ok && create.json?.customer?.id) return { id: create.json.customer.id };
  console.error("[square-invoice] create customer failed", create.status, create.json);
  if (isInsufficientScopes(create.json)) {
    return { id: null, insufficientScopes: true, raw: create.json };
  }
  return { id: null, raw: create.json };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Auth: who is calling?
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return err("Missing authorization", 401);

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: userErr } = await authClient.auth.getClaims(token);
    if (userErr || !claimsData?.claims?.sub) {
      console.error("[square-invoice] auth.getClaims failed", userErr);
      return err("Unauthorized", 401);
    }
    const userId = claimsData.claims.sub;

    // Resolve role: admin or instructor
    const [{ data: roleRow }, { data: instructorRow }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle(),
      supabase.from("instructors")
        .select("id, name, business_name, square_access_token_encrypted, square_merchant_id")
        .eq("auth_user_id", userId).maybeSingle(),
    ]);
    const isAdmin = !!roleRow;
    const instructor = instructorRow as any;

    const body = (await req.json()) as Body;

    // ====== CREATE ======
    if (body.action === "create") {
      const { pupil_id, recipient_email, recipient_name, line_items, service_fee_cents = 0, due_date, description, accepted_payment_methods, klarna_enabled, location_id: requestedLocationId } = body;

      if (!recipient_email || !recipient_name) return err("recipient_email and recipient_name required");
      if (!Array.isArray(line_items) || line_items.length === 0) return err("At least one line item required");
      if (!due_date) return err("due_date required");

      // Determine issuer + Square credentials
      let issuerType: "instructor" | "school";
      let squareToken: string;
      let locationId: string;
      let locationCountry: string | null = null;
      let issuerInstructorId: string | null = null;

      if (instructor?.id && instructor?.square_access_token_encrypted) {
        // Instructor caller with connected account
        issuerType = "instructor";
        issuerInstructorId = instructor.id;
        squareToken = instructor.square_access_token_encrypted;
        // Look up the instructor's Square locations
        const locRes = await squareFetch("/v2/locations", squareToken);
        if (!locRes.ok) {
          return err("Failed to fetch Square locations for your account. Please reconnect Square.", 400, locRes.json);
        }
        const locations: any[] = locRes.json?.locations || [];
        let chosen: any = null;
        if (requestedLocationId) {
          chosen = locations.find((l) => l.id === requestedLocationId && l.status === "ACTIVE");
          if (!chosen) return err("Selected Square location is not available on your account", 400);
        } else {
          chosen = locations.find((l) => l.status === "ACTIVE") || locations[0];
        }
        if (!chosen?.id) return err("No active Square location found on your account");
        locationId = chosen.id;
        locationCountry = chosen.country || null;
      } else if (isAdmin) {
        issuerType = "school";
        squareToken = Deno.env.get("SQUARE_ACCESS_TOKEN") || "";
        locationId = requestedLocationId || Deno.env.get("SQUARE_LOCATION_ID") || "";
        if (!squareToken || !locationId) return err("Platform Square account is not configured", 500);
        // Fetch the platform location to learn its country so we sanitize
        // accepted_payment_methods accurately rather than guessing.
        const locRes = await squareFetch(`/v2/locations/${locationId}`, squareToken);
        if (locRes.ok && locRes.json?.location?.country) {
          locationCountry = locRes.json.location.country;
        }
      } else {
        return err("Connect your Square account before sending invoices", 400);
      }

      // Preflight: drop any accepted_payment_methods Square won't accept for
      // this location's country (e.g. bank_account in GB). Prevents BAD_REQUEST
      // from /v2/invoices. Card stays on — Square requires at least one method.
      const { apm, dropped: droppedMethods } = sanitizeAcceptedPaymentMethods(
        accepted_payment_methods,
        locationCountry,
      );
      if (droppedMethods.length > 0) {
        console.warn(
          "[square-invoice] dropped unsupported payment methods",
          { country: locationCountry, dropped: droppedMethods },
        );
      }


      // Find/create customer
      const customerResult = await findOrCreateCustomer(squareToken, recipient_email, recipient_name);
      if (customerResult.insufficientScopes) return err(RECONNECT_MSG, 403, customerResult.raw);
      const customerId = customerResult.id;
      if (!customerId) return err("Failed to create Square customer", 502, customerResult.raw);

      // Build order line items
      const orderLineItems = line_items.map((li) => ({
        name: li.name.slice(0, 255),
        quantity: String(Math.max(1, Math.floor(li.quantity || 1))),
        base_price_money: { amount: Math.max(0, Math.round(li.amount_cents)), currency: "GBP" },
      }));
      if (service_fee_cents > 0) {
        orderLineItems.push({
          name: "Service Fee",
          quantity: "1",
          base_price_money: { amount: Math.round(service_fee_cents), currency: "GBP" },
        });
      }

      // Create order
      const orderRes = await squareFetch("/v2/orders", squareToken, {
        method: "POST",
        body: JSON.stringify({
          idempotency_key: crypto.randomUUID(),
          order: {
            location_id: locationId,
            customer_id: customerId,
            line_items: orderLineItems,
          },
        }),
      });
      if (!orderRes.ok || !orderRes.json?.order?.id) {
        console.error("[square-invoice] order create failed", orderRes.status, orderRes.json);
        if (isInsufficientScopes(orderRes.json)) return err(RECONNECT_MSG, 403, orderRes.json);
        return err("Failed to create Square order", 502, orderRes.json);
      }
      const orderId = orderRes.json.order.id;
      const totalCents: number = orderRes.json.order.total_money?.amount ?? 0;

      // Create invoice
      const invoiceRes = await squareFetch("/v2/invoices", squareToken, {
        method: "POST",
        body: JSON.stringify({
          idempotency_key: crypto.randomUUID(),
          invoice: {
            location_id: locationId,
            order_id: orderId,
            primary_recipient: { customer_id: customerId },
            payment_requests: [
              {
                request_type: "BALANCE",
                due_date: due_date,
                automatic_payment_source: "NONE",
              },
            ],
            delivery_method: "EMAIL",
            accepted_payment_methods: apm,
            title: description || "Driving lessons invoice",
            description: description || "Thank you for booking with us.",
          },
        }),
      });
      if (!invoiceRes.ok || !invoiceRes.json?.invoice?.id) {
        console.error("[square-invoice] invoice create failed", invoiceRes.status, invoiceRes.json);
        if (isInsufficientScopes(invoiceRes.json)) return err(RECONNECT_MSG, 403, invoiceRes.json);
        return err("Failed to create Square invoice", 502, invoiceRes.json);
      }
      const invoice = invoiceRes.json.invoice;

      // Publish (sends email)
      const pubRes = await squareFetch(`/v2/invoices/${invoice.id}/publish`, squareToken, {
        method: "POST",
        body: JSON.stringify({
          version: invoice.version,
          idempotency_key: crypto.randomUUID(),
        }),
      });
      if (!pubRes.ok) {
        console.error("[square-invoice] publish failed", pubRes.status, pubRes.json);
        if (isInsufficientScopes(pubRes.json)) return err(RECONNECT_MSG, 403, pubRes.json);
        return err("Failed to publish Square invoice", 502, pubRes.json);
      }
      const publishedInvoice = pubRes.json.invoice || invoice;
      const payableStatuses = new Set(["UNPAID", "PARTIALLY_PAID"]);
      if (!payableStatuses.has(String(publishedInvoice.status || "").toUpperCase())) {
        console.error("[square-invoice] invoice published but not payable", publishedInvoice.status, publishedInvoice.id);
        return err("Square created the invoice, but it is not payable yet. Please check online invoice payments are enabled in Square and try again.", 502, publishedInvoice);
      }

      // ===== Optional Klarna pay-link (parallel to Square) =====
      let klarnaPayUrl: string | null = null;
      let klarnaOrderId: string | null = null;
      let klarnaError: string | null = null;
      const klarnaOn = !!klarna_enabled;

      if (klarnaOn) {
        try {
          const klarnaUser = Deno.env.get("KLARNA_API_USERNAME");
          const klarnaPass = Deno.env.get("KLARNA_API_PASSWORD");
          if (!klarnaUser || !klarnaPass) {
            klarnaError = "Klarna credentials not configured";
          } else {
            const isSandbox = Deno.env.get("KLARNA_SANDBOX") === "true";
            const klarnaBase = isSandbox ? "https://api.playground.klarna.com" : "https://api.klarna.com";
            const siteUrl = Deno.env.get("SITE_URL") || "https://everydriver.lovable.app";
            const merchantRef = publishedInvoice.invoice_number || publishedInvoice.id;
            const amountMinor = Math.max(50, Math.round(totalCents)); // already in pence
            const klarnaAuth = "Basic " + btoa(`${klarnaUser}:${klarnaPass}`);

            // Step 1: create a Klarna Payments session (Payments API v1).
            // This replaces the legacy Checkout v3 flow, which is no longer
            // enabled by default on live EU merchant accounts and returns 401.
            const paymentPayload = {
              purchase_country: "GB",
              purchase_currency: "GBP",
              locale: "en-GB",
              order_amount: amountMinor,
              order_tax_amount: 0,
              order_lines: [{
                type: "digital",
                reference: merchantRef,
                name: (description || "Driving lessons invoice").slice(0, 255),
                quantity: 1,
                unit_price: amountMinor,
                tax_rate: 0,
                total_amount: amountMinor,
                total_tax_amount: 0,
              }],
              merchant_reference1: merchantRef,
            };
            const pres = await fetch(`${klarnaBase}/payments/v1/sessions`, {
              method: "POST",
              headers: { Authorization: klarnaAuth, "Content-Type": "application/json" },
              body: JSON.stringify(paymentPayload),
            });
            const pjson = await pres.json().catch(() => null) as any;
            if (!pres.ok || !pjson?.session_id) {
              klarnaError =
                pjson?.error_messages?.[0] ||
                `Klarna payments session failed (HTTP ${pres.status})`;
              console.error("[square-invoice] klarna payments session failed", pres.status, pjson);
            } else {
              // Step 2: wrap that payment session in a Hosted Payment Page session
              // so the buyer gets a hosted URL we can email/share.
              const hppPayload = {
                payment_session_url: `${klarnaBase}/payments/v1/sessions/${pjson.session_id}`,
                merchant_urls: {
                  success: `${siteUrl}/invoices?klarna_paid=1&session_id={{session_id}}`,
                  cancel: `${siteUrl}/invoices?klarna_cancelled=1`,
                  back: `${siteUrl}/invoices`,
                  failure: `${siteUrl}/invoices?klarna_failed=1`,
                  error: `${siteUrl}/invoices?klarna_error=1`,
                  status_update: `${supabaseUrl}/functions/v1/klarna-invoice-webhook?session_id={{session_id}}`,
                },
                options: {
                  place_order_mode: "PLACE_ORDER",
                  payment_method_categories: ["pay_later", "pay_over_time"],
                },
              };
              const hres = await fetch(`${klarnaBase}/hpp/v1/sessions`, {
                method: "POST",
                headers: { Authorization: klarnaAuth, "Content-Type": "application/json" },
                body: JSON.stringify(hppPayload),
              });
              const hjson = await hres.json().catch(() => null) as any;
              if (hres.ok && hjson?.redirect_url && hjson?.session_id) {
                // Store the HPP session id as our "order id"; the webhook polls
                // /hpp/v1/sessions/{id} to learn status and the final order_id.
                klarnaOrderId = hjson.session_id;
                klarnaPayUrl = hjson.redirect_url;
              } else {
                klarnaError =
                  hjson?.error_messages?.[0] ||
                  `Klarna HPP session failed (HTTP ${hres.status})`;
                console.error("[square-invoice] klarna hpp session failed", hres.status, hjson);
              }
            }
          }
        } catch (e) {
          klarnaError = e instanceof Error ? e.message : String(e);
          console.error("[square-invoice] klarna exception", e);
        }
      }

      // Auto-resolve pupil by email if caller did not pass one. Lets the
      // paid-invoice webhook auto-credit the pupil's balance.
      let resolvedPupilId: string | null = pupil_id || null;
      if (!resolvedPupilId && issuerInstructorId && recipient_email) {
        try {
          const { data: matchedPupil } = await supabase
            .from("pupils")
            .select("id")
            .eq("instructor_id", issuerInstructorId)
            .ilike("email", recipient_email.trim())
            .is("deleted_at", null)
            .maybeSingle();
          if ((matchedPupil as any)?.id) resolvedPupilId = (matchedPupil as any).id;
        } catch (e) {
          console.warn("[square-invoice] pupil auto-match failed", e);
        }
      }

      // Insert row
      const { data: row, error: insertErr } = await supabase
        .from("square_invoices")
        .insert({
          issuer_type: issuerType,
          issuer_instructor_id: issuerInstructorId,
          recipient_pupil_id: resolvedPupilId,
          recipient_email,
          recipient_name,
          square_invoice_id: publishedInvoice.id,
          square_order_id: orderId,
          public_url: publishedInvoice.public_url || null,
          square_location_id: locationId,
          accepted_payment_methods: apm,
          status: (publishedInvoice.status || "UNPAID").toLowerCase(),
          amount_cents: totalCents,
          service_fee_cents,
          currency: "GBP",
          due_date,
          description: description || null,
          line_items: line_items as any,
          sent_at: new Date().toISOString(),
          last_event_at: new Date().toISOString(),
          created_by: userId,
          klarna_enabled: klarnaOn,
          clearpay_enabled: apm.buy_now_pay_later,
          klarna_pay_url: klarnaPayUrl,
          klarna_order_id: klarnaOrderId,
          klarna_status: klarnaOn ? (klarnaPayUrl ? "pending" : "failed") : null,
        })
        .select()
        .single();

      if (insertErr) {
        console.error("[square-invoice] DB insert failed", insertErr);
        return err("Invoice sent but failed to store record", 500, insertErr.message);
      }

      return ok({ success: true, invoice: row, public_url: publishedInvoice.public_url, klarna_pay_url: klarnaPayUrl, klarna_error: klarnaError });
    }

    // ====== CANCEL / RESEND ======
    if (body.action === "cancel" || body.action === "resend") {
      const { data: row, error: rowErr } = await supabase
        .from("square_invoices")
        .select("*")
        .eq("id", body.invoice_row_id)
        .maybeSingle();
      if (rowErr || !row) return err("Invoice not found", 404);

      // Auth check
      const ownsRow =
        (row.issuer_type === "instructor" && row.issuer_instructor_id === instructor?.id) ||
        (row.issuer_type === "school" && isAdmin) ||
        isAdmin;
      if (!ownsRow) return err("Not authorised for this invoice", 403);

      // Determine token
      let squareToken = "";
      if (row.issuer_type === "instructor" && instructor?.square_access_token_encrypted) {
        squareToken = instructor.square_access_token_encrypted;
      } else if (row.issuer_type === "school") {
        squareToken = Deno.env.get("SQUARE_ACCESS_TOKEN") || "";
      }
      if (!squareToken) return err("Square credentials unavailable", 500);
      if (!row.square_invoice_id) return err("Missing Square invoice id", 400);

      // Fetch current invoice for version
      const getRes = await squareFetch(`/v2/invoices/${row.square_invoice_id}`, squareToken);
      if (!getRes.ok) return err("Failed to fetch invoice", 502, getRes.json);
      const version = getRes.json?.invoice?.version ?? 0;

      if (body.action === "cancel") {
        const res = await squareFetch(`/v2/invoices/${row.square_invoice_id}/cancel`, squareToken, {
          method: "POST",
          body: JSON.stringify({ version }),
        });
        if (!res.ok) return err("Failed to cancel invoice", 502, res.json);
        await supabase
          .from("square_invoices")
          .update({ status: "cancelled", cancelled_at: new Date().toISOString(), last_event_at: new Date().toISOString() })
          .eq("id", row.id);
        return ok({ success: true });
      }

      // resend = publish again (Square treats this as re-send email)
      const res = await squareFetch(`/v2/invoices/${row.square_invoice_id}/publish`, squareToken, {
        method: "POST",
        body: JSON.stringify({ version, idempotency_key: crypto.randomUUID() }),
      });
      if (!res.ok) return err("Failed to resend invoice", 502, res.json);
      await supabase
        .from("square_invoices")
        .update({ sent_at: new Date().toISOString(), last_event_at: new Date().toISOString() })
        .eq("id", row.id);
      return ok({ success: true });
    }
    // ====== SYNC STATUS (pull live from Square) ======
    if (body.action === "sync_status") {
      const { data: row, error: rowErr } = await supabase
        .from("square_invoices")
        .select("*")
        .eq("id", body.invoice_row_id)
        .maybeSingle();
      if (rowErr || !row) return err("Invoice not found", 404);

      const ownsRow =
        (row.issuer_type === "instructor" && row.issuer_instructor_id === instructor?.id) ||
        (row.issuer_type === "school" && isAdmin) ||
        isAdmin;
      if (!ownsRow) return err("Not authorised for this invoice", 403);

      let squareToken = "";
      if (row.issuer_type === "instructor" && instructor?.square_access_token_encrypted) {
        squareToken = instructor.square_access_token_encrypted;
      } else if (row.issuer_type === "school") {
        squareToken = Deno.env.get("SQUARE_ACCESS_TOKEN") || "";
      }
      if (!squareToken) return err("Square credentials unavailable", 500);
      if (!row.square_invoice_id) return err("Missing Square invoice id", 400);

      const getRes = await squareFetch(`/v2/invoices/${row.square_invoice_id}`, squareToken);
      if (!getRes.ok) return err("Failed to fetch invoice from Square", 502, getRes.json);
      const invoice = getRes.json?.invoice;
      const sqStatus = String(invoice?.status || "").toUpperCase();
      const statusMap: Record<string, string> = {
        PAID: "paid",
        CANCELED: "cancelled",
        CANCELLED: "cancelled",
        REFUNDED: "refunded",
        UNPAID: "unpaid",
        PARTIALLY_PAID: "partially_paid",
        PARTIALLY_REFUNDED: "partially_refunded",
        PUBLISHED: "sent",
        SCHEDULED: "sent",
        DRAFT: "draft",
        FAILED: "failed",
      };
      const newStatus = statusMap[sqStatus] || row.status;

      const updates: Record<string, unknown> = {
        status: newStatus,
        last_event_at: new Date().toISOString(),
      };
      if (newStatus === "paid" && !row.paid_at) updates.paid_at = new Date().toISOString();
      if (newStatus === "cancelled" && !row.cancelled_at) updates.cancelled_at = new Date().toISOString();

      await supabase.from("square_invoices").update(updates).eq("id", row.id);

      let credited = false;
      if (
        newStatus === "paid" &&
        row.status !== "paid" &&
        row.issuer_type === "instructor" &&
        row.recipient_pupil_id &&
        row.amount_cents > 0
      ) {
        const externalRef = `square-invoice:${row.square_invoice_id}`;
        const { data: existing } = await supabase
          .from("payment_history")
          .select("id")
          .eq("external_payment_ref", externalRef)
          .maybeSingle();
        if (!existing) {
          const amountPounds = row.amount_cents / 100;
          try {
            await supabase.rpc("increment_pupil_balance", {
              p_pupil_id: row.recipient_pupil_id,
              p_amount: amountPounds,
            });
            await supabase.from("payment_history").insert({
              pupil_id: row.recipient_pupil_id,
              instructor_id: row.issuer_instructor_id,
              amount: amountPounds,
              payment_method: "Square",
              external_payment_ref: externalRef,
              notes: `Square invoice payment (${row.square_invoice_id}) — synced`,
            });
            credited = true;
          } catch (e) {
            console.error("[square-invoice] credit pupil on sync failed", e);
          }
        }
      }

      return ok({ success: true, status: newStatus, changed: newStatus !== row.status, credited });
    }


    // ====== LIST LOCATIONS ======
    if (body.action === "list_locations") {
      let squareToken: string;
      if (instructor?.id && instructor?.square_access_token_encrypted) {
        squareToken = instructor.square_access_token_encrypted;
      } else if (isAdmin) {
        squareToken = Deno.env.get("SQUARE_ACCESS_TOKEN") || "";
        if (!squareToken) return err("Platform Square account is not configured", 500);
      } else {
        return err("Connect your Square account before listing locations", 400);
      }
      const locRes = await squareFetch("/v2/locations", squareToken);
      if (!locRes.ok) return err("Failed to fetch Square locations", 400, locRes.json);
      const locations = (locRes.json?.locations || [])
        .filter((l: any) => l.status === "ACTIVE")
        .map((l: any) => ({
          id: l.id,
          name: l.name,
          address: [l.address?.address_line_1, l.address?.locality, l.address?.postal_code]
            .filter(Boolean)
            .join(", "),
          is_main: !!l.merchant_id && l.type === "PHYSICAL",
        }));
      return ok({ locations });
    }

    return err("Unknown action");
  } catch (e) {
    console.error("[square-invoice] fatal", e);
    return err("Internal error", 500, e instanceof Error ? e.message : "Unknown");
  }
});
