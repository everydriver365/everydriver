import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { InstructorPageHeader } from "@/components/instructor/InstructorPageHeader";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { WeeklyReportCard } from "@/components/instructor/WeeklyReportCard";
import { BarChart3 } from "lucide-react";

export default function WeeklyReportPage() {
  const { instructor } = useInstructorAuth();

  return (
    <InstructorPortalLayout>
      <div className="space-y-4 max-w-lg mx-auto">
        <InstructorPageHeader lucideIcon={BarChart3} title="Weekly Report" />
        <WeeklyReportCard instructorId={instructor?.id} />
      </div>
    </InstructorPortalLayout>
  );
}
