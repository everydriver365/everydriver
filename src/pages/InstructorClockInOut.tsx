import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { InstructorPageHeader } from "@/components/instructor/InstructorPageHeader";
import { GPSClockInOut } from "@/components/instructor/GPSClockInOut";

export default function InstructorClockInOut() {
  const { instructor } = useInstructorAuth();
  if (!instructor) return null;
  return (
    <div className="min-h-screen bg-background">
      <InstructorPageHeader title="Clock In/Out" />
      <div className="p-4 max-w-2xl mx-auto pb-24">
        <GPSClockInOut instructorId={instructor.id} />
      </div>
    </div>
  );
}
