import { Calendar } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { InstructorBottomNav } from "@/components/instructor/InstructorBottomNav";
import { NewMobileScheduleView } from "@/components/instructor/NewMobileScheduleView";
import { useIsMobile } from "@/hooks/use-mobile";

const MOCK_INSTRUCTOR_ID = "b7987d5e-348f-4047-a8d4-ee71fab1f01d";

export default function InstructorSchedule() {
  const isMobile = useIsMobile();

  const content = (
    <div className="px-3 md:container py-4 pb-24 space-y-4">
      <div className="flex items-center gap-2">
        <Calendar className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">Schedule</h1>
      </div>

      <NewMobileScheduleView instructorId={MOCK_INSTRUCTOR_ID} />
    </div>
  );

  // Mobile Layout - No header
  if (isMobile) {
    return (
      <>
        {content}
        <InstructorBottomNav />
      </>
    );
  }

  // Desktop Layout
  return (
    <MainLayout>
      {content}
      <InstructorBottomNav />
    </MainLayout>
  );
}
