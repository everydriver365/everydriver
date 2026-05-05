import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { AppearanceSettings } from "@/components/instructor/AppearanceSettings";

export default function InstructorBrandingPage() {
  const { instructor } = useInstructorAuth();
  if (!instructor?.id) return null;
  return (
    <div className="instructor-portal min-h-screen bg-[#F4F7F6]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Branding</h1>
          <p className="text-sm text-muted-foreground">Layout, hero image and wallpaper for your portal and mini-website.</p>
        </div>
        <AppearanceSettings instructorId={instructor.id} />
      </div>
    </div>
  );
}
