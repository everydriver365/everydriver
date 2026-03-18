import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { InstructorPageHeader } from "@/components/instructor/InstructorPageHeader";
import { TeamMessagingChannels } from "@/components/instructor/TeamMessagingChannels";

export default function InstructorTeamChannels() {
  const { instructor } = useInstructorAuth();
  if (!instructor) return null;
  return (
    <div className="min-h-screen bg-background">
      <InstructorPageHeader title="Team Channels" />
      <div className="p-4 max-w-2xl mx-auto pb-24">
        <TeamMessagingChannels instructorId={instructor.id} />
      </div>
    </div>
  );
}
