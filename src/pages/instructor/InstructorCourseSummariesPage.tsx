import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PupilCoursesList } from "@/components/courses/PupilCoursesList";

export default function InstructorCourseSummariesPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 pt-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/instructor">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Portal
          </Link>
        </Button>
      </div>
      <PupilCoursesList onSelect={(id) => navigate(`/instructor/course-summaries/${id}`)} />
    </div>
  );
}
