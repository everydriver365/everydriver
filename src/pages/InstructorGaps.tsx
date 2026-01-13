import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GapsFiller } from "@/components/instructor/GapsFiller";
import { InstructorBottomNav } from "@/components/instructor/InstructorBottomNav";
import { useIsMobile } from "@/hooks/use-mobile";

const MOCK_INSTRUCTOR_ID = "550e8400-e29b-41d4-a716-446655440000";

export default function InstructorGaps() {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-primary px-4 py-3 flex items-center gap-3">
        <Link to="/instructor">
          <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-lg font-semibold text-primary-foreground">Fill Gaps</h1>
      </div>

      {/* Content */}
      <div className="p-4">
        <GapsFiller instructorId={MOCK_INSTRUCTOR_ID} />
      </div>

      {isMobile && <InstructorBottomNav />}
    </div>
  );
}