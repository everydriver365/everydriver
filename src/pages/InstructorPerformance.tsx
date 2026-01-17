import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp } from "lucide-react";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { PerformanceDashboard } from "@/components/instructor/PerformanceDashboard";
import { useInstructorAuth } from "@/context/InstructorAuthContext";

export default function InstructorPerformance() {
  const { instructor, loading, user } = useInstructorAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/instructor-app/login");
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <InstructorPortalLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </InstructorPortalLayout>
    );
  }

  if (!instructor?.id) {
    return null;
  }

  return (
    <InstructorPortalLayout>
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold">Performance</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Track your business metrics and pupil success
          </p>
        </div>

        <PerformanceDashboard instructorId={instructor.id} />
      </div>
    </InstructorPortalLayout>
  );
}
