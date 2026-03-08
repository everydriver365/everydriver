import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { KanbanBoard } from "@/components/instructor/pipeline/KanbanBoard";
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
      <div className="space-y-4 pb-24">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Briefcase className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Pipeline</h1>
            <p className="text-sm text-muted-foreground">Track leads from enquiry to test pass</p>
          </div>
        </div>
        <KanbanBoard instructorId={instructor.id} />
      </div>
    </InstructorPortalLayout>
  );
}
