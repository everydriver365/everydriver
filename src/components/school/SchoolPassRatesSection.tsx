import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CompactStandardsCheck } from "@/components/instructor/CompactStandardsCheck";
import { PassRateDashboard } from "@/components/instructor/PassRateDashboard";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Target, User } from "lucide-react";

interface SchoolPassRatesSectionProps {
  instructorIds: string[];
}

interface InstructorInfo {
  id: string;
  name: string;
}

export default function SchoolPassRatesSection({ instructorIds }: SchoolPassRatesSectionProps) {
  const [instructors, setInstructors] = useState<InstructorInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (instructorIds.length === 0) {
      setLoading(false);
      return;
    }
    const fetchNames = async () => {
      const { data } = await supabase
        .from("instructors")
        .select("id, name")
        .in("id", instructorIds);
      setInstructors(data?.map(d => ({ id: d.id, name: d.name || "Unknown Instructor" })) || []);
      setLoading(false);
    };
    fetchNames();
  }, [instructorIds]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (instructors.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <Target className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No instructors linked to this school yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-1">Pass Rates & DVSA Triggers</h2>
        <p className="text-sm text-muted-foreground">
          Per-instructor pass rates and DVSA Standards Check trigger status
        </p>
      </div>

      {instructors.map((instructor) => (
        <div key={instructor.id} className="space-y-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <h3 className="text-lg font-medium">{instructor.name}</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CompactStandardsCheck instructorId={instructor.id} />
            <PassRateDashboard instructorId={instructor.id} />
          </div>
        </div>
      ))}
    </div>
  );
}
