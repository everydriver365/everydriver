import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, getDay, isAfter, parseISO, startOfDay, addDays, isBefore } from "date-fns";

interface Instructor {
  id: string;
  name: string;
  profile_image_url: string | null;
  car_type: string;
  car_make: string | null;
  car_model: string | null;
  home_postcode: string;
  home_address: string | null;
  hourly_rate: number | null;
  bio: string | null;
  brand_colour: string | null;
  available_from: string | null;
}

interface InstructorCourse {
  instructor_id: string;
  course_hours: number;
  is_active: boolean;
  course_image_url: string | null;
  discounted_price: number | null;
  custom_features: string[] | null;
}

interface CourseTemplate {
  course_hours: number;
  default_image_url: string | null;
  is_popular: boolean | null;
  features: string[] | null;
  is_intensive: boolean | null;
}

interface WorkingHours {
  instructor_id: string;
  day_of_week: number;
  is_active: boolean;
}

interface DateOverride {
  instructor_id: string;
  override_date: string;
  override_end_date: string | null;
  is_available: boolean;
}

export interface FeaturedCourse {
  instructor: Instructor;
  hours: number;
  bookableDate: Date;
  courseImageUrl: string | null;
  isPopular: boolean;
  availableFrom: string | null;
  features: string[] | null;
  isIntensive: boolean;
  discountedPrice: number | null;
  customFeatures: string[] | null;
}

const DISPLAY_HOURS = [10, 20, 30, 40, 28];

export function useFeaturedCourses(limit: number = 3, instructorId?: string | null) {
  const [courses, setCourses] = useState<FeaturedCourse[]>([]);
  const [loading, setLoading] = useState(true);

  const findFirstAvailableDate = useCallback((
    instructor: Instructor,
    workingHours: WorkingHours[],
    dateOverrides: DateOverride[]
  ): Date | null => {
    const today = startOfDay(new Date());
    const searchDays = 90; // Look ahead 90 days

    for (let i = 0; i < searchDays; i++) {
      const day = addDays(today, i);
      
      // Check available_from restriction
      if (instructor.available_from && isAfter(parseISO(instructor.available_from), day)) {
        continue;
      }

      const dayOfWeek = getDay(day);
      const dateStr = format(day, "yyyy-MM-dd");

      // Check date overrides first
      const override = dateOverrides.find(
        (o) =>
          o.instructor_id === instructor.id &&
          (o.override_date === dateStr ||
            (o.override_end_date &&
              dateStr >= o.override_date &&
              dateStr <= o.override_end_date))
      );
      
      if (override) {
        if (override.is_available) return day;
        continue;
      }

      // Check working hours
      const hasWorkingHours = workingHours.some(
        (wh) =>
          wh.instructor_id === instructor.id &&
          wh.day_of_week === dayOfWeek &&
          wh.is_active
      );

      if (hasWorkingHours) return day;
    }

    return null;
  }, []);

  useEffect(() => {
    // Caller passed null = waiting for instructor id to resolve; skip until ready
    if (instructorId === null) {
      setLoading(true);
      return;
    }

    async function fetchFeaturedCourses() {
      try {
        setLoading(true);

        let instructorsQuery = supabase.from("instructors").select("*").eq("is_active", true);
        let coursesQuery = supabase.from("instructor_courses").select("*").eq("is_active", true);
        let workingHoursQuery = supabase.from("instructor_working_hours").select("*").eq("is_active", true);
        let overridesQuery = supabase.from("instructor_date_overrides").select("*");

        if (instructorId) {
          instructorsQuery = instructorsQuery.eq("id", instructorId);
          coursesQuery = coursesQuery.eq("instructor_id", instructorId);
          workingHoursQuery = workingHoursQuery.eq("instructor_id", instructorId);
          overridesQuery = overridesQuery.eq("instructor_id", instructorId);
        }

        const [
          { data: instructorsData },
          { data: coursesData },
          { data: templatesData },
          { data: workingHoursData },
          { data: dateOverridesData }
        ] = await Promise.all([
          instructorsQuery,
          coursesQuery,
          supabase.from("course_templates").select("*").eq("is_active", true),
          workingHoursQuery,
          overridesQuery,
        ]);

        const instructors = (instructorsData || []) as Instructor[];
        const instructorCourses = (coursesData || []) as InstructorCourse[];
        const courseTemplates = (templatesData || []) as CourseTemplate[];
        const workingHours = (workingHoursData || []) as WorkingHours[];
        const dateOverrides = (dateOverridesData || []) as DateOverride[];

        // Build featured courses list
        const allCourses: FeaturedCourse[] = [];

        for (const instructor of instructors) {
          const availableDate = findFirstAvailableDate(instructor, workingHours, dateOverrides);
          if (!availableDate) continue;

          // Get instructor's courses or use defaults
          const instructorHours = instructorCourses
            .filter((c) => c.instructor_id === instructor.id)
            .map((c) => c.course_hours);

          const hoursToShow = instructorHours.length > 0 
            ? instructorHours.filter((h) => DISPLAY_HOURS.includes(h))
            : DISPLAY_HOURS;

          for (const hours of hoursToShow) {
            const instructorCourse = instructorCourses.find(
              (c) => c.instructor_id === instructor.id && c.course_hours === hours
            );
            const template = courseTemplates.find((t) => t.course_hours === hours);

            allCourses.push({
              instructor,
              hours,
              bookableDate: availableDate,
              courseImageUrl: instructorCourse?.course_image_url || template?.default_image_url || null,
              isPopular: template?.is_popular || false,
              availableFrom: instructor.available_from,
              features: template?.features || null,
              isIntensive: template?.is_intensive || false,
              discountedPrice: instructorCourse?.discounted_price || null,
              customFeatures: instructorCourse?.custom_features || null,
            });
          }
        }

        // Sort by soonest available date
        allCourses.sort((a, b) => a.bookableDate.getTime() - b.bookableDate.getTime());

        // Take only the first N courses
        setCourses(allCourses.slice(0, limit));
      } catch (error) {
        console.error("Error fetching featured courses:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchFeaturedCourses();
  }, [limit, instructorId, findFirstAvailableDate]);

  return { courses, loading };
}
