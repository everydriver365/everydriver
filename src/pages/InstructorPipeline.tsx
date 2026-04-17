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
        <IOSPageTitle
          icon={<Briefcase className="h-3.5 w-3.5" style={{ color: "#2A394F" }} />}
          iconBg="bg-[#E8ECF1]"
          title="Pipeline"
          subtitle="Track leads from enquiry to test pass"
        />
        <KanbanBoard instructorId={instructor.id} />
      </IOSPageWrapper>
    </InstructorPortalLayout>
  );
}
