import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { TermsConditionsEditor } from "@/components/instructor/TermsConditionsEditor";

export default function InstructorTermsSettingsPage() {
  const { instructor } = useInstructorAuth();
  if (!instructor?.id) return null;
  return (
    <div className="instructor-portal min-h-screen bg-[#F4F7F6]">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Terms & Conditions</h1>
          <p className="text-sm text-muted-foreground">Create the terms pupils sign before booking.</p>
        </div>
        <TermsConditionsEditor instructorId={instructor.id} />
      </div>
    </div>
  );
}
