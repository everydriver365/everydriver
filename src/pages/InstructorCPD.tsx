import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { InstructorPageHeader } from "@/components/instructor/InstructorPageHeader";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { CPDLogManager } from "@/components/instructor/CPDLogManager";
import { BookOpen } from "lucide-react";

export default function InstructorCPD() {
  const { instructor, refreshInstructor } = useInstructorAuth();

  if (!instructor) {
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
      <div className="space-y-4 max-w-lg mx-auto">
        <InstructorPageHeader lucideIcon={BookOpen} title="CPD Log" />
        <CPDLogManager
          instructorId={instructor.id}
          onUpdate={refreshInstructor}
        />
      </div>
    </InstructorPortalLayout>
  );
}
