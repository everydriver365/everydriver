import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { InstructorInbox } from "@/components/instructor/InstructorInbox";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { MessagesSkeleton } from "@/components/ui/skeletons/MessagesSkeleton";

export default function InstructorMessages() {
  const { instructor, loading } = useInstructorAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !instructor) {
      navigate("/instructor-app/login");
    }
  }, [instructor, loading, navigate]);

  if (loading) {
    return (
      <InstructorPortalLayout>
        <MessagesSkeleton />
      </InstructorPortalLayout>
    );
  }

  if (!instructor) return null;

  return (
    <InstructorPortalLayout>
      <InstructorInbox instructorId={instructor.id} />
    </InstructorPortalLayout>
  );
}
