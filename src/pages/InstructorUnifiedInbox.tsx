import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { InstructorInbox } from "@/components/instructor/InstructorInbox";
import { VisitorChatManager } from "@/components/instructor/VisitorChatManager";
import { AdminChatWindow } from "@/components/instructor/AdminChatWindow";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { MessageNotificationBadge } from "@/components/instructor/MessageNotificationBadge";
import { VisitorChatBadge } from "@/components/instructor/VisitorChatBadge";
import { AdminMessageBadge } from "@/components/instructor/AdminMessageBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Headphones, ShieldCheck, Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export default function InstructorUnifiedInbox() {
  const { instructor, loading } = useInstructorAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("pupils");

  if (loading) {
    return (
      <InstructorPortalLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </InstructorPortalLayout>
    );
  }

  if (!instructor) {
    navigate("/instructor-app/login");
    return null;
  }

  return (
    <InstructorPortalLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Inbox</h1>
          <p className="text-sm text-muted-foreground">All your conversations in one place</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 h-10">
            <TabsTrigger value="pupils" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <MessageCircle className="h-3.5 w-3.5" />
              <span>Pupils</span>
              <MessageNotificationBadge instructorId={instructor.id} className="ml-0.5 scale-90" />
            </TabsTrigger>
            <TabsTrigger value="visitors" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Headphones className="h-3.5 w-3.5" />
              <span>Visitors</span>
              <VisitorChatBadge instructorId={instructor.id} className="ml-0.5 scale-90" />
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex items-center gap-1.5 text-xs sm:text-sm relative">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Support</span>
              <AdminMessageBadge />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pupils" className="mt-4">
            <InstructorInbox instructorId={instructor.id} />
          </TabsContent>

          <TabsContent value="visitors" className="mt-4">
            <VisitorChatManager instructorId={instructor.id} />
          </TabsContent>

          <TabsContent value="admin" className="mt-4">
            <AdminChatWindow instructorId={instructor.id} />
          </TabsContent>
        </Tabs>
      </div>
    </InstructorPortalLayout>
  );
}
