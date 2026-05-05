import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as hexEncode } from "https://deno.land/std@0.168.0/encoding/hex.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-square-hmacsha256-signature",
};

async function verifySquareSignature(body: string, signature: string, sigKey: string, notificationUrl: string): Promise<boolean> {
  const combined = notificationUrl + body;
  const key = new TextEncoder().encode(sigKey);
  const data = new TextEncoder().encode(combined);
  const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, data);
  const computed = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return computed === signature;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const rawBody = await req.text();

    // HMAC signature verification
    const WEBHOOK_SIG_KEY = Deno.env.get("SQUARE_WEBHOOK_SIGNATURE_KEY");
    if (WEBHOOK_SIG_KEY) {
      const signature = req.headers.get("x-square-hmacsha256-signature") || "";
      const notificationUrl = `${supabaseUrl}/functions/v1/square-webhook`;
      const isValid = await verifySquareSignature(rawBody, signature, WEBHOOK_SIG_KEY, notificationUrl);
      if (!isValid) {
        console.error("Square webhook signature verification FAILED");
        return new Response(
          JSON.stringify({ error: "Invalid signature" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.log("Square webhook signature verified ✓");
    } else {
      console.warn("SQUARE_WEBHOOK_SIGNATURE_KEY not set — skipping signature verification");
    }

    const payload = JSON.parse(rawBody);
    const eventType = payload.type;
    const data = payload.data?.object;

    console.log("Received Square webhook:", eventType);

    switch (eventType) {
      case "payment.completed":
      case "payment.updated": {
        const payment = data?.payment || data;
        const paymentStatus = payment?.status;
        const paymentId = payment?.id;
        const referenceId = payment?.reference_id;
        const orderId = payment?.order_id;
        const amountMoney = payment?.amount_money;
        const receiptUrl = payment?.receipt_url;

        // Only process completed payments
        if (paymentStatus && paymentStatus !== "COMPLETED") {
          console.log(`Skipping payment ${paymentId} with status: ${paymentStatus}`);
          break;
        }

        if (!paymentId || !amountMoney) {
          console.log("payment event: missing payment ID or amount");
          break;
        }

        const amountPounds = (amountMoney.amount || 0) / 100;
        console.log(`Square payment completed: ${paymentId}, £${amountPounds}, ref: ${referenceId}, order: ${orderId}`);

        // Determine if this is a pupil balance payment or booking payment
        // Square wallet payments already record via their own edge functions,
        // so we only handle Square Checkout (redirect) payments here.
        // Square Checkout payments have an order_id but typically no reference_id
        // since quick_pay doesn't support reference_id.

        // Look for a pupil with a pending booking whose balance matches
        // We check payment_intents first if available
        let pupilId: string | null = null;
        let instructorId: string | null = null;

        // Try to find by payment_intents table (if booking stored a record)
        if (orderId) {
          const { data: intent } = await supabase
            .from("payment_intents")
            .select("pupil_id, instructor_id, amount_pence, status")
            .eq("transaction_unique", orderId)
            .eq("status", "pending")
            .maybeSingle();

          if (intent) {
            pupilId = intent.pupil_id;
            instructorId = intent.instructor_id;
            console.log(`Found payment intent for order ${orderId}: pupil ${pupilId}`);

            // Mark intent as paid
            await supabase
              .from("payment_intents")
              .update({ status: "paid" })
              .eq("transaction_unique", orderId);
          } else {
            // Fallback: try matching recent pending square_checkout intents
            const { data: intentByRef } = await supabase
              .from("payment_intents")
              .select("pupil_id, instructor_id, amount_pence, status, id, transaction_unique")
              .eq("provider", "square_checkout")
              .eq("status", "pending")
              .order("created_at", { ascending: false })
              .limit(10);

            if (intentByRef) {
              for (const pi of intentByRef) {
                pupilId = pi.pupil_id;
                instructorId = pi.instructor_id;
                console.log(`Fallback match: payment_intent ${pi.id} for order ${orderId}`);
                await supabase
                  .from("payment_intents")
                  .update({ status: "paid", transaction_unique: orderId })
                  .eq("id", pi.id);
                break;
              }
            }
          }
        }

        // Try reference_id lookup (for wallet payments that set reference_id)
        if (!pupilId && referenceId) {
          // Check PUPIL- prefix (balance payments)
          if (referenceId.startsWith("PUPIL-")) {
            const pupilIdSlice = referenceId.replace("PUPIL-", "").split("-")[0];
            const { data: pupils } = await supabase
              .from("pupils")
              .select("id, instructor_id")
              .ilike("id", `${pupilIdSlice}%`)
              .limit(1);

            if (pupils && pupils.length > 0) {
              pupilId = pupils[0].id;
              instructorId = pupils[0].instructor_id;
            }
          }
          // Check BOOK- prefix (booking payments from wallet)
          else if (referenceId.startsWith("BOOK-")) {
            const instructorSlice = referenceId.replace("BOOK-", "").split("-")[0];
            // These are already handled by square-booking-wallet-payment, skip
            console.log(`Skipping BOOK- reference (handled by wallet function): ${referenceId}`);
            break;
          }
        }

        if (!pupilId || !instructorId) {
          console.log("payment.completed: could not match to a pupil/instructor, skipping");
          break;
        }

        // Check if payment_history already recorded (idempotency)
        const { data: existing } = await supabase
          .from("payment_history")
          .select("id")
          .eq("pupil_id", pupilId)
          .ilike("notes", `%${paymentId}%`)
          .maybeSingle();

        if (existing) {
          console.log(`Payment ${paymentId} already recorded, skipping`);
          break;
        }

        // Check if instructor has Square OAuth connected
        let isAutoTransfer = false;
        if (instructorId) {
          const { data: instrData } = await supabase
            .from("instructors")
            .select("square_merchant_id")
            .eq("id", instructorId)
            .maybeSingle();
          isAutoTransfer = !!instrData?.square_merchant_id;
        }

        // Get commission config
        const { data: commConfig } = await supabase
          .from("platform_commission_config")
          .select("rate_percent, fixed_fee_pence, is_active")
          .eq("is_active", true)
          .maybeSingle();

        let feeAmount = 0;
        let creditAmount = amountPounds;
        if (commConfig && !isAutoTransfer) {
          // Only deduct fee from platform account when NOT using instructor OAuth
          // (OAuth payments already split via app_fee_money)
          feeAmount = amountPounds * (commConfig.rate_percent / 100) + (commConfig.fixed_fee_pence / 100);
          feeAmount = Math.round(feeAmount * 100) / 100;
          creditAmount = amountPounds - feeAmount;
        }

        const payoutStatus = isAutoTransfer ? "auto_transferred" : "pending";

        // Record payment_history
        await supabase.from("payment_history").insert({
          instructor_id: instructorId,
          pupil_id: pupilId,
          amount: creditAmount,
          payment_method: "square_checkout",
          payout_status: payoutStatus,
          notes: `Square Checkout Payment - ID: ${paymentId}${feeAmount > 0 ? ` (admin fee: £${feeAmount.toFixed(2)})` : ''}${isAutoTransfer ? ' (auto-paid via Square)' : ''}`,
        });

        // Credit pupil balance
        await supabase.rpc("increment_pupil_balance", {
          p_pupil_id: pupilId,
          p_amount: creditAmount,
        });
        console.log(`Credited £${creditAmount.toFixed(2)} to pupil ${pupilId} (${payoutStatus})`);

        // Create auto-payout record for OAuth payments
        if (isAutoTransfer && instructorId) {
          await supabase.from("instructor_payouts").insert({
            instructor_id: instructorId,
            amount: creditAmount,
            payment_ids: [],
            notes: `Auto-paid via Square OAuth — ${paymentId}`,
          });
        }

        // Record commission
        if (feeAmount > 0) {
          await supabase.from("platform_commissions").insert({
            instructor_id: instructorId,
            source_type: "square_checkout",
            source_id: paymentId,
            gross_amount: amountPounds,
            commission_amount: feeAmount,
            commission_rate: commConfig?.rate_percent ? commConfig.rate_percent / 100 : 0.025,
            fixed_fee: commConfig?.fixed_fee_pence ? commConfig.fixed_fee_pence / 100 : 0.20,
            net_amount: creditAmount,
            description: "Admin fee on Square Checkout payment",
          });
          console.log(`Recorded commission: £${feeAmount.toFixed(2)}`);
        }

        // Send receipt email (non-blocking)
        try {
          const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
          await fetch(`${supabaseUrl}/functions/v1/send-payment-receipt`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseAnonKey}`,
            },
            body: JSON.stringify({
              pupilId,
              instructorId,
              amount: creditAmount,
              paymentMethod: "Square Checkout",
              transactionReference: paymentId,
              receiptUrl,
            }),
          });
        } catch (e) {
          console.error("Receipt email error:", e);
        }

        // Notify instructor
        try {
          const { data: pupil } = await supabase
            .from("pupils")
            .select("name")
            .eq("id", pupilId)
            .maybeSingle();

          await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              instructorId,
              notification: {
                title: "💰 Payment Received",
                body: `£${creditAmount.toFixed(2)} received from ${pupil?.name || "a pupil"} via Square Checkout`,
                tag: `payment-received-${Date.now()}`,
                data: { type: "payment_received", pupilId, amount: creditAmount },
              },
            }),
          });
        } catch (e) {
          console.error("Instructor notification error:", e);
        }
        // Notify parent of payment (if linked)
        try {
          await fetch(`${supabaseUrl}/functions/v1/notify-parent`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              pupilId,
              type: "payment_received",
              body: `£${creditAmount.toFixed(2)} payment confirmed via Square Checkout.`,
            }),
          });
          console.log("Parent payment notification triggered");
        } catch (parentError) {
          console.error("Parent notification error:", parentError);
        }

        break;
      }

      case "subscription.created":
      case "subscription.updated": {
        const subscriptionId = data?.subscription?.id;
        const status = data?.subscription?.status?.toLowerCase();
        const customerId = data?.subscription?.customer_id;

        if (!subscriptionId) break;

        console.log(`Updating subscription ${subscriptionId} to status: ${status}`);

        // Find instructor by Square customer ID
        const { data: sub, error: findError } = await supabase
          .from("instructor_subscriptions")
          .select("id, instructor_id")
          .eq("square_customer_id", customerId)
          .maybeSingle();

        if (findError || !sub) {
          console.log("Subscription not found for customer:", customerId);
          break;
        }

        // Update subscription status
        const { error: updateError } = await supabase
          .from("instructor_subscriptions")
          .update({
            status: status === "active" ? "active" : status === "canceled" ? "canceled" : "pending",
            square_subscription_id: subscriptionId,
          })
          .eq("id", sub.id);

        if (updateError) {
          console.error("Error updating subscription:", updateError);
        }
        break;
      }

      case "invoice.payment_made": {
        const invoice = data?.invoice;
        const subscriptionId = invoice?.subscription_id;
        const customerId = invoice?.primary_recipient?.customer_id;

        if (!subscriptionId) break;

        console.log(`Payment made for subscription: ${subscriptionId}`);

        // Find and update subscription
        const { data: sub } = await supabase
          .from("instructor_subscriptions")
          .select("id")
          .eq("square_subscription_id", subscriptionId)
          .maybeSingle();

        if (sub) {
          // Extend subscription period by 30 days
          await supabase
            .from("instructor_subscriptions")
            .update({
              status: "active",
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            })
            .eq("id", sub.id);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = data?.invoice;
        const subscriptionId = invoice?.subscription_id;

        if (!subscriptionId) break;

        console.log(`Payment failed for subscription: ${subscriptionId}`);

        // Find and update subscription
        const { data: sub } = await supabase
          .from("instructor_subscriptions")
          .select("id")
          .eq("square_subscription_id", subscriptionId)
          .maybeSingle();

        if (sub) {
          await supabase
            .from("instructor_subscriptions")
            .update({
              status: "past_due",
            })
            .eq("id", sub.id);
        }
        break;
      }

      case "subscription.canceled": {
        const subscriptionId = data?.subscription?.id;

        if (!subscriptionId) break;

        console.log(`Subscription canceled: ${subscriptionId}`);

        await supabase
          .from("instructor_subscriptions")
          .update({ status: "canceled" })
          .eq("square_subscription_id", subscriptionId);
        break;
      }

      case "customer.card.updated":
      case "customer.card.created": {
        const card = data?.card || data;
        const customerId = card?.customer_id;
        const cardId = card?.id;

        if (!customerId || !cardId) break;

        console.log(`Card updated for customer: ${customerId}`);

        await supabase
          .from("instructor_subscriptions")
          .update({ square_card_id: cardId })
          .eq("square_customer_id", customerId);
        break;
      }

      // ---------- PAYOUT RECONCILIATION ----------
      case "payout.sent":
      case "payout.paid": {
        const payout = data?.payout || data;
        const payoutId: string | undefined = payout?.id;
        const status: string = (payout?.status || "").toUpperCase();
        const locationId: string | undefined = payout?.location_id;
        const amountMoney = payout?.amount_money;
        const amountPounds = amountMoney ? (amountMoney.amount || 0) / 100 : 0;
        // Square sends `sent_at` / `arrival_date` / `created_at` depending on event
        const arrivedAt = payout?.arrival_date || payout?.sent_at || payout?.created_at || new Date().toISOString();

        if (!payoutId) {
          console.log("payout event: missing payout id");
          break;
        }

        // Find instructor by Square location id (OAuth installs)
        let instructorId: string | null = null;
        if (locationId) {
          const { data: link } = await supabase
            .from("instructor_square_oauth")
            .select("instructor_id")
            .eq("merchant_location_id", locationId)
            .maybeSingle();
          instructorId = link?.instructor_id || null;
        }

        // Build the update query: mark pending Square card payments as transferred.
        // Scoped to the instructor when we can resolve one; otherwise platform-wide pending.
        let q = supabase
          .from("payment_history")
          .update({
            payout_status: "transferred",
            transferred_at: arrivedAt,
          })
          .eq("payout_status", "pending")
          .in("payment_method", ["square_checkout", "Square", "square_wallet"]);

        if (instructorId) q = q.eq("instructor_id", instructorId);

        const { data: updated, error: upErr } = await q.select("id, amount, instructor_id");
        if (upErr) console.error("Payout reconcile update failed:", upErr);

        const txCount = updated?.length || 0;
        const txTotal = (updated || []).reduce((s: number, r: any) => s + Number(r.amount || 0), 0);
        console.log(`Payout ${payoutId} (${status}) reconciled: ${txCount} payments → £${txTotal.toFixed(2)} (Square reports £${amountPounds.toFixed(2)})`);

        if (instructorId && txCount > 0 && status === "PAID") {
          await supabase.from("instructor_payouts").insert({
            instructor_id: instructorId,
            amount: txTotal,
            payment_ids: (updated || []).map((r: any) => r.id),
            notes: `Square payout ${payoutId} arrived ${arrivedAt}`,
          });
        }
        break;
      }

      // ---------- REFUNDS ----------
      case "refund.created":
      case "refund.updated": {
        const refund = data?.refund || data;
        const refundId: string | undefined = refund?.id;
        const refundStatus: string = (refund?.status || "").toUpperCase();
        const originalPaymentId: string | undefined = refund?.payment_id;
        const refundAmount = refund?.amount_money?.amount ? refund.amount_money.amount / 100 : 0;

        if (!refundId || !originalPaymentId || refundAmount <= 0) {
          console.log("refund event: missing fields", { refundId, originalPaymentId, refundAmount });
          break;
        }
        // Only act on completed/approved refunds
        if (!["COMPLETED", "APPROVED"].includes(refundStatus)) {
          console.log(`Skipping refund ${refundId} with status ${refundStatus}`);
          break;
        }

        // Idempotency: skip if we already recorded this refund
        const { data: existing } = await supabase
          .from("payment_history")
          .select("id")
          .ilike("notes", `%Refund ${refundId}%`)
          .limit(1)
          .maybeSingle();
        if (existing) {
          console.log(`Refund ${refundId} already recorded, skipping`);
          break;
        }

        // Find the original payment_history row via the Square payment id stored in notes
        const { data: original } = await supabase
          .from("payment_history")
          .select("id, instructor_id, pupil_id, amount")
          .ilike("notes", `%${originalPaymentId}%`)
          .order("recorded_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!original) {
          console.warn(`Refund ${refundId}: no matching payment for ${originalPaymentId}`);
          break;
        }

        const fullRefund = Math.abs(Number(original.amount || 0) - refundAmount) < 0.01;

        // Insert a negative payment_history row tagged with refund id
        const { error: insErr } = await supabase.from("payment_history").insert({
          instructor_id: original.instructor_id,
          pupil_id: original.pupil_id,
          amount: -Math.abs(refundAmount),
          payment_method: "Square Refund",
          payout_status: "refunded",
          notes: `Refund ${refundId} for payment ${originalPaymentId}${fullRefund ? " (full)" : " (partial)"}`,
        });
        if (insErr) console.error("Refund insert failed:", insErr);

        // Decrement pupil balance
        await supabase.rpc("increment_pupil_balance", {
          p_pupil_id: original.pupil_id,
          p_amount: -Math.abs(refundAmount),
        });

        // Mark original as refunded (or partially refunded)
        await supabase
          .from("payment_history")
          .update({ payout_status: fullRefund ? "refunded" : "partially_refunded" })
          .eq("id", original.id);

        // Notify instructor
        try {
          await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${supabaseServiceKey}` },
            body: JSON.stringify({
              instructorId: original.instructor_id,
              notification: {
                title: "↩️ Refund processed",
                body: `£${refundAmount.toFixed(2)} refunded to pupil${fullRefund ? "" : " (partial)"}`,
                tag: `refund-${refundId}`,
                data: { type: "refund", pupilId: original.pupil_id, amount: refundAmount },
              },
            }),
          });
        } catch (e) {
          console.error("Refund notification error:", e);
        }

        console.log(`Refund ${refundId} processed: -£${refundAmount.toFixed(2)} for pupil ${original.pupil_id}`);
        break;
      }

      default:
        console.log("Unhandled event type:", eventType);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: "Webhook processing failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
