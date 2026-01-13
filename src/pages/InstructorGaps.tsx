import { GapsFiller } from "@/components/instructor/GapsFiller";
import { InstructorBottomNav } from "@/components/instructor/InstructorBottomNav";
import { InstructorMobileHeader } from "@/components/instructor/InstructorMobileHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { useInstructorProfile } from "@/hooks/useInstructorProfile";

const MOCK_INSTRUCTOR_ID = "550e8400-e29b-41d4-a716-446655440000";

export default function InstructorGaps() {
  const isMobile = useIsMobile();
  const { profile } = useInstructorProfile(MOCK_INSTRUCTOR_ID);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <InstructorMobileHeader 
        instructorName={profile?.name}
        profileImageUrl={profile?.profile_image_url}
      />

      {/* Content */}
      <div className="p-4">
        <GapsFiller instructorId={MOCK_INSTRUCTOR_ID} />
      </div>

      {isMobile && <InstructorBottomNav />}
    </div>
  );
}