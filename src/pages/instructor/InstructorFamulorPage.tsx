import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { FamulorHub } from "@/components/famulor/FamulorHub";
import { PortalBreadcrumbs } from "@/components/instructor/PortalBreadcrumbs";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";

export default function InstructorFamulorPage() {
  const { instructor } = useInstructorAuth();
  if (!instructor?.id) return null;
  return (
    <InstructorPortalLayout>
      <div className="instructor-portal min-h-screen bg-[#F4F7F6]">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-6 space-y-2">
            <PortalBreadcrumbs items={[{ label: "Telephone", to: "/instructor/famulor" }, { label: "Telephone Calls and Answering" }]} />
            <h1 className="text-2xl font-semibold tracking-tight">Telephone Calls and Answering</h1>
            <p className="text-sm text-muted-foreground">Calls, campaigns, agents and analytics — powered by Famulor.</p>
          </div>
          <FamulorHub scope="instructor" instructorId={instructor.id} />
        </div>
      </div>
    </InstructorPortalLayout>
  );
}
