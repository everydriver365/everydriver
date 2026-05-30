import { supabase } from "@/integrations/supabase/client";

export type CourseActivityAction =
  | "field_edited"
  | "refund_issued"
  | "course_duplicated"
  | "reminder_sent"
  | "lesson_added"
  | "lesson_cancelled";

export async function logCourseActivity(params: {
  pupilId: string;
  instructorId: string;
  action: CourseActivityAction;
  details?: Record<string, unknown>;
}) {
  try {
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes.user;
    let actorName: string | null = null;
    if (user) {
      const { data: inst } = await supabase
        .from("instructors")
        .select("name")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      actorName = inst?.name ?? user.email ?? null;
    }
    await supabase.from("course_activity_log").insert({
      pupil_id: params.pupilId,
      instructor_id: params.instructorId,
      actor_user_id: user?.id ?? null,
      actor_name: actorName,
      action: params.action,
      details: (params.details ?? {}) as never,
    });
  } catch (err) {
    console.error("[courseActivityLog] failed to log activity:", err);
  }
}
