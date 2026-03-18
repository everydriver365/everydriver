import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { InstructorPageHeader } from "@/components/instructor/InstructorPageHeader";
import { DigitalChecklistManager } from "@/components/instructor/DigitalChecklistManager";

export default function InstructorChecklists() {
  const { instructor } = useInstructorAuth();
  if (!instructor) return null;
  return (
    <div className="min-h-screen bg-background">
      <InstructorPageHeader title="Digital Checklists" />
      <div className="p-4 max-w-2xl mx-auto pb-24">
        <DigitalChecklistManager instructorId={instructor.id} />
      </div>
    </div>
  );
}
