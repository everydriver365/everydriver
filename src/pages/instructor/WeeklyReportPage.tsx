import { useNavigate } from "react-router-dom";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { WeeklyReportCard } from "@/components/instructor/WeeklyReportCard";

export default function WeeklyReportPage() {
  const navigate = useNavigate();
  const { authInstructorId } = useInstructorAuth();

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">Weekly Report</h1>
        </div>
      </div>
      <div className="p-4 max-w-lg mx-auto">
        <WeeklyReportCard instructorId={authInstructorId} />
      </div>
    </div>
  );
}
