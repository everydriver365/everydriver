import { supabase } from "@/integrations/supabase/client";
import { format, getDay } from "date-fns";

interface WaitlistEntry {
  id: string;
  pupil_id: string;
  preferred_days: string[];
  preferred_times: string[];
  min_duration_mins: number;
  max_duration_mins: number;
  pupil: {
    id: string;
    name: string;
    phone: string | null;
  };
}

const DAY_MAP: Record<number, string> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};

const getTimeSlot = (time: string): string => {
  const hour = parseInt(time.split(":")[0]);
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
};

export async function findMatchingWaitlistPupils(
  instructorId: string,
  lessonDate: Date,
  startTime: string,
  endTime: string,
  durationMins: number
): Promise<WaitlistEntry[]> {
  // Get the day of week
  const dayOfWeek = DAY_MAP[getDay(lessonDate)];
  const timeSlot = getTimeSlot(startTime);

  // Fetch active waitlist entries for this instructor
  const { data: waitlistEntries, error } = await supabase
    .from("lesson_waitlist")
    .select(`
      *,
      pupil:pupils(id, name, phone)
    `)
    .eq("instructor_id", instructorId)
    .eq("is_active", true);

  if (error) {
    console.error("Error fetching waitlist:", error);
    return [];
  }

  // Filter entries that match the slot criteria
  const matchingEntries = (waitlistEntries || []).filter((entry) => {
    // Check if day matches
    const dayMatches =
      entry.preferred_days.length === 0 || entry.preferred_days.includes(dayOfWeek);

    // Check if time slot matches
    const timeMatches =
      entry.preferred_times.length === 0 || entry.preferred_times.includes(timeSlot);

    // Check if duration is within range
    const durationMatches =
      durationMins >= entry.min_duration_mins && durationMins <= entry.max_duration_mins;

    return dayMatches && timeMatches && durationMatches;
  });

  return matchingEntries as WaitlistEntry[];
}

export async function createSlotOffers(
  instructorId: string,
  lessonDate: Date,
  startTime: string,
  endTime: string,
  durationMins: number,
  originalLessonId?: string
): Promise<{ created: number; pupils: string[] }> {
  const matchingPupils = await findMatchingWaitlistPupils(
    instructorId,
    lessonDate,
    startTime,
    endTime,
    durationMins
  );

  if (matchingPupils.length === 0) {
    return { created: 0, pupils: [] };
  }

  // Create slot offers for each matching pupil (not yet approved)
  const offers = matchingPupils.map((entry) => ({
    instructor_id: instructorId,
    pupil_id: entry.pupil_id,
    original_lesson_id: originalLessonId || null,
    lesson_date: format(lessonDate, "yyyy-MM-dd"),
    start_time: startTime,
    end_time: endTime,
    duration_mins: durationMins,
    instructor_approved: false,
    pupil_response: "pending",
  }));

  const { error } = await supabase.from("slot_offers").insert(offers);

  if (error) {
    console.error("Error creating slot offers:", error);
    return { created: 0, pupils: [] };
  }

  return {
    created: matchingPupils.length,
    pupils: matchingPupils.map((p) => p.pupil?.name || "Unknown"),
  };
}
