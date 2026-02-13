import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function findFirstAvailableDate(
  instructor: any,
  workingHours: any[],
  dateOverrides: any[]
): string | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 90; i++) {
    const day = addDays(today, i);
    const dateStr = formatDate(day);

    if (instructor.available_from && instructor.available_from > dateStr) {
      continue;
    }

    const dayOfWeek = day.getDay();

    const override = dateOverrides.find(
      (o) =>
        o.instructor_id === instructor.id &&
        (o.override_date === dateStr ||
          (o.override_end_date &&
            dateStr >= o.override_date &&
            dateStr <= o.override_end_date))
    );

    if (override) {
      if (override.is_available) return dateStr;
      continue;
    }

    const hasWorkingHours = workingHours.some(
      (wh) =>
        wh.instructor_id === instructor.id &&
        wh.day_of_week === dayOfWeek &&
        wh.is_active
    );

    if (hasWorkingHours) return dateStr;
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
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    // Fetch instructor by slug
    const { data: instructor, error: instrError } = await supabase
      .from("instructors")
      .select("id, name, hourly_rate, car_type, profile_image_url, available_from, brand_colour, app_slug")
      .eq("app_slug", slug)
      .eq("is_active", true)
      .single();

    if (instrError || !instructor) {
      return new Response(
        JSON.stringify({ error: "Instructor not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch courses, templates, working hours, date overrides in parallel
    const [
      { data: coursesData },
      { data: templatesData },
      { data: workingHoursData },
      { data: dateOverridesData },
    ] = await Promise.all([
      supabase
        .from("instructor_courses")
        .select("course_hours, is_active, discounted_price, custom_features")
        .eq("instructor_id", instructor.id)
        .eq("is_active", true),
      supabase
        .from("course_templates")
        .select("course_hours, is_popular, features, is_intensive, course_name")
        .eq("is_active", true),
      supabase
        .from("instructor_working_hours")
        .select("instructor_id, day_of_week, is_active")
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
        name: tmpl?.course_name || `${hours} Hour Course`,
        hours,
        price,
        discountedPrice: ic?.discounted_price || null,
        nextAvailable: nextAvailable || null,
        isPopular: tmpl?.is_popular || false,
        isIntensive: tmpl?.is_intensive || false,
        features: ic?.custom_features || tmpl?.features || [],
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
