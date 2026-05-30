import { useNavigate, useParams } from "react-router-dom";
import { PupilCourseSummary } from "@/components/courses/PupilCourseSummary";

export default function InstructorCourseSummaryDetailPage() {
  const { pupilId } = useParams<{ pupilId: string }>();
  const navigate = useNavigate();
  if (!pupilId) return null;
  return (
    <PupilCourseSummary
      pupilId={pupilId}
      onBack={() => navigate("/instructor/course-summaries")}
    />
  );
}
