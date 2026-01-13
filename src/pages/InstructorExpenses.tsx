import { ExpenseTracker } from "@/components/instructor/ExpenseTracker";
import { InstructorBottomNav } from "@/components/instructor/InstructorBottomNav";
import { InstructorMobileHeader } from "@/components/instructor/InstructorMobileHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { useInstructorProfile } from "@/hooks/useInstructorProfile";

const MOCK_INSTRUCTOR_ID = "550e8400-e29b-41d4-a716-446655440000";

export default function InstructorExpenses() {
  const isMobile = useIsMobile();
  const { profile } = useInstructorProfile(MOCK_INSTRUCTOR_ID);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <InstructorMobileHeader 
        instructorName={profile?.name}
        profileImageUrl={profile?.profile_image_url}
      />

      {/* Page Title */}
      <div className="px-4 py-4 border-b border-border">
        <h1 className="text-xl font-bold text-foreground">Expenses</h1>
        <p className="text-sm text-muted-foreground">Track expenses for Xero sync</p>
      </div>

      {/* Content */}
      <div className="p-4">
        <ExpenseTracker instructorId={MOCK_INSTRUCTOR_ID} />
      </div>

      {isMobile && <InstructorBottomNav />}
    </div>
  );
}