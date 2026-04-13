import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SchoolRecord {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  brand_colour: string | null;
  custom_domain: string | null;
  description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  owner_user_id: string;
  notification_preferences: Record<string, boolean> | null;
  created_at: string;
  updated_at: string;
}

export function useSchoolData() {
  const [school, setSchool] = useState<SchoolRecord | null>(null);
  const [instructorIds, setInstructorIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchool = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: schoolData } = await supabase
      .from("schools")
      .select("*")
      .eq("owner_user_id", user.id)
      .single() as any;

    if (!schoolData) { setLoading(false); return; }
    setSchool(schoolData as SchoolRecord);

    const { data: members } = await supabase
      .from("school_instructors")
      .select("instructor_id")
      .eq("school_id", schoolData.id) as any;

    setInstructorIds((members || []).map((m: any) => m.instructor_id));
    setLoading(false);
  };

  useEffect(() => { fetchSchool(); }, []);

  return { school, instructorIds, loading, refetch: fetchSchool };
}
