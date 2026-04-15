import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { KanbanBoard } from "@/components/instructor/pipeline/KanbanBoard";
import { IOSPageWrapper, IOSPageTitle } from "@/components/instructor/IOSPageWrapper";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { Navigate } from "react-router-dom";
import { Loader2, Briefcase } from "lucide-react";

export default function InstructorPipeline() {
  const { instructor, loading } = useInstructorAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!instructor) return <Navigate to="/instructor/login" replace />;

  return (
    <InstructorPortalLayout>
      <IOSPageWrapper>
        {/* Hero Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-indigo-700 p-5 text-white shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="relative z-10 flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-[10px] backdrop-blur-md">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-[17px] font-semibold tracking-[-0.02em]">Pipeline</h1>
              <p className="text-[13px] text-white/60">Track leads from enquiry to test pass</p>
            </div>
          </div>
        </div>
        <KanbanBoard instructorId={instructor.id} />
      </IOSPageWrapper>
    </InstructorPortalLayout>
  );
}
