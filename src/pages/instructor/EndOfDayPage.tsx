import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { InstructorPageHeader } from "@/components/instructor/InstructorPageHeader";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { EndOfDaySummary } from "@/components/instructor/EndOfDaySummary";
import { Coffee } from "lucide-react";

export default function EndOfDayPage() {
  const { instructor } = useInstructorAuth();

  return (
    <InstructorPortalLayout>
      <div className="space-y-4">
        <InstructorPageHeader lucideIcon={Coffee} title="End of Day" />
        <EndOfDaySummary instructorId={instructor?.id} />
      </div>
    </InstructorPortalLayout>
  );
}
