import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { InstructorPageHeader } from "@/components/instructor/InstructorPageHeader";
import { DocumentVault } from "@/components/instructor/DocumentVault";

export default function InstructorDocumentVault() {
  const { instructor } = useInstructorAuth();
  if (!instructor) return null;
  return (
    <div className="min-h-screen bg-background">
      <InstructorPageHeader title="Document Vault" />
      <div className="p-4 max-w-2xl mx-auto pb-24">
        <DocumentVault instructorId={instructor.id} />
      </div>
    </div>
  );
}
