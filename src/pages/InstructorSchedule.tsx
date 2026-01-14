import { Calendar } from "lucide-react";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { NewMobileScheduleView } from "@/components/instructor/NewMobileScheduleView";
import { useInstructorAuth } from "@/context/InstructorAuthContext";

export default function InstructorSchedule() {
  const { instructor } = useInstructorAuth();
  const instructorId = instructor?.id;

  if (!instructorId) {
    return (
      <InstructorPortalLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </InstructorPortalLayout>
    );
  }

  return (
    <InstructorPortalLayout>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Schedule</h1>
        </div>

        <NewMobileScheduleView instructorId={instructorId} />
      </div>
    </InstructorPortalLayout>
  );
}
