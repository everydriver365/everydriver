import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { parseISO } from "date-fns";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { DashboardShell } from "@/components/instructor/dashboardV2/DashboardShell";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useCombinedNotificationCount } from "@/hooks/useCombinedNotificationCount";
import { useIsMobile } from "@/hooks/use-mobile";
import { FindAppointmentBody } from "@/components/shared/FindAppointmentBody";
import { AddLessonSheet } from "@/components/instructor/AddLessonSheet";

export default function InstructorFindAppointmentPage() {
  const { instructor, signOut } = useInstructorAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const nextOnly = searchParams.get("next") === "1";
  const { total: notificationCount } = useCombinedNotificationCount(instructor?.id);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [defaultDate, setDefaultDate] = useState<Date | undefined>(undefined);
  const [defaultStartTime, setDefaultStartTime] = useState<string | undefined>(undefined);
  const [defaultDurationHours, setDefaultDurationHours] = useState<string | undefined>(undefined);

  const onSelect = (slot: any) => {
    try {
      setDefaultDate(parseISO(slot.date));
    } catch {
      setDefaultDate(undefined);
    }
    setDefaultStartTime(slot.startTime);
    if (slot.durationMinutes) {
      setDefaultDurationHours(String(slot.durationMinutes / 60));
    }
    setSheetOpen(true);
  };

  const body = (
    <FindAppointmentBody
      instructorIds={instructor?.id ? [instructor.id] : []}
      mode="instructor"
      variant="page"
      nextOnly={nextOnly}
      onSelectSlot={onSelect}
      onCancel={() => navigate(-1)}
    />
  );

  const sheet = instructor?.id ? (
    <AddLessonSheet
      open={sheetOpen}
      onOpenChange={setSheetOpen}
      instructorId={instructor.id}
      defaultDate={defaultDate}
      defaultStartTime={defaultStartTime}
      defaultDurationHours={defaultDurationHours}
      onSuccess={() => {
        setSheetOpen(false);
      }}
    />
  ) : null;

  if (isMobile) {
    return (
      <InstructorPortalLayout>
        <div className="p-3 md:p-4 h-[calc(100vh-4rem)]">
          <div className="h-full max-w-2xl mx-auto rounded-[24px] overflow-hidden shadow-sm">
            {body}
          </div>
        </div>
        {sheet}
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
      {sheet}
    </DashboardShell>
  );
}
