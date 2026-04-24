import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { DashcamGalleryView } from "@/components/instructor/dashcam/DashcamGalleryView";
import { Camera } from "lucide-react";

export default function InstructorDashcamGallery() {
  const { instructor } = useInstructorAuth();

  return (
    <InstructorPortalLayout>
      <div
        style={{
          minHeight: "100vh",
          background: "#F2F2F7",
        }}
        className="space-y-4 pb-24 -m-4 p-4"
      >
        <div className="flex items-center gap-2">
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: "#F2F2F7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Camera style={{ width: 16, height: 16, color: "#8E8E93" }} />
          </div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#000" }}>
            Dashcam Footage
          </h1>
        </div>
        {instructor?.id ? (
          <DashcamGalleryView instructorId={instructor.id} />
        ) : (
          <p style={{ color: "#8E8E93" }}>Loading...</p>
        )}
      </div>
    </InstructorPortalLayout>
  );
}
