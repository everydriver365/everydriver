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
      <div className="p-3 md:p-4 h-[calc(100vh-4rem)]">
        <div className="h-full max-w-2xl mx-auto rounded-[24px] overflow-hidden shadow-sm">
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
