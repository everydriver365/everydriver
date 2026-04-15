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
        {/* Hero Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 p-5 text-white shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="relative z-10 flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-[10px] backdrop-blur-md">
              <Receipt className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-[17px] font-semibold tracking-[-0.02em]">Expenses</h1>
              <p className="text-[13px] text-white/60">Track expenses for Xero sync</p>
            </div>
          </div>
        </div>
        <ExpenseTracker instructorId={instructorId} />
      </IOSPageWrapper>
    </InstructorPortalLayout>
  );
}
