import { ExpenseTracker } from "@/components/instructor/ExpenseTracker";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
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
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Receipt className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <h1 className="text-xl font-bold">Expenses</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Track expenses for Xero sync</p>
        </div>

        <ExpenseTracker instructorId={instructorId} />
      </div>
    </InstructorPortalLayout>
  );
}
