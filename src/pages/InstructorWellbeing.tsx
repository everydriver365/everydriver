import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { InstructorPageHeader } from "@/components/instructor/InstructorPageHeader";
import { WellbeingMoodTracker } from "@/components/instructor/WellbeingMoodTracker";

export default function InstructorWellbeing() {
  const { instructor } = useInstructorAuth();
  if (!instructor) return null;
  return (
    <div className="min-h-screen bg-background">
      <InstructorPageHeader title="Wellbeing" />
      <div className="p-4 max-w-2xl mx-auto pb-24">
        <WellbeingMoodTracker instructorId={instructor.id} />
      </div>
    </div>
  );
}
