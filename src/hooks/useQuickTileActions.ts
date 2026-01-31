import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay, isAfter } from "date-fns";

interface NextPupilInfo {
  pupilId: string;
  pupilName: string;
  pickupLocation: string | null;
  postcode: string | null;
  lessonTime: string;
}

interface LastContactedPupil {
  pupilId: string;
  pupilName: string;
  phone: string | null;
}

interface QuickTileActions {
  nextPupil: NextPupilInfo | null;
  lastContactedPupil: LastContactedPupil | null;
  isLoading: boolean;
}

export function useQuickTileActions(instructorId: string | undefined): QuickTileActions {
  // Fetch next upcoming lesson's pupil for navigation
  const { data: nextPupil, isLoading: loadingNext } = useQuery({
    queryKey: ["next-pupil-for-nav", instructorId],
    queryFn: async (): Promise<NextPupilInfo | null> => {
      if (!instructorId) return null;

      const now = new Date();
      const endOfToday = endOfDay(now).toISOString();

      // Get next upcoming lesson
      const { data: lesson, error } = await supabase
        .from("scheduled_lessons")
        .select(`
          id,
          start_time,
          pickup_location,
          pupils!inner (
            id,
            name,
            postcode,
            address
          )
        `)
        .eq("instructor_id", instructorId)
        .gte("start_time", now.toISOString())
        .lte("start_time", endOfToday)
        .order("start_time", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error || !lesson) return null;

      const pupilData = lesson.pupils as any;
      return {
        pupilId: pupilData.id,
        pupilName: pupilData.name,
        pickupLocation: lesson.pickup_location || pupilData.address,
        postcode: pupilData.postcode,
        lessonTime: lesson.start_time,
      };
    },
    enabled: !!instructorId,
    staleTime: 2 * 60 * 1000,
  });

  // Fetch last contacted pupil for quick messaging
  const { data: lastContactedPupil, isLoading: loadingLast } = useQuery({
    queryKey: ["last-contacted-pupil", instructorId],
    queryFn: async (): Promise<LastContactedPupil | null> => {
      if (!instructorId) return null;

      // Try to get the last conversation
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .select(`
          pupil_id,
          pupils!inner (
            id,
            name,
            phone
          )
        `)
        .eq("instructor_id", instructorId)
        .order("last_message_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (convError || !conversation) {
        // Fallback: get first pupil
        const { data: firstPupil } = await supabase
          .from("pupils")
          .select("id, name, phone")
          .eq("instructor_id", instructorId)
          .limit(1)
          .maybeSingle();

        if (!firstPupil) return null;

        return {
          pupilId: firstPupil.id,
          pupilName: firstPupil.name,
          phone: firstPupil.phone,
        };
      }

      const pupilData = conversation.pupils as any;
      return {
        pupilId: pupilData.id,
        pupilName: pupilData.name,
        phone: pupilData.phone,
      };
    },
    enabled: !!instructorId,
    staleTime: 5 * 60 * 1000,
  });

  return {
    nextPupil: nextPupil || null,
    lastContactedPupil: lastContactedPupil || null,
    isLoading: loadingNext || loadingLast,
  };
}
