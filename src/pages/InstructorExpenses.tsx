import { ExpenseTracker } from "@/components/instructor/ExpenseTracker";
import { PageSkeleton } from "@/components/ui/skeletons/PageSkeleton";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { IOSPageWrapper, IOSPageTitle } from "@/components/instructor/IOSPageWrapper";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { Receipt } from "lucide-react";

export default function InstructorExpenses() {
  const { instructor } = useInstructorAuth();
  const instructorId = instructor?.id;

  if (!instructorId) {
    return (
      <InstructorPortalLayout>
        <PageSkeleton />
      </InstructorPortalLayout>
    );
  }

  return (
    <InstructorPortalLayout>
      <IOSPageWrapper>
        <IOSPageTitle
          icon={<Receipt className="h-3.5 w-3.5" style={{ color: "#2A394F" }} />}
          iconBg="bg-[#E8ECF1]"
          title="Expenses"
          subtitle="Track expenses for Xero sync"
        />
        <ExpenseTracker instructorId={instructorId} />
      </IOSPageWrapper>
    </InstructorPortalLayout>
  );
}
