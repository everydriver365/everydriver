import { ExpenseTracker } from "@/components/instructor/ExpenseTracker";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { InstructorPageHeader } from "@/components/instructor/InstructorPageHeader";
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
      <div className="space-y-4">
        <InstructorPageHeader
          lucideIcon={Receipt}
          title="Expenses"
          subtitle="Track expenses for Xero sync"
        />
        <ExpenseTracker instructorId={instructorId} />
      </div>
    </InstructorPortalLayout>
  );
}
