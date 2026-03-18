import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { InstructorPageHeader } from "@/components/instructor/InstructorPageHeader";
import { AvailabilityWindowsManager } from "@/components/instructor/AvailabilityWindowsManager";

export default function InstructorAvailabilityWindows() {
  const { instructor } = useInstructorAuth();
  if (!instructor) return null;
  return (
    <div className="min-h-screen bg-background">
      <InstructorPageHeader title="Availability Windows" />
      <div className="p-4 max-w-2xl mx-auto pb-24">
        <AvailabilityWindowsManager instructorId={instructor.id} />
      </div>
    </div>
  );
}
