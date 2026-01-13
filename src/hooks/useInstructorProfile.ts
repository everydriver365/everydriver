import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface InstructorProfile {
  name: string;
  profile_image_url: string | null;
  hourly_rate: number | null;
}

export function useInstructorProfile(instructorId: string) {
  const [profile, setProfile] = useState<InstructorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("instructors")
          .select("name, profile_image_url, hourly_rate")
          .eq("id", instructorId)
          .single();

        if (error) throw error;
        setProfile(data);
      } catch (error) {
        console.error("Error fetching instructor profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [instructorId]);

  return { profile, loading };
}
