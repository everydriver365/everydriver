import { useNavigate } from "react-router-dom";
import { PupilCoursesList } from "@/components/courses/PupilCoursesList";

export default function InstructorCourseSummariesPage() {
  const navigate = useNavigate();
  return <PupilCoursesList onSelect={(id) => navigate(`/instructor/course-summaries/${id}`)} />;
}
