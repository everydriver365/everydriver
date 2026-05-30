import { useState } from "react";
import { PupilCoursesList } from "@/components/courses/PupilCoursesList";
import { PupilCourseSummary } from "@/components/courses/PupilCourseSummary";

export default function SchoolCourseSummariesSection({ instructorIds }: { instructorIds: string[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  if (selected) {
    return <PupilCourseSummary pupilId={selected} onBack={() => setSelected(null)} />;
  }
  return <PupilCoursesList instructorIds={instructorIds} onSelect={setSelected} />;
}
