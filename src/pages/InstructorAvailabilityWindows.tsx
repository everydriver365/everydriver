import { useQueryClient } from "@tanstack/react-query";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { InstructorPageHeader } from "@/components/instructor/InstructorPageHeader";
import { AvailabilityWindowsManager } from "@/components/instructor/AvailabilityWindowsManager";
import { IntensiveOnlyToggleCard } from "@/components/instructor/IntensiveOnlyToggleCard";

export default function InstructorAvailabilityWindows() {
  const { instructor } = useInstructorAuth();
  const queryClient = useQueryClient();
  if (!instructor) return null;
  return (
    <div className="min-h-screen bg-background">
      <InstructorPageHeader title="Availability Windows" />
      <div className="p-4 max-w-2xl mx-auto pb-24">
        <IntensiveOnlyToggleCard
          instructorId={instructor.id}
          onChanged={() =>
            queryClient.invalidateQueries({ queryKey: ["availability-windows"] })
          }
        />
        <AvailabilityWindowsManager instructorId={instructor.id} />
      </div>
    </div>
  );
}
