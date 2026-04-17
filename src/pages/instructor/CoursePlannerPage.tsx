import { useNavigate } from "react-router-dom";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { CoursePlannerForm } from "@/components/course-planner/CoursePlannerForm";

export default function CoursePlannerPage() {
  const navigate = useNavigate();
  const { instructor } = useInstructorAuth();

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      {/* Header bar */}
      <header className="flex items-center gap-2 px-4 pt-[calc(0.5rem+env(safe-area-inset-top))] pb-3 border-b bg-card">
        <button
          onClick={() => navigate(-1)}
          className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-muted active:scale-95 transition"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="h-9 w-9 rounded-xl bg-[#E8ECF1] flex items-center justify-center">
          <GraduationCap className="h-5 w-5 text-[#2A394F]" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold leading-tight truncate">Course Planner</h1>
          <p className="text-[11px] text-muted-foreground truncate">Plan a full course up to test day</p>
        </div>
      </header>

      {/* Body — single scroll surface, no nested sheets */}
      <div className="flex-1 min-h-0">
        <CoursePlannerForm
          mode="instructor"
          instructorId={instructor?.id || null}
          instructorName={instructor?.name || null}
          source="instructor_app"
          layout="page"
          showHeader={false}
          onComplete={() => navigate("/instructor")}
        />
      </div>
    </div>
  );
}
