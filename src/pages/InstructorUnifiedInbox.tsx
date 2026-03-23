import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { InstructorInbox } from "@/components/instructor/InstructorInbox";
import { VisitorChatManager } from "@/components/instructor/VisitorChatManager";
import { AdminChatWindow } from "@/components/instructor/AdminChatWindow";
import { WhatsAppInbox } from "@/components/instructor/WhatsAppInbox";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { MessageNotificationBadge } from "@/components/instructor/MessageNotificationBadge";
import { VisitorChatBadge } from "@/components/instructor/VisitorChatBadge";
import { AdminMessageBadge } from "@/components/instructor/AdminMessageBadge";
import { WhatsAppBadge } from "@/components/instructor/WhatsAppBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Headphones, ShieldCheck, Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

// WhatsApp icon as inline SVG since lucide doesn't have it
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

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
          <TabsList className="w-full grid grid-cols-4 h-10">
            <TabsTrigger value="pupils" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <MessageCircle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Pupils</span>
              <MessageNotificationBadge instructorId={instructor.id} className="ml-0.5 scale-90" />
            </TabsTrigger>
            <TabsTrigger value="visitors" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Headphones className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Visitors</span>
              <VisitorChatBadge instructorId={instructor.id} className="ml-0.5 scale-90" />
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <WhatsAppIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
              <WhatsAppBadge instructorId={instructor.id} className="ml-0.5 scale-90" />
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex items-center gap-1.5 text-xs sm:text-sm relative">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Support</span>
              <AdminMessageBadge />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pupils" className="mt-4">
            <InstructorInbox instructorId={instructor.id} />
          </TabsContent>

          <TabsContent value="visitors" className="mt-4">
            <VisitorChatManager instructorId={instructor.id} />
          </TabsContent>

          <TabsContent value="whatsapp" className="mt-4">
            <WhatsAppInbox instructorId={instructor.id} />
          </TabsContent>

          <TabsContent value="admin" className="mt-4">
            <AdminChatWindow instructorId={instructor.id} />
          </TabsContent>
        </Tabs>
      </div>
    </InstructorPortalLayout>
  );
}
