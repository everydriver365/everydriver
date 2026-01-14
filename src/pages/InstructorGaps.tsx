import { GapsFiller } from "@/components/instructor/GapsFiller";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { MapPin } from "lucide-react";

export default function InstructorGaps() {
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
          <MapPin className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Fill Gaps</h1>
        </div>

        <GapsFiller instructorId={instructorId} />
      </div>
    </InstructorPortalLayout>
  );
}
