import { useNavigate } from "react-router-dom";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { DashboardShell } from "@/components/instructor/dashboardV2/DashboardShell";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useCombinedNotificationCount } from "@/hooks/useCombinedNotificationCount";
import { useIsMobile } from "@/hooks/use-mobile";
import { FindAppointmentBody } from "@/components/shared/FindAppointmentBody";
import { toast } from "sonner";

export default function InstructorFindAppointmentPage() {
  const { instructor, signOut } = useInstructorAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { total: notificationCount } = useCombinedNotificationCount(instructor?.id);

  const onSelect = (slot: any) => {
    toast.success(`Selected ${slot.startTime} on ${slot.date}`);
    navigate(`/instructor/schedule?date=${slot.date}&time=${slot.startTime}`);
  };

  const body = (
    <FindAppointmentBody
      instructorIds={instructor?.id ? [instructor.id] : []}
      mode="instructor"
      variant="page"
      onSelectSlot={onSelect}
      onCancel={() => navigate(-1)}
    />
  );

  if (isMobile) {
    return (
      <InstructorPortalLayout>
        <div className="p-3 md:p-4 h-[calc(100vh-4rem)]">
          <div className="h-full max-w-2xl mx-auto rounded-[24px] overflow-hidden shadow-sm">
            {body}
          </div>
        </div>
      </InstructorPortalLayout>
    );
  }

  const initials = (instructor?.name || "I")
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate("/instructor-app/login");
  };

  return (
    <DashboardShell
      userInitials={initials}
      userName={instructor?.name || "Instructor"}
      notificationCount={notificationCount}
      onSignOut={handleSignOut}
      onAskED={() => window.dispatchEvent(new CustomEvent("dsm:open-ai"))}
      onBell={() => navigate("/instructor/notifications")}
    >
      <div className="max-w-3xl mx-auto">{body}</div>
    </DashboardShell>
  );
}
