import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  londonTodayStr,
  londonDateStr,
  londonDow,
  londonNowMin,
} from "../_shared/availabilityEngine.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/** Parse "HH:MM[:SS]" → minutes since midnight. */
function hmToMin(s: string): number {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + (m || 0);
}

function findFirstAvailableDate(
  instructor: any,
  workingHours: any[],
  dateOverrides: any[]
): string | null {
  // Anchor the loop to London-today at UTC noon so each `londonDateStr`
  // resolves to the right calendar day under both BST and GMT.
  const [ty, tm, td] = londonTodayStr().split("-").map(Number);
  const today = new Date(Date.UTC(ty, tm - 1, td, 12, 0, 0));

  // Finding 3 — `min_lead_hours` is stored on the instructor (nullable).
  // Today's earliest bookable minute = London-now + lead, in local minutes.
  const minLeadHours = Number.isFinite(instructor.min_lead_hours)
    ? Number(instructor.min_lead_hours)
    : 0;
  const todayCutoffMin = londonNowMin() + Math.max(0, Math.round(minLeadHours * 60));
  const todayStr = londonTodayStr();

  for (let i = 0; i < 90; i++) {
    const day = addDays(today, i);
    const dateStr = londonDateStr(day);

    if (instructor.available_from && instructor.available_from > dateStr) {
      continue;
    }

    const dayOfWeek = londonDow(day);

    const override = dateOverrides.find(
      (o) =>
        o.instructor_id === instructor.id &&
        (o.override_date === dateStr ||
          (o.override_end_date &&
            dateStr >= o.override_date &&
            dateStr <= o.override_end_date))
    );

    if (override) {
      // KNOWN GAP — finding 6, deferred to P3.
      // Partial-day `is_available=true` overrides (start_time/end_time) are
      // not honoured here: this short-circuit returns the date regardless of
      // whether the override window has passed today or excludes the
      // bookable hours. Activates 2026-01-11 (instructor b7987…) and
      // 2026-03-02 (instructor c9843…). Tripwire: if P3 has not shipped
      // by 2026-01-04, extract resolveDayWindows into _shared/ and use it
      // here. See .lovable/plan.md.
      if (override.is_available) {
        if (dateStr !== todayStr) return dateStr;
        // Today: still apply the lead-time cutoff against working-hours
        // end if any are configured for today, otherwise return today.
        const dayWh = workingHours.filter(
          (wh) =>
            wh.instructor_id === instructor.id &&
            wh.day_of_week === dayOfWeek &&
            wh.is_active,
        );
        if (dayWh.length === 0) return dateStr;
        const latestEnd = Math.max(...dayWh.map((wh) => hmToMin(wh.end_time)));
        if (latestEnd > todayCutoffMin) return dateStr;
        continue;
      }
      continue;
    }

    const dayWh = workingHours.filter(
      (wh) =>
        wh.instructor_id === instructor.id &&
        wh.day_of_week === dayOfWeek &&
        wh.is_active,
    );
    if (dayWh.length === 0) continue;

    // Findings 3 & 4 — for today only, the working-day must still have
    // bookable time remaining after London-now + lead. Future days skip
    // this check.
    if (dateStr === todayStr) {
      const latestEnd = Math.max(...dayWh.map((wh) => hmToMin(wh.end_time)));
      if (latestEnd <= todayCutoffMin) continue;
    }

    return dateStr;
  }

  return null;
}

const DISPLAY_HOURS = [10, 20, 30, 40, 28];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get("slug");

    if (!slug) {
      return new Response(
        JSON.stringify({ error: "Missing slug parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!
    );

    // Finding 2 — exclude paused instructors from the public discovery
    // surface. One SQL filter, zero engine logic.
    const { data: instructor, error: instrError } = await supabase
      .from("instructors")
      .select("id, name, hourly_rate, car_type, profile_image_url, available_from, brand_colour, app_slug, min_lead_hours")
      .eq("app_slug", slug)
      .eq("is_active", true)
      .eq("availability_paused", false)
      .single();

    if (instrError || !instructor) {
      return new Response(
        JSON.stringify({ error: "Instructor not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch courses, templates, working hours, date overrides in parallel.
    // Working hours now include start_time/end_time so today's lead-time
    // cutoff (findings 3 & 4) can be evaluated against the latest end.
    const [
      { data: coursesData },
      { data: templatesData },
      { data: workingHoursData },
      { data: dateOverridesData },
    ] = await Promise.all([
      supabase
        .from("instructor_courses")
        .select("course_hours, is_active, discounted_price, custom_features, course_image_url, course_name")
        .eq("instructor_id", instructor.id)
        .eq("is_active", true),
      supabase
        .from("course_templates")
        .select("course_hours, is_popular, features, is_intensive, course_name")
        .eq("is_active", true),
      supabase
        .from("instructor_working_hours")
        .select("instructor_id, day_of_week, is_active, start_time, end_time")
        .eq("instructor_id", instructor.id)
        .eq("is_active", true),
      supabase
        .from("instructor_date_overrides")
        .select("instructor_id, override_date, override_end_date, is_available")
        .eq("instructor_id", instructor.id),
    ]);

    const instructorCourses = coursesData || [];
    const courseTemplates = templatesData || [];
    const workingHours = workingHoursData || [];
    const dateOverrides = dateOverridesData || [];

    const nextAvailable = findFirstAvailableDate(instructor, workingHours, dateOverrides);

    // Determine which hours to show
    const instructorHours = instructorCourses.map((c: any) => c.course_hours);
    const hoursToShow =
      instructorHours.length > 0
        ? instructorHours.filter((h: number) => DISPLAY_HOURS.includes(h))
        : DISPLAY_HOURS;

    const bookingBaseUrl = `https://everydriver.lovable.app/i/${instructor.app_slug}/courses`;

    const courses = hoursToShow.map((hours: number) => {
      const ic = instructorCourses.find((c: any) => c.course_hours === hours);
      const tmpl = courseTemplates.find((t: any) => t.course_hours === hours);
      const price = instructor.hourly_rate ? instructor.hourly_rate * hours : null;

      return {
        name: ic?.course_name || tmpl?.course_name || `${hours} Hour Course`,
        hours,
        price,
        discountedPrice: ic?.discounted_price || null,
        nextAvailable: nextAvailable || null,
        isPopular: tmpl?.is_popular || false,
        isIntensive: tmpl?.is_intensive || false,
        features: ic?.custom_features || tmpl?.features || [],
        courseImageUrl: ic?.course_image_url || tmpl?.default_image_url || null,
        bookingUrl: bookingBaseUrl,
      };
    });

    const response = {
      instructor: {
        name: instructor.name,
        hourlyRate: instructor.hourly_rate,
        carType: instructor.car_type,
        profileImage: instructor.profile_image_url,
        brandColour: instructor.brand_colour,
      },
      courses,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
