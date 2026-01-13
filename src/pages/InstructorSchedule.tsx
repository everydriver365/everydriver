import { Calendar } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { InstructorBottomNav } from "@/components/instructor/InstructorBottomNav";
import { InstructorMobileHeader } from "@/components/instructor/InstructorMobileHeader";
import { NewMobileScheduleView } from "@/components/instructor/NewMobileScheduleView";
import { useIsMobile } from "@/hooks/use-mobile";
import { useInstructorProfile } from "@/hooks/useInstructorProfile";

const MOCK_INSTRUCTOR_ID = "b7987d5e-348f-4047-a8d4-ee71fab1f01d";

export default function InstructorSchedule() {
  const isMobile = useIsMobile();
  const { profile } = useInstructorProfile(MOCK_INSTRUCTOR_ID);

  const content = (
    <div className="px-3 md:container py-4 pb-24 space-y-4">
      <div className="flex items-center gap-2">
        <Calendar className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">Schedule</h1>
      </div>

      <NewMobileScheduleView instructorId={MOCK_INSTRUCTOR_ID} />
    </div>
  );

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <InstructorMobileHeader 
          instructorName={profile?.name}
          profileImageUrl={profile?.profile_image_url}
        />
        {content}
        <InstructorBottomNav />
      </div>
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
