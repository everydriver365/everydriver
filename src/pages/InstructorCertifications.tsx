import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { CertificationTracker } from "@/components/instructor/CertificationTracker";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function InstructorCertificationsPage() {
  const { instructor } = useInstructorAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1">
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Certifications & Progress</h1>
      </div>
      <div className="p-4">
        <CertificationTracker />
      </div>
    </div>
  );
}
