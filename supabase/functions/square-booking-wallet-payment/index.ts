import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { format, addDays } from "https://esm.sh/date-fns@3.6.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingSlot {
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
}

interface BookingWalletPaymentRequest {
  token: string;
  amount: number;
  instructorId: string;
  pupilName: string;
  pupilEmail: string;
  pupilPhone: string;
  pupilAddress: string;
  pupilPostcode: string;
  courseType: string;
  courseHours: number;
  totalPrice: number;
  slots: BookingSlot[];
  walletType: "apple" | "google";
  upsells?: { id: string; price: number }[];
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get("SQUARE_ACCESS_TOKEN")?.trim();
    const locationId = Deno.env.get("SQUARE_LOCATION_ID")?.trim();
    const environment = Deno.env.get("SQUARE_ENVIRONMENT")?.trim() || "sandbox";

    if (!accessToken || !locationId) {
      console.error("Missing Square credentials");
      return new Response(
        JSON.stringify({ error: "Payment gateway not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: BookingWalletPaymentRequest = await req.json();
    const {
      token,
      amount,
      instructorId,
      pupilName,
      pupilEmail,
      pupilPhone,
      pupilAddress,
      pupilPostcode,
      courseType,
      courseHours,
      totalPrice,
      slots,
      walletType,
      upsells = [],
    } = body;

    if (!token || !amount || !instructorId || !pupilName || !pupilEmail) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Processing booking wallet payment:", {
      walletType,
      amount,
      instructorId: instructorId.slice(0, 8),
      courseType,
    });

    // Square uses amount in smallest currency unit (pence for GBP)
    const amountInPence = Math.round(amount * 100);
    const ts = Date.now();
    const orderReference = `BOOK-${instructorId.slice(0, 8)}-${ts}`;
    const idempotencyKey = orderReference;

    // Square API base URL
    const env = environment.toLowerCase();
    const isProduction = env === "production" || env === "prod" || env === "live";
    const baseUrl = isProduction
      ? "https://connect.squareup.com"
      : "https://connect.squareupsandbox.com";

    // Create payment using the token
    const paymentPayload = {
      idempotency_key: idempotencyKey,
      source_id: token,
      amount_money: {
        amount: amountInPence,
        currency: "GBP",
      },
      location_id: locationId,
      reference_id: orderReference,
      note: `${courseType} booking for ${pupilName}`,
      buyer_email_address: pupilEmail || undefined,
    };

    console.log("Square payment payload:", JSON.stringify(paymentPayload, null, 2));

    const response = await fetch(`${baseUrl}/v2/payments`, {
      method: "POST",
      headers: {
        "Square-Version": "2024-01-18",
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentPayload),
    });

    const responseText = await response.text();
    console.log("Square API response status:", response.status);
    console.log("Square API response:", responseText);

    if (!response.ok) {
      console.error("Square API error:", responseText);
      const errorData = JSON.parse(responseText);
      const errorMessage = errorData.errors?.[0]?.detail || "Payment failed";
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = JSON.parse(responseText);
    
    if (data.payment?.status !== "COMPLETED") {
      console.error("Payment not completed:", data);
      return new Response(
        JSON.stringify({ error: "Payment was not completed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Payment successful - create the booking
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate balance and due date
    const upsellTotal = upsells.reduce((sum, u) => sum + Number(u.price), 0);
    const totalWithUpsells = totalPrice + upsellTotal;
    const amountPaid = amount;
    const remainingBalance = totalWithUpsells - amountPaid;
    
    // Balance due 30 days before first lesson (or now if no slots)
    let balanceDueDate = null;
    if (slots.length > 0 && remainingBalance > 0) {
      const firstLessonDate = new Date(slots[0].date);
      balanceDueDate = format(addDays(firstLessonDate, -30), "yyyy-MM-dd");
    }

    // Create pupil record
    const { data: pupil, error: pupilError } = await supabase
      .from("pupils")
      .insert({
        instructor_id: instructorId,
        name: pupilName,
        email: pupilEmail,
        phone: pupilPhone,
        address: pupilAddress,
        postcode: pupilPostcode.toUpperCase(),
        course_type: courseType,
        course_hours: courseHours,
        total_cost: totalWithUpsells,
        account_balance: -remainingBalance, // Negative = owes money
        payment_type: "full",
        deposit_paid: amountPaid,
        balance_due_date: balanceDueDate,
        status: "active",
      })
      .select("id")
      .single();

    if (pupilError) {
      console.error("Failed to create pupil:", pupilError);
      return new Response(
        JSON.stringify({ error: "Booking creation failed", details: pupilError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const pupilId = pupil.id;
    console.log("Pupil created:", pupilId);

    // Create scheduled lessons
    if (slots.length > 0) {
      const lessonsToInsert = slots.map((slot) => ({
        instructor_id: instructorId,
        pupil_id: pupilId,
        lesson_date: slot.date,
        start_time: slot.startTime,
        end_time: slot.endTime,
        duration: slot.duration,
        status: "scheduled",
      }));

      const { error: lessonsError } = await supabase
        .from("scheduled_lessons")
        .insert(lessonsToInsert);

      if (lessonsError) {
        console.error("Failed to create lessons:", lessonsError);
        // Don't fail the whole request - pupil is created
      } else {
        // Update next_lesson on pupil
        await supabase
          .from("pupils")
          .update({ next_lesson: `${slots[0].date} ${slots[0].startTime}` })
          .eq("id", pupilId);
      }
    }

    // Record upsells
    if (upsells.length > 0) {
      const upsellInserts = upsells.map((u) => ({
        pupil_id: pupilId,
        upsell_id: u.id,
        price_paid: u.price,
      }));

      await supabase.from("pupil_upsells").insert(upsellInserts);
    }

    // Record payment in payment_history
    await supabase.from("payment_history").insert({
      pupil_id: pupilId,
      instructor_id: instructorId,
      amount: amountPaid,
      payment_type: "payment",
      payment_method: walletType === "apple" ? "Apple Pay" : "Google Pay",
      description: `${courseType} booking via ${walletType === "apple" ? "Apple Pay" : "Google Pay"}`,
      transaction_reference: orderReference,
    });

    // Send notifications (non-blocking)
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Notify instructor with all lessons
    const sortedSlots = [...slots].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const allLessons = sortedSlots.map((s) => ({
      date: s.date,
      time: s.startTime,
      durationMinutes: s.duration,
    }));
    fetch(`${supabaseUrl}/functions/v1/notify-instructor`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        instructorId,
        type: "new_booking",
        pupilName,
        lessonDate: sortedSlots[0]?.date,
        lessonTime: sortedSlots[0]?.startTime,
        durationMinutes: sortedSlots[0]?.duration,
        allLessons,
      }),
    }).catch(console.error);

    // Send pupil welcome email with all lessons
    fetch(`${supabaseUrl}/functions/v1/send-pupil-welcome`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        pupilId,
        pupilName,
        pupilEmail,
        pupilPhone,
        instructorId,
        courseType,
        courseHours,
        firstLessonDate: sortedSlots[0]?.date || null,
        firstLessonTime: sortedSlots[0]?.startTime || null,
        pickupAddress: pupilAddress,
        allLessons,
      }),
    }).catch(console.error);

    // Flush calendar sync queue immediately (same pattern as create-booking)
    try {
      await fetch(`${supabaseUrl}/functions/v1/process-calendar-queue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({}),
      });
      console.log("Calendar queue flushed");
    } catch (calendarError) {
      console.error("Calendar sync error (non-fatal):", calendarError);
    }

    // Notify parent of booking (if linked)
    try {
      await fetch(`${supabaseUrl}/functions/v1/notify-parent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          pupilId,
          type: "booking_confirmed",
          body: `A ${courseType} course has been booked for ${pupilName}.${slots.length > 0 ? ` ${slots.length} lessons scheduled.` : ''}`,
        }),
      });
      console.log("Parent booking notification triggered");
    } catch (parentError) {
      console.error("Parent notification error (non-fatal):", parentError);
    }

    console.log("Booking completed successfully:", pupilId);

    return new Response(
      JSON.stringify({
        success: true,
        pupilId,
        paymentId: data.payment.id,
        receiptUrl: data.payment.receipt_url,
        lessonsCreated: slots.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Square booking wallet payment error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Failed to process payment", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
