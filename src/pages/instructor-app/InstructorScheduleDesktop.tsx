import { useNavigate } from "react-router-dom";
import { DashboardShell } from "@/components/instructor/dashboardV2/DashboardShell";
import { MultiDayScheduleView } from "@/components/instructor/MultiDayScheduleView";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useCombinedNotificationCount } from "@/hooks/useCombinedNotificationCount";

export default function InstructorScheduleDesktop() {
  const navigate = useNavigate();
  const { instructor, signOut } = useInstructorAuth();
  const { total: notificationCount } = useCombinedNotificationCount(instructor?.id);
  const instructorId = instructor?.id;

  const handleSignOut = async () => {
    await signOut();
    navigate("/instructor-app/login");
  };

  const initials =
    (instructor?.name || "")
      .split(" ")
      .map((s) => s[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "ID";

  return (
    <DashboardShell
      userInitials={initials}
      userName={instructor?.name || "Instructor"}
      notificationCount={notificationCount}
      onSignOut={handleSignOut}
      onAskED={() => window.dispatchEvent(new CustomEvent("dsm:open-ai"))}
      onBell={() => navigate("/instructor/notifications")}
    >
      <div className="mx-auto" style={{ maxWidth: 880 }}>
        {instructorId && <MultiDayScheduleView instructorId={instructorId} />}
      </div>
    </DashboardShell>
  );
}
