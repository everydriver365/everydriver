import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { CallAnsweringSettings } from "@/components/instructor/CallAnsweringSettings";

export default function InstructorCallAnsweringPage() {
  const { instructor } = useInstructorAuth();
  if (!instructor?.id) return null;
  return (
    <div className="instructor-portal min-h-screen bg-[#F4F7F6]">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Call Answering</h1>
          <p className="text-sm text-muted-foreground">Choose how incoming calls are answered when you can't pick up.</p>
        </div>
        <CallAnsweringSettings instructorId={instructor.id} />
      </div>
    </div>
  );
}
