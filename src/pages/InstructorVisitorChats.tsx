import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { VisitorChatManager } from "@/components/instructor/VisitorChatManager";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function InstructorVisitorChats() {
  const { instructor, loading } = useInstructorAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!instructor) {
    return <Navigate to="/instructor/login" replace />;
  }

  return (
    <InstructorPortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Visitor Chats</h1>
          <p className="text-muted-foreground">
            Respond to visitors from your mini-website in real-time
          </p>
        </div>
        <VisitorChatManager instructorId={instructor.id} />
      </div>
    </InstructorPortalLayout>
  );
}
