import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { PageSkeleton } from "@/components/ui/skeletons/PageSkeleton";
import { AdminChatWindow } from "@/components/instructor/AdminChatWindow";
import { useInstructorAuth } from "@/context/InstructorAuthContext";

export default function InstructorAdminChat() {
  const { instructor, loading } = useInstructorAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !instructor) {
      navigate("/instructor-app/login");
    }
  }, [instructor, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <PageSkeleton />
      </div>
    );
  }

  if (!instructor) return null;

  return (
    <InstructorPortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Contact Admin</h1>
          <p className="text-muted-foreground">Send a message to the EveryDriver support team</p>
        </div>
        <AdminChatWindow instructorId={instructor.id} />
      </div>
    </InstructorPortalLayout>
  );
}
