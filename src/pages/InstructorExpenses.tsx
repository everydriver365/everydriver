import { ExpenseTracker } from "@/components/instructor/ExpenseTracker";
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
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </InstructorPortalLayout>
    );
  }

  return (
    <InstructorPortalLayout>
      <IOSPageWrapper>
        <IOSPageTitle
          icon={<Receipt className="h-3.5 w-3.5 text-orange-600" />}
          iconBg="bg-orange-500/10"
          title="Expenses"
          subtitle="Track expenses for Xero sync"
        />
        <ExpenseTracker instructorId={instructorId} />
      </IOSPageWrapper>
    </InstructorPortalLayout>
  );
}
