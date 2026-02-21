import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { DashcamGalleryView } from "@/components/instructor/dashcam/DashcamGalleryView";
import { Camera } from "lucide-react";

export default function InstructorDashcamGallery() {
  const { instructor } = useInstructorAuth();

  return (
    <InstructorPortalLayout>
      <div className="space-y-6 p-3 sm:p-4 md:p-6 pb-24">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Camera className="h-4 w-4 text-primary" />
            </div>
            Dashcam Footage
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm ml-10 hidden sm:block">
            View and download recorded clips from your Geotab dashcam
          </p>
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
