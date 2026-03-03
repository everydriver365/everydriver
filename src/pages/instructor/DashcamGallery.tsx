import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { DashcamGalleryView } from "@/components/instructor/dashcam/DashcamGalleryView";
import { Camera } from "lucide-react";

export default function InstructorDashcamGallery() {
  const { instructor } = useInstructorAuth();

  return (
    <InstructorPortalLayout>
      <div className="space-y-4 pb-24">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center shrink-0">
              <Camera className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            </div>
            Dashcam Footage
          </h1>
        </div>
        {instructor?.id ? (
          <DashcamGalleryView instructorId={instructor.id} />
        ) : (
          <p className="text-muted-foreground">Loading...</p>
        )}
      </div>
    </InstructorPortalLayout>
  );
}
