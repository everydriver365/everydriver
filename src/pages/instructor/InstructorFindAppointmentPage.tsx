import { CalendarSearch } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { FindAppointmentBody } from "@/components/shared/FindAppointmentBody";
import { toast } from "sonner";

export default function InstructorFindAppointmentPage() {
  const { instructor } = useInstructorAuth();
  const navigate = useNavigate();

  return (
    <InstructorPortalLayout>
      <div className="p-4 md:p-6 h-[calc(100vh-4rem)] flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <CalendarSearch className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-lg font-semibold leading-tight">Find appointments</h1>
            <p className="text-xs text-muted-foreground">Search your diary for the next available slot.</p>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <FindAppointmentBody
            instructorIds={instructor?.id ? [instructor.id] : []}
            mode="instructor"
            variant="page"
            onSelectSlot={(slot) => {
              toast.success(`Selected ${slot.startTime} on ${slot.date}`);
              navigate(`/instructor/schedule?date=${slot.date}&time=${slot.startTime}`);
            }}
            onCancel={() => navigate(-1)}
          />
        </div>
      </div>
    </InstructorPortalLayout>
  );
}
